import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { enqueueEmail, wrapEmailHtml } from "@/lib/tasks";
import { notifyUser } from "@/lib/notifications";
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "20", 10)));

    const cacheKey = `admin:users:page:${page}:size:${pageSize}`;
    const TTL_SECONDS = 10 * 60; // 10 minutes

    const result = await getOrSet(
      cacheKey,
      async () => {
        const total = await prisma.user.count();

        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verificationStatus: true,
            emailVerified: true,
            phoneVerified: true,
            createdAt: true,
            _count: {
              select: {
                properties: true,
                bookings: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

        return {
          users,
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
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[ADMIN USERS GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users." }, { status: 500 });
  }
}

type AdminUserAction = "SUSPEND" | "UNSUSPEND" | "CHANGE_ROLE";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const action = body?.action as AdminUserAction;
    const nextRole = body?.role as Role | undefined;

    if (!userId || !["SUSPEND", "UNSUSPEND", "CHANGE_ROLE"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "userId and valid action (SUSPEND | UNSUSPEND | CHANGE_ROLE) are required." },
        { status: 400 },
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json({ success: false, error: "You cannot modify your own account from this action." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, verificationStatus: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (action === "CHANGE_ROLE") {
      if (!nextRole || !["STUDENT", "LANDLORD", "ADMIN"].includes(nextRole)) {
        return NextResponse.json({ success: false, error: "A valid target role is required." }, { status: 400 });
      }
      if (nextRole === user.role) {
        return NextResponse.json({ success: false, error: "User already has this role." }, { status: 409 });
      }

      const oldRole = user.role;
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          role: nextRole,
          verificationStatus: nextRole === "LANDLORD" ? "UNVERIFIED" : "VERIFIED",
        },
        select: { id: true, name: true, email: true, role: true },
      });

      const dashboardUrl =
        updated.role === "ADMIN" ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin` :
        updated.role === "LANDLORD" ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/landlord` :
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/student`;
      const roleHtml = wrapEmailHtml("Role Updated", `
        <p>Hi <strong>${updated.name}</strong>,</p>
        <p>Your account role has been updated by an admin.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Previous role</td><td style="padding:8px 0;">${oldRole}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">New role</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${updated.role}</td></tr>
        </table>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Open Dashboard</a>
        </p>
      `);
      enqueueEmail(updated.email, "Your RentalHub account role was updated", roleHtml).catch((error) => console.error("[email] role changed queue failed:", error));

      await notifyUser({
        userId: updated.id,
        type: "ACCOUNT",
        title: "Account role updated",
        message: `Your account role changed from ${oldRole} to ${updated.role}.`,
        link: updated.role === "ADMIN" ? "/admin" : updated.role === "LANDLORD" ? "/landlord" : "/student",
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `${updated.name} role changed to ${updated.role}.`,
      });
    }

    const suspended = action === "SUSPEND";
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: suspended ? "SUSPENDED" : "VERIFIED" },
      select: { id: true, name: true, email: true, role: true, verificationStatus: true },
    });

    if (suspended) {
      const suspendedHtml = wrapEmailHtml("Account Suspended", `
        <p>Hi <strong>${updated.name}</strong>,</p>
        <p>Your account has been <strong style="color:#991b1b;">suspended</strong> by the platform admin.</p>
        <p>If you believe this is a mistake, please contact support at <a href="mailto:support@rentalhub.ng" style="color:#E67E22;">support@rentalhub.ng</a>.</p>
      `);
      enqueueEmail(updated.email, "Your RentalHub account has been suspended", suspendedHtml).catch((error) => console.error("[email] account suspended queue failed:", error));
    } else {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
      const unsuspendedHtml = wrapEmailHtml("Account Reactivated", `
        <p>Hi <strong>${updated.name}</strong>,</p>
        <p>Your account has been reactivated and you can now sign in again.</p>
        <p style="margin:28px 0;">
          <a href="${loginUrl}" style="background:#E67E22;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Sign In</a>
        </p>
      `);
      enqueueEmail(updated.email, "Your RentalHub account has been reactivated", unsuspendedHtml).catch((error) => console.error("[email] account unsuspended queue failed:", error));
    }

    await notifyUser({
      userId: updated.id,
      type: "ACCOUNT",
      title: suspended ? "Account suspended" : "Account reactivated",
      message: suspended
        ? "Your account has been suspended by admin."
        : "Your account has been reactivated by admin.",
      link: "/login",
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: suspended ? `${updated.name} has been suspended.` : `${updated.name} has been reactivated.`,
    });
  } catch (error) {
    console.error("[ADMIN USERS PATCH ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update user account." }, { status: 500 });
  }
}
