/**
 * POST /api/payments/webhook
 * Handles Paystack webhook events.
 * Add this URL in Paystack Dashboard → Settings → Webhooks
 */
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { enqueueEmail, wrapEmailHtml } from "@/lib/tasks";
import { notifyUser } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
    if (!secret || !signature) {
      return NextResponse.json({ error: "Missing webhook signature configuration." }, { status: 401 });
    }

    // ✅ Verify webhook signature with timing-safe comparison
    const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
    const hashBuffer = Buffer.from(hash, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    // ✅ FIXED: Always use timingSafeEqual without length check
    // Length check before timingSafeEqual creates a timing side-channel
    // Now we always compare (timing-safe) regardless of length
    let isValid = false;
    try {
      isValid = timingSafeEqual(hashBuffer, signatureBuffer);
    } catch (error) {
      // timingSafeEqual throws if buffers are different lengths
      // We catch this and treat it as invalid signature
      isValid = false;
    }

    if (!isValid) {
      console.error("[WEBHOOK] Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("[WEBHOOK] Event:", event.event);

    if (event.event === "charge.success") {
      const { reference, amount, channel, metadata } = event.data;
      const bookingId = metadata?.bookingId;
      if (!bookingId) return NextResponse.json({ received: true });

      const amountNaira = amount / 100;

      // ── V4 fix: cross-check webhook amount against the Payment row recorded at
      // initiate time. Defence-in-depth against a compromised webhook source:
      // even with a valid HMAC, we refuse to mark a booking PAID if the amount
      // doesn't match what the student was supposed to pay.
      const paymentRecord = await prisma.payment.findFirst({
        where: { paystackRef: reference, bookingId },
        select: { id: true, amount: true },
      });

      if (!paymentRecord) {
        console.error("[WEBHOOK] charge.success with no matching Payment row", { reference, bookingId });
        return NextResponse.json({ received: true, ignored: "no-matching-payment" });
      }

      const expectedNaira = Number(paymentRecord.amount);
      // Allow ≤1 naira drift for kobo rounding; any larger gap is an integrity failure.
      if (Math.abs(expectedNaira - amountNaira) > 1) {
        console.error("[WEBHOOK] amount mismatch — refusing to mark PAID", {
          reference,
          bookingId,
          expected: expectedNaira,
          received: amountNaira,
        });
        await prisma.payment.updateMany({
          where: { paystackRef: reference },
          data: { status: "FAILED", metadata: { ...event.data, mismatchReason: "amount_mismatch" } },
        });
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

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

      if (!booking || booking.status === "PAID") return NextResponse.json({ received: true });

      await prisma.$transaction([
        prisma.payment.updateMany({
          where: { paystackRef: reference },
          data: { status: "SUCCESS", paidAt: new Date(), channel, metadata: event.data },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "PAID", paymentStatus: "SUCCESS", paidAt: new Date(), amount: amountNaira },
        }),
        prisma.property.update({
          where: { id: booking.propertyId },
          data: { vacantUnits: { decrement: 1 } },
        }),
      ]);

      const formatted = Number(amountNaira).toLocaleString("en-NG");
      const receiptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/student/bookings/${bookingId}/receipt`;
      const studentHtml = wrapEmailHtml("Payment Confirmed", `
        <p>Hi <strong>${booking.student.name}</strong>,</p>
        <p>Your payment has been received and your accommodation is now <strong style="color:#16a34a;">secured</strong>!</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Location</td><td style="padding:8px 0;">${booking.property.location.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Amount Paid</td><td style="padding:8px 0;font-weight:600;">&#8358;${formatted}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Reference</td><td style="padding:8px 0;font-family:monospace;font-size:13px;">${reference}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Landlord</td><td style="padding:8px 0;">${booking.property.landlord.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Landlord Phone</td><td style="padding:8px 0;">${booking.property.landlord.phoneNumber || 'Contact via dashboard'}</td></tr>
        </table>
        <p style="margin:28px 0;">
          <a href="${receiptUrl}" style="background:#E67E22;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Receipt</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Keep this email as proof of payment. Contact the landlord directly to arrange move-in.</p>
      `);
      enqueueEmail(booking.student.email, `Payment confirmed — ${booking.property.title}`, studentHtml).catch(console.error);

      const landlordDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/landlord`;
      const landlordHtml = wrapEmailHtml("Payment Received", `
        <p>Hi <strong>${booking.property.landlord.name}</strong>,</p>
        <p>A student has completed payment for your property. The booking is now fully confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${booking.property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Student</td><td style="padding:8px 0;">${booking.student.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;font-weight:600;">&#8358;${formatted}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Reference</td><td style="padding:8px 0;font-family:monospace;font-size:13px;">${reference}</td></tr>
        </table>
        <p style="margin:28px 0;">
          <a href="${landlordDashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Dashboard</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Please reach out to the student to coordinate move-in details.</p>
      `);
      enqueueEmail(booking.property.landlord.email, `Payment received — ${booking.property.title}`, landlordHtml).catch(console.error);

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
    }

    if (event.event === "transfer.success") {
      const { reference } = event.data;
      // Mark payout as completed on the booking that triggered this transfer
      await prisma.booking.updateMany({
        where: {
          payoutStatus: "PROCESSING",
          // reference is embedded as "PAYOUT-{bookingId}-{timestamp}"
          id: { in: reference?.startsWith("PAYOUT-") ? [reference.split("-")[1]] : [] },
        },
        data: { payoutStatus: "COMPLETED" },
      });
    }

    if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
      const { reference } = event.data;
      if (reference?.startsWith("PAYOUT-")) {
        const bookingId = reference.split("-")[1];
        await prisma.booking.update({
          where: { id: bookingId },
          data: { payoutStatus: "FAILED" },
        }).catch(console.error);
      }
    }

    if (event.event === "refund.processed") {
      const { transaction_reference, amount } = event.data;
      await prisma.payment.updateMany({
        where: { paystackRef: transaction_reference },
        data: { status: "REFUNDED", refundedAt: new Date(), refundAmount: amount / 100 },
      });
      await prisma.booking.updateMany({
        where: { payments: { some: { paystackRef: transaction_reference } } },
        data: { paymentStatus: "REFUNDED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
