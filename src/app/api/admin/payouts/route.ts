/**
 * Admin Payouts API
 * GET  /api/admin/payouts — list bookings awaiting manual payout
 * PATCH /api/admin/payouts — mark a payout COMPLETED or FAILED
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { enqueueEmail, wrapEmailHtml } from "@/lib/tasks";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    // V12 fix: exclude landlords whose bank details changed in the last 24h.
    // The 24h cool-off lets the landlord respond to the change-notification
    // email if the change wasn't them.
    const quarantineCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Optimized: Use select instead of include+nested queries to avoid N+1 payments
    const payouts = await prisma.booking.findMany({
      where: {
        movedInConfirmedAt: { not: null },
        payoutStatus: { in: ["PENDING", "PROCESSING"] },
        status: "PAID",
        property: {
          landlord: {
            OR: [
              { bankChangeAt: null },
              { bankChangeAt: { lt: quarantineCutoff } },
            ],
          },
        },
      },
      select: {
        id: true,
        amount: true,
        movedInConfirmedAt: true,
        student: { select: { id: true, name: true, email: true } },
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            location: { select: { name: true } },
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                bankAccountNumber: true,
                bankName: true,
                bankAccountName: true,
              },
            },
          },
        },
      },
      orderBy: { movedInConfirmedAt: "asc" }, // oldest first
    });

    return NextResponse.json({ success: true, data: payouts });
  } catch (error) {
    console.error("[ADMIN PAYOUTS GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payouts." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    const { bookingId, action } = await request.json();
    if (!bookingId || !["COMPLETE", "FAIL"].includes(action)) {
      return NextResponse.json({ success: false, error: "bookingId and action (COMPLETE|FAIL) required." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        amount: true,
        movedInConfirmedAt: true,
        payoutStatus: true,
        student: { select: { id: true, name: true, email: true } },
        property: {
          select: {
            title: true,
            price: true,
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                bankName: true,
                bankAccountName: true,
                bankChangeAt: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }
    if (!booking.movedInConfirmedAt) {
      return NextResponse.json({ success: false, error: "Student has not confirmed move-in yet." }, { status: 409 });
    }

    // V13 fix: block invalid state transitions.
    // Allowed: PENDING/PROCESSING → COMPLETED or FAILED.
    // Blocked: COMPLETED → anything (terminal), FAILED → COMPLETED (masks missing transfer).
    // If a genuinely FAILED payout needs to be retried, admin must re-initiate
    // the Paystack transfer (future endpoint), which resets state to PROCESSING.
    if (booking.payoutStatus === "COMPLETED") {
      return NextResponse.json({ success: false, error: "Payout is already COMPLETED and cannot be changed." }, { status: 409 });
    }
    if (booking.payoutStatus === "FAILED" && action === "COMPLETE") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot flip a FAILED payout to COMPLETED without re-initiating the transfer. Contact engineering.",
        },
        { status: 409 },
      );
    }

    // V12 fix: block COMPLETE during the 24h bank-change quarantine. Admin can
    // still mark FAILED (e.g. to cancel a queued payout they no longer trust).
    if (action === "COMPLETE" && booking.property.landlord.bankChangeAt) {
      const msSinceChange = Date.now() - new Date(booking.property.landlord.bankChangeAt).getTime();
      if (msSinceChange < 24 * 60 * 60 * 1000) {
        const hoursRemaining = Math.ceil((24 * 60 * 60 * 1000 - msSinceChange) / (60 * 60 * 1000));
        return NextResponse.json(
          {
            success: false,
            error: `Landlord recently changed their bank account. Payout quarantine ends in ~${hoursRemaining}h.`,
          },
          { status: 409 },
        );
      }
    }

    const newStatus = action === "COMPLETE" ? "COMPLETED" : "FAILED";
    console.log("[AUDIT][payouts]", {
      at: new Date().toISOString(),
      adminId: session.user.id,
      adminEmail: session.user.email,
      bookingId,
      prevStatus: booking.payoutStatus,
      newStatus,
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { payoutStatus: newStatus },
    });

    const landlord = booking.property.landlord;
    const amountNaira = Number(booking.amount ?? booking.property.price);
    const amountStr = amountNaira.toLocaleString("en-NG");

    // Notify landlord (in-app)
    notifyUser({
      userId: landlord.id,
      type: "PAYMENT",
      title: action === "COMPLETE" ? "Rent payment received" : "Payout issue",
      message:
        action === "COMPLETE"
          ? `Your rent payment for ${booking.property.title} has been transferred to your bank account.`
          : `There was an issue releasing your payment for ${booking.property.title}. Please contact RentalHub support.`,
      link: "/landlord",
    }).catch(console.error);

    // Notify student (in-app)
    notifyUser({
      userId: booking.student.id,
      type: "PAYMENT",
      title: action === "COMPLETE" ? "Payment released to landlord" : "Payout issue",
      message:
        action === "COMPLETE"
          ? `Your landlord has been paid for ${booking.property.title}.`
          : `There was an issue releasing the payment for ${booking.property.title}. RentalHub support will reach out.`,
      link: "/student",
    }).catch(console.error);

    // Queue emails
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`;
    if (action === "COMPLETE") {
      const landlordHtml = wrapEmailHtml("Rent Payment Transferred", `
        <p>Hi <strong>${landlord.name}</strong>,</p>
        <p>Your rent payment has been released and transferred to your bank account.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Tenant</td><td style="padding:8px 0;">${booking.student.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;font-weight:600;color:#16a34a;">&#8358;${amountStr}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Bank</td><td style="padding:8px 0;">${landlord.bankName ?? "your registered bank"}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Account Name</td><td style="padding:8px 0;">${landlord.bankAccountName ?? landlord.name}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px;">Please allow 1–3 business days for the funds to reflect in your account. If you have questions, contact <a href="mailto:support@rentalhub.ng" style="color:#E67E22;">support@rentalhub.ng</a>.</p>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}/landlord" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Dashboard</a>
        </p>
      `);
      enqueueEmail(landlord.email, `Rent payment transferred — ${booking.property.title}`, landlordHtml).catch(console.error);

      const studentHtml = wrapEmailHtml("Payment Released to Landlord", `
        <p>Hi <strong>${booking.student.name}</strong>,</p>
        <p>Your rent payment has been successfully released to your landlord. Your tenancy is now fully active.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Landlord</td><td style="padding:8px 0;">${landlord.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;font-weight:600;">&#8358;${amountStr}</td></tr>
        </table>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}/student" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Dashboard</a>
        </p>
      `);
      enqueueEmail(booking.student.email, `Payment released to landlord — ${booking.property.title}`, studentHtml).catch(console.error);
    } else {
      const landlordFailHtml = wrapEmailHtml("Payout Issue", `
        <p>Hi <strong>${landlord.name}</strong>,</p>
        <p>We encountered an issue releasing your rent payment for <strong>${booking.property.title}</strong>. Our support team is investigating and will contact you shortly.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;font-weight:600;">&#8358;${amountStr}</td></tr>
        </table>
        <p>Please contact us at <a href="mailto:support@rentalhub.ng" style="color:#E67E22;">support@rentalhub.ng</a> if you do not hear back within 24 hours.</p>
      `);
      enqueueEmail(landlord.email, `Payout issue — ${booking.property.title}`, landlordFailHtml).catch(console.error);

      const studentFailHtml = wrapEmailHtml("Payment Release Issue", `
        <p>Hi <strong>${booking.student.name}</strong>,</p>
        <p>There was an issue releasing the payment for <strong>${booking.property.title}</strong> to your landlord. Our support team is on it and will resolve this as soon as possible.</p>
        <p>Please contact us at <a href="mailto:support@rentalhub.ng" style="color:#E67E22;">support@rentalhub.ng</a> if you have concerns.</p>
      `);
      enqueueEmail(booking.student.email, `Payment release issue — ${booking.property.title}`, studentFailHtml).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: action === "COMPLETE" ? "Payout marked as completed." : "Payout marked as failed.",
    });
  } catch (error) {
    console.error("[ADMIN PAYOUTS PATCH ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update payout." }, { status: 500 });
  }
}
