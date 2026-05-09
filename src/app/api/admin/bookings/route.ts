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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "20", 10))); // 5-100, default 20

    const cacheKey = `admin:bookings:${school}:page:${page}:size:${pageSize}`;
    const TTL_SECONDS = 5 * 60; // 5 minutes

    const result = await getOrSet(
      cacheKey,
      async () => {
        const locationFilter =
          school !== "all" && SCHOOL_LOCATION_KEYWORDS[school]
            ? {
                property: {
                  location: {
                    OR: SCHOOL_LOCATION_KEYWORDS[school].map((kw) => ({
                      name: { contains: kw, mode: "insensitive" as const },
                    })),
                  },
                },
              }
            : {};

        // Fetch total count for pagination metadata
        const total = await prisma.booking.count({ where: locationFilter });

        const bookings = await prisma.booking.findMany({
          where: locationFilter,
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            paidAt: true,
            amount: true,
            student: { select: { name: true, email: true } },
            property: {
              select: {
                id: true,
                title: true,
                location: { select: { name: true } },
                landlord: { select: { name: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

        return {
          bookings,
          pagination: {
            page,
            pageSize,
            total,
            pages: Math.ceil(total / pageSize),
          },
        };
      },
      TTL_SECONDS
    );

    return NextResponse.json({
      success: true,
      data: result.bookings,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[ADMIN BOOKINGS GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings." }, { status: 500 });
  }
}
