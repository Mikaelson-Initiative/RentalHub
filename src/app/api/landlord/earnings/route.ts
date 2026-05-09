/**
 * GET /api/landlord/earnings
 * Returns payment/earnings summary for the authenticated landlord.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getOrSet } from "@/lib/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Landlords only." }, { status: 403 });
    }

    const cacheKey = `landlord:earnings:${session.user.id}`;
    const TTL_SECONDS = 5 * 60; // 5 minutes

    // Fetch with cache: if hit, return cached; if miss, fetch and cache
    const data = await getOrSet(
      cacheKey,
      async () => {
        // Optimized: Single query with aggregation instead of N+1 payment sub-queries
        const bookings = await prisma.booking.findMany({
      where: {
        property: { landlordId: session.user.id },
        status: { in: ["PAID"] },
        paymentStatus: "SUCCESS",
      },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        moveInDate: true,
        leaseEndDate: true,
        student: { select: { name: true, email: true } },
        property: { select: { id: true, title: true } },
        payments: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { paystackRef: true }, // Only fetch paystackRef, not full object
        },
      },
        orderBy: { paidAt: "desc" },
        });

        // Compute totals in database, not JavaScript, for consistency
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const [totals] = await prisma.$queryRaw<Array<{ totalEarnings: bigint; monthlyEarnings: bigint }>>`
          SELECT
            COALESCE(SUM(amount), 0) as "totalEarnings",
            COALESCE(SUM(CASE WHEN "paidAt" >= ${thisMonth} THEN amount ELSE 0 END), 0) as "monthlyEarnings"
          FROM bookings
          WHERE "propertyId" IN (
            SELECT id FROM properties WHERE "landlordId" = ${session.user.id}
          )
          AND status = 'PAID'
          AND "paymentStatus" = 'SUCCESS'
        `;

        const totalEarnings = Number(totals?.totalEarnings ?? 0);
        const monthlyEarnings = Number(totals?.monthlyEarnings ?? 0);

        return {
          totalEarnings,
          monthlyEarnings,
          totalPaidBookings: bookings.length,
          bookings: bookings.map((b) => ({
            id: b.id,
            propertyTitle: b.property.title,
            studentName: b.student.name,
            amount: Number(b.amount ?? 0),
            paidAt: b.paidAt,
            paystackRef: b.payments[0]?.paystackRef ?? null,
            moveInDate: b.moveInDate,
            leaseEndDate: b.leaseEndDate,
          })),
        };
      },
      TTL_SECONDS
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[EARNINGS GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch earnings." }, { status: 500 });
  }
}
