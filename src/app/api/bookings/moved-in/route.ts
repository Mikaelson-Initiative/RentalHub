/**
 * POST /api/bookings/moved-in
 * Student confirms they have moved in.
 * Sets movedInConfirmedAt, updates moveInDate if provided,
 * then notifies all admins so they can manually release the payout to the landlord.
 * Body: { bookingId, moveInDate? }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { enqueueEmail, wrapEmailHtml } from "@/lib/tasks";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Only students can confirm move-in" }, { status: 403 });
    }

    const { bookingId, moveInDate } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            location: { select: { name: true } },
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                bankAccountNumber: true,
                bankName: true,
                bankAccountName: true,
              },
            },
          },
        },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }
    if (booking.studentId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not your booking" }, { status: 403 });
    }
    if (booking.status !== "PAID") {
      return NextResponse.json({ success: false, error: "Booking must be paid before confirming move-in" }, { status: 409 });
    }
    if (booking.movedInConfirmedAt) {
      return NextResponse.json({ success: false, error: "Move-in already confirmed" }, { status: 409 });
    }

    const landlord = booking.property.landlord;

    // Update booking: confirmed move-in, payout stays PENDING until admin releases it
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        movedInConfirmedAt: new Date(),
        payoutStatus: "PENDING",
        ...(moveInDate && { moveInDate: new Date(moveInDate) }),
      },
    });

    const amountNaira = Number(booking.amount ?? booking.property.price);
    const movedInDateStr = new Date().toLocaleDateString("en-NG", { dateStyle: "medium" });
    const studentDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/student`;
    const landlordDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/landlord`;

    // Notify landlord (in-app)
    notifyUser({
      userId: landlord.id,
      type: "PAYMENT",
      title: "Tenant has moved in",
      message: `${booking.student.name} confirmed move-in for ${booking.property.title}. RentalHub will release your payment shortly.`,
      link: "/landlord",
    }).catch(console.error);

    // Queue email to landlord
    const landlordHtml = wrapEmailHtml("Tenant Has Moved In", `
      <p>Hi <strong>${landlord.name}</strong>,</p>
      <p>Your tenant <strong>${booking.student.name}</strong> has confirmed their move-in. RentalHub is processing the release of their rent payment to your bank account.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Tenant</td><td style="padding:8px 0;">${booking.student.name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;font-weight:600;">&#8358;${amountNaira.toLocaleString("en-NG")}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Move-in Date</td><td style="padding:8px 0;">${movedInDateStr}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px;">You will receive a separate email once the payment has been transferred to your bank account.</p>
      <p style="margin:28px 0;">
        <a href="${landlordDashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Dashboard</a>
      </p>
    `);
    enqueueEmail(landlord.email, `Tenant moved in — ${booking.property.title}`, landlordHtml).catch(console.error);

    // Queue email to student
    const studentHtml = wrapEmailHtml("Move-In Confirmed", `
      <p>Hi <strong>${booking.student.name}</strong>,</p>
      <p>We have received your move-in confirmation. RentalHub will now process the release of your rent payment to the landlord.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Location</td><td style="padding:8px 0;">${booking.property.location?.name ?? ""}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Landlord</td><td style="padding:8px 0;">${landlord.name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Move-in Date</td><td style="padding:8px 0;font-weight:600;">${movedInDateStr}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px;">Your landlord will be notified. You will receive a confirmation once the payment has been released.</p>
      <p style="margin:28px 0;">
        <a href="${studentDashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Dashboard</a>
      </p>
    `);
    enqueueEmail(booking.student.email, `Move-in confirmed — ${booking.property.title}`, studentHtml).catch(console.error);

    // Notify all admins so they can manually process the payout
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    // V21 fix: do NOT store the landlord's full bank account number in the
    // Notification table. Admin can see full details on /admin/payouts when
    // they actively view the record. Mask to last-4 here.
    const maskedAccount = landlord.bankAccountNumber
      ? `•••• ${landlord.bankAccountNumber.slice(-4)}`
      : "(not set)";

    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          userId: admin.id,
          type: "PAYMENT",
          title: "Payout action required",
          message: `${booking.student.name} has moved into ${booking.property.title}. Release ₦${amountNaira.toLocaleString("en-NG")} to ${landlord.name} (${landlord.bankName ?? "bank"} ${maskedAccount}). View full details in /admin/payouts.`,
          link: "/admin",
        }).catch(console.error),
      ),
    );

    return NextResponse.json({
      success: true,
      message: "Move-in confirmed! RentalHub will release the payment to your landlord shortly.",
      data: { payoutStatus: "PENDING" },
    });
  } catch (error) {
    console.error("[MOVED-IN ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
