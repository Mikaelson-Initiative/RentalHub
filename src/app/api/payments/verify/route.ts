/**
 * GET /api/payments/verify?reference=xxx&bookingId=xxx
 * Verifies a Paystack payment after redirect from Paystack checkout.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  sendPaymentConfirmedToStudent,
  sendPaymentReceivedToLandlord,
  sendBookingCancelledToStudent,
} from "@/lib/email";
import { enqueueEmail } from "@/lib/tasks";
import { notifyUser } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only students or admins can verify payments." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");
    const bookingId = searchParams.get("bookingId");

    if (!reference || !bookingId) return NextResponse.json({ success: false, error: "Reference and bookingId required." }, { status: 400 });

    // ── Ownership + idempotency check BEFORE hitting Paystack ──────────────
    // Fetch just the fields needed to authorise and short-circuit on already-paid.
    const bookingOwnership = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, status: true, paymentStatus: true, amount: true },
    });

    if (!bookingOwnership) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }

    // Students may only verify their own bookings.
    if (session.user.role === "STUDENT" && bookingOwnership.studentId !== session.user.id) {
      return NextResponse.json({ success: false, error: "You are not allowed to verify this booking payment." }, { status: 403 });
    }

    // Confirm the payment record belongs to this booking before calling Paystack.
    const paymentRecord = await prisma.payment.findFirst({
      where: { bookingId, paystackRef: reference },
      select: { id: true },
    });
    if (!paymentRecord) {
      return NextResponse.json({ success: false, error: "Invalid payment reference for this booking." }, { status: 400 });
    }

    // Early idempotency: if already paid, skip the Paystack round-trip entirely.
    if (bookingOwnership.status === "PAID" || bookingOwnership.paymentStatus === "SUCCESS") {
      return NextResponse.json({
        success: true,
        data: {
          paymentStatus: "SUCCESS",
          amountPaid: Number(bookingOwnership.amount),
          reference,
          alreadyVerified: true,
        },
      });
    }
    // ───────────────────────────────────────────────────────────────────────

    // Now safe to call Paystack.
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.status || verifyData.data.status !== "success") {
      await prisma.payment.updateMany({ where: { paystackRef: reference }, data: { status: "FAILED" } });
      return NextResponse.json({ success: false, error: "Payment was not successful.", data: { paymentStatus: "FAILED" } }, { status: 400 });
    }

    // Cross-check metadata bookingId if present.
    const metadataBookingId = verifyData?.data?.metadata?.bookingId as string | undefined;
    if (metadataBookingId && metadataBookingId !== bookingId) {
      return NextResponse.json({ success: false, error: "Payment reference does not match this booking." }, { status: 400 });
    }

    // Full booking fetch (needed for emails / notifications).
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            location: { select: { name: true } },
            landlord: { select: { id: true, name: true, email: true, phoneNumber: true } },
          },
        },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });

    const amountPaid = verifyData.data.amount / 100; // convert kobo back to naira

    const txResult = await prisma.$transaction(async (tx) => {
      const freshBooking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          amount: true,
          propertyId: true,
        },
      });

      if (!freshBooking) {
        return { alreadyVerified: false, amountPaid };
      }

      // Inner idempotency guard inside the transaction (race-condition safety).
      if (freshBooking.status === "PAID" || freshBooking.paymentStatus === "SUCCESS") {
        return { alreadyVerified: true, amountPaid: Number(freshBooking.amount ?? amountPaid) };
      }

      await tx.payment.updateMany({
        where: { paystackRef: reference },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          channel: verifyData.data.channel,
          metadata: verifyData.data,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAID",
          paymentStatus: "SUCCESS",
          paidAt: new Date(),
          amount: amountPaid,
        },
      });

      await tx.property.update({
        where: { id: freshBooking.propertyId },
        data: { vacantUnits: { decrement: 1 } },
      });

      // First-to-pay wins: cancel every other AWAITING_PAYMENT booking for this property.
      const cancelledCompetitors = await tx.booking.findMany({
        where: {
          propertyId: freshBooking.propertyId,
          id: { not: bookingId },
          status: "AWAITING_PAYMENT",
        },
        select: {
          id: true,
          student: { select: { id: true, name: true, email: true } },
          property: { select: { title: true, location: { select: { name: true } } } },
        },
      });

      if (cancelledCompetitors.length > 0) {
        await tx.booking.updateMany({
          where: {
            propertyId: freshBooking.propertyId,
            id: { not: bookingId },
            status: "AWAITING_PAYMENT",
          },
          data: { status: "CANCELLED" },
        });
      }

      return { alreadyVerified: false, amountPaid, cancelledCompetitors };
    });

    if (txResult.alreadyVerified) {
      return NextResponse.json({
        success: true,
        data: { paymentStatus: "SUCCESS", amountPaid: txResult.amountPaid, reference, alreadyVerified: true },
      });
    }

    // Notify any students whose competing AWAITING_PAYMENT bookings were auto-cancelled (fire-and-forget)
    const competitors = (txResult as { cancelledCompetitors?: { id: string; student: { id: string; name: string; email: string }; property: { title: string; location: { name: string } } }[] }).cancelledCompetitors ?? [];
    if (competitors.length > 0) {
      Promise.all(
        competitors.map(async (loser) => {
          await notifyUser({
            userId: loser.student.id,
            type: "BOOKING",
            title: "Property no longer available",
            message: `Another student completed payment first for ${loser.property.title}. Your booking has been cancelled automatically.`,
            link: "/student?tab=bookings",
          });
          sendBookingCancelledToStudent({
            studentEmail: loser.student.email,
            studentName: loser.student.name,
            propertyTitle: loser.property.title,
            propertyLocation: loser.property.location.name,
            cancelledBy: "landlord",
          }).catch(console.error);
        }),
      ).catch(console.error);
    }

    // Queue confirmation emails in background
    const formattedAmount = Number(txResult.amountPaid).toLocaleString("en-NG");
    const moveInStr = booking.moveInDate ? new Date(booking.moveInDate).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : undefined;

    enqueueEmail(booking.student.email, "Payment Confirmed",
      `Hi <strong>${booking.student.name}</strong>,<br/><br/>Your payment of ₦${formattedAmount} for <strong>${booking.property.title}</strong> in ${booking.property.location.name} has been confirmed. Landlord: ${booking.property.landlord.name}. Move-in: ${moveInStr || "TBD"}`
    ).catch(console.error);

    enqueueEmail(booking.property.landlord.email, "Payment Received",
      `Hi <strong>${booking.property.landlord.name}</strong>,<br/><br/><strong>${booking.student.name}</strong> completed payment of ₦${formattedAmount} for <strong>${booking.property.title}</strong>.`
    ).catch(console.error);

    await Promise.all([
      notifyUser({
        userId: booking.student.id,
        type: "PAYMENT",
        title: "Payment successful",
        message: `Your payment for ${booking.property.title} was confirmed.`,
        link: `/student/bookings/${bookingId}/receipt`,
      }),
      notifyUser({
        userId: booking.property.landlord.id,
        type: "PAYMENT",
        title: "Payment received",
        message: `${booking.student.name} completed payment for ${booking.property.title}.`,
        link: "/landlord",
      }),
    ]);

    return NextResponse.json({ success: true, data: { paymentStatus: "SUCCESS", amountPaid: txResult.amountPaid, reference } });
  } catch (error) {
    console.error("[PAYMENT VERIFY ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to verify payment." }, { status: 500 });
  }
}
