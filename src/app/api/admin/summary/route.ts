import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SCHOOL_LOCATION_KEYWORDS } from "@/lib/schools";
import { getOrSet } from "@/lib/cache";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const school = searchParams.get("school") || "all";

    // Cache key includes school filter (cache separately for each school)
    const cacheKey = `admin:summary:${school}`;
    const TTL_SECONDS = 15 * 60; // 15 minutes

    const data = await getOrSet(
      cacheKey,
      async () => {
        // Build location filter when a school is selected
        const locationFilter =
          school !== "all" && SCHOOL_LOCATION_KEYWORDS[school]
            ? {
                location: {
                  OR: SCHOOL_LOCATION_KEYWORDS[school].map((kw) => ({
                    name: { contains: kw, mode: "insensitive" as const },
                  })),
                },
              }
            : {};

        const [totalProperties, pendingApprovals, totalBookings, totalUsers] = await Promise.all([
          prisma.property.count({ where: { ...locationFilter } }),
          prisma.property.count({ where: { status: "PENDING", ...locationFilter } }),
          prisma.booking.count({
            where: school !== "all" ? { property: { ...locationFilter } } : {},
          }),
          // Users: platform-wide or those with at least one property in the school
          school !== "all"
            ? prisma.user.count({
                where: {
                  OR: [
                    { properties: { some: { ...locationFilter } } },
                    { bookings: { some: { property: { ...locationFilter } } } },
                  ],
                },
              })
            : prisma.user.count(),
        ]);

        return { totalProperties, pendingApprovals, totalUsers, totalBookings };
      },
      TTL_SECONDS
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[ADMIN SUMMARY GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch admin summary." }, { status: 500 });
  }
}
