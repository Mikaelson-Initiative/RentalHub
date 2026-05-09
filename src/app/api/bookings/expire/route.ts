/**
 * POST /api/bookings/expire
 * Cancels all AWAITING_PAYMENT bookings whose expiresAt has passed.
 * Call this from a cron job or Vercel cron (add to vercel.json).
 * Protected by CRON_SECRET env var.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { enqueueEmail, wrapEmailHtml } from "@/lib/tasks";
import { notifyUser } from "@/lib/notifications";

export async function POST(request: Request) {
  // V27 fix: use timingSafeEqual to prevent byte-by-byte secret recovery via
  // response-time side-channel. A plain !== comparison short-circuits on the
  // first mismatched byte.
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const authBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);
  const authorized =
    !!process.env.CRON_SECRET &&
    authBuf.length === expectedBuf.length &&
    timingSafeEqual(authBuf, expectedBuf);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await prisma.booking.findMany({
      where: {
        status: "AWAITING_PAYMENT",
        expiresAt: { lt: new Date() },
      },
      include: {
        student: { select: { name: true, email: true } },
        property: { select: { title: true } },
      },
    });

    if (expired.length === 0) {
      return NextResponse.json({ success: true, expired: 0 });
    }

    await prisma.booking.updateMany({
      where: { id: { in: expired.map((b) => b.id) } },
      data: { status: "EXPIRED" },
    });

    for (const b of expired) {
      const browseUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/properties`;
      const html = wrapEmailHtml("Booking Expired", `
        <p>Hi <strong>${b.student.name}</strong>,</p>
        <p>Your booking for <strong>${b.property.title}</strong> has expired because payment was not completed within 48 hours.</p>
        <p>The property may still be available. Browse and book again to secure your accommodation.</p>
        <p style="margin:28px 0;">
          <a href="${browseUrl}" style="background:#E67E22;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Browse Properties</a>
        </p>
      `);
      enqueueEmail(b.student.email, `Booking expired — ${b.property.title}`, html).catch(console.error);

      await notifyUser({
        userId: b.studentId,
        type: "BOOKING",
        title: "Booking expired",
        message: `Your booking for ${b.property.title} expired because payment was not completed.`,
        link: "/student",
      });
    }

    return NextResponse.json({ success: true, expired: expired.length, ids: expired.map((b) => b.id) });
  } catch (error) {
    console.error("[EXPIRE ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to expire bookings." }, { status: 500 });
  }
}
