/**
 * GET   /api/admin/landlords          — List landlords pending / under review
 * PATCH /api/admin/landlords          — Approve or reject a landlord's verification
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  sendAccountSuspendedEmail,
  sendAccountUnsuspendedEmail,
  sendVerificationApprovedToLandlord,
  sendVerificationRejectedToLandlord,
} from "@/lib/email";
import { notifyUser } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "20", 10)));

    const whereClause = {
      role: "LANDLORD" as const,
      OR: [
        { verificationStatus: { in: ["UNVERIFIED", "UNDER_REVIEW", "REJECTED", "SUSPENDED"] } },
        // Also return VERIFIED landlords who have no documents (verified without proper review)
        { verificationStatus: "VERIFIED" as const, governmentIdUrl: null },
      ],
    };

    const total = await prisma.user.count({ where: whereClause });

    const landlords = await prisma.user.findMany({
      where: whereClause,
      select: {
        id:                      true,
        name:                    true,
        email:                   true,
        phoneNumber:             true,
        verificationStatus:      true,
        governmentIdUrl:         true,
        selfieUrl:               true,
        isDirectOwner:           true,
        landlordAware:           true,
        ownershipProofUrl:       true,
        verificationNote:        true,
        verificationSubmittedAt: true,
        aiPreScreenScore:        true,
        aiPreScreenNote:         true,
        createdAt:               true,
        _count: { select: { properties: true } },
      },
      orderBy: { verificationSubmittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: landlords,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[ADMIN LANDLORDS GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch landlords." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const landlordId: string = body.landlordId ?? body.userId;
    const action: string = body.action;
    const note: string | undefined = body.note;

    if (!landlordId || !["APPROVE", "REJECT", "SUSPEND", "UNSUSPEND", "RESET"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "landlordId (or userId) and action (APPROVE | REJECT | SUSPEND | UNSUSPEND | RESET) are required." },
        { status: 400 },
      );
    }

    if (action === "REJECT" && !note?.trim()) {
      return NextResponse.json(
        { success: false, error: "A rejection reason is required so the landlord knows what to fix." },
        { status: 400 },
      );
    }

    // V22 fix: block self-action and cross-role abuse on this endpoint.
    // This route is for LANDLORD verification — it must never be used to
    // mutate another ADMIN or a STUDENT. Without this guard, admin X could
    // suspend admin Y (combined with V10's middleware kick, locking them out).
    if (landlordId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot apply landlord-verification actions to your own account." },
        { status: 400 },
      );
    }

    const targetRole = await prisma.user.findUnique({
      where: { id: landlordId },
      select: { role: true },
    });
    if (!targetRole) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }
    if (targetRole.role !== "LANDLORD") {
      return NextResponse.json(
        { success: false, error: "This endpoint only operates on LANDLORD accounts." },
        { status: 400 },
      );
    }

    // Audit log — every landlord-verification state change by an admin.
    console.log("[AUDIT][admin-landlords]", {
      at: new Date().toISOString(),
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetLandlordId: landlordId,
      action,
      note: note?.trim(),
    });

    // Guard: cannot approve a landlord who hasn't submitted any documents
    if (action === "APPROVE") {
      const candidate = await prisma.user.findUnique({
        where: { id: landlordId },
        select: { governmentIdUrl: true, selfieUrl: true, ownershipProofUrl: true },
      });
      if (!candidate?.governmentIdUrl) {
        return NextResponse.json(
          { success: false, error: "Cannot approve: this landlord has not submitted a government ID. They must complete the verification form first." },
          { status: 422 },
        );
      }
    }

    const statusMap: Record<string, string> = {
      APPROVE:   "VERIFIED",
      REJECT:    "REJECTED",
      SUSPEND:   "SUSPENDED",
      UNSUSPEND: "VERIFIED",
      RESET:     "UNVERIFIED",
    };

    const updated = await prisma.user.update({
      where: { id: landlordId },
      data:  {
        verificationStatus:      statusMap[action] as "VERIFIED" | "REJECTED" | "SUSPENDED" | "UNVERIFIED",
        verificationNote:        action === "REJECT" ? (note ?? "").trim() : null,
        // RESET clears all submitted documents so landlord must re-submit
        ...(action === "RESET" ? {
          governmentIdUrl:         null,
          selfieUrl:               null,
          ownershipProofUrl:       null,
          verificationSubmittedAt: null,
          aiPreScreenScore:        null,
          aiPreScreenNote:         null,
        } : {}),
      },
      select: { id: true, name: true, email: true, verificationStatus: true },
    });

    // Send rejection email (fire-and-forget)
    if (action === "REJECT" && note?.trim()) {
      sendVerificationRejectedToLandlord({
        landlordEmail: updated.email,
        landlordName: updated.name,
        rejectionNote: note.trim(),
      }).catch((err) => console.error("[email] verification rejected landlord notification failed:", err));
    }
    if (action === "APPROVE" || action === "UNSUSPEND") {
      sendVerificationApprovedToLandlord({
        landlordEmail: updated.email,
        landlordName: updated.name,
      }).catch((err) => console.error("[email] verification approved landlord notification failed:", err));
    }
    if (action === "SUSPEND") {
      sendAccountSuspendedEmail({
        to: updated.email,
        name: updated.name,
      }).catch((err) => console.error("[email] account suspended notification failed:", err));
    }
    if (action === "UNSUSPEND") {
      sendAccountUnsuspendedEmail({
        to: updated.email,
        name: updated.name,
      }).catch((err) => console.error("[email] account unsuspended notification failed:", err));
    }

    await notifyUser({
      userId: updated.id,
      type: "VERIFICATION",
      title:
        action === "APPROVE" || action === "UNSUSPEND"
          ? "Verification approved"
          : action === "SUSPEND"
          ? "Account suspended"
          : action === "RESET"
          ? "Verification reset"
          : "Verification rejected",
      message:
        action === "APPROVE" || action === "UNSUSPEND"
          ? "Your landlord verification was approved."
          : action === "SUSPEND"
          ? "Your landlord account has been suspended. Contact support for details."
          : action === "RESET"
          ? "Your verification was reset. Please re-submit your documents."
          : `Your verification was rejected. Reason: ${(note ?? "").trim()}`,
      link: "/landlord/verification",
    });

    return NextResponse.json({
      success: true,
      data:    updated,
      message: action === "APPROVE" || action === "UNSUSPEND"
        ? `${updated.name} has been verified.`
        : action === "SUSPEND"
        ? `${updated.name} has been suspended.`
        : action === "RESET"
        ? `${updated.name}'s verification has been reset. They must re-submit documents.`
        : `${updated.name}'s verification was rejected.`,
    });
  } catch (error) {
    console.error("[ADMIN LANDLORDS PATCH ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to update landlord verification." }, { status: 500 });
  }
}
