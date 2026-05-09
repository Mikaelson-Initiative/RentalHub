/**
 * GET  /api/landlord/verification  — Fetch current landlord's verification state
 * POST /api/landlord/verification  — Submit / update verification documents
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enqueueEmail, wrapEmailHtml } from "@/lib/tasks";
import { notifyRole, notifyUser } from "@/lib/notifications";
import { sanitizeInternalBlobPath, sanitizeText } from "@/lib/sanitize";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (session.user.role !== "LANDLORD") {
      return NextResponse.json({ success: false, error: "Landlords only." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verificationStatus:      true,
        phoneNumber:             true,
        phoneVerified:           true,
        governmentIdUrl:         true,
        selfieUrl:               true,
        isDirectOwner:           true,
        landlordAware:           true,
        ownershipProofUrl:       true,
        verificationNote:        true,
        verificationSubmittedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[VERIFICATION GET ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch verification status." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (session.user.role !== "LANDLORD") {
      return NextResponse.json({ success: false, error: "Landlords only." }, { status: 403 });
    }

    const body = await request.json();
    const {
      phoneNumber,
      governmentIdUrl,
      selfieUrl,
      isDirectOwner,
      landlordAware,
      ownershipProofUrl,
    } = body;

    // Validate required fields
    const missing: string[] = [];
    if (!phoneNumber?.trim())    missing.push("phone number");
    if (!governmentIdUrl?.trim()) missing.push("government ID");
    if (!selfieUrl?.trim())      missing.push("selfie / photo");
    if (isDirectOwner === undefined || isDirectOwner === null) missing.push("ownership declaration");
    if (!isDirectOwner && !landlordAware) missing.push("landlord consent confirmation");
    if (!ownershipProofUrl?.trim()) missing.push("proof of ownership / authorisation");

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }

    // Check the user isn't already verified or under review
    const current = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { verificationStatus: true },
    });

    if (current?.verificationStatus === "VERIFIED") {
      return NextResponse.json({ success: false, error: "Your account is already verified." }, { status: 409 });
    }
    if (current?.verificationStatus === "UNDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: "Your documents are already under review. We'll notify you soon." },
        { status: 409 },
      );
    }

    // V24/V25/V37 fix: only accept paths to our internal /api/files endpoint
    // AND verify the path was uploaded by THIS landlord. The upload route
    // prefixes restricted uploads with the uploader's userId
    // (uploads/<category>/<userId>/<file>); we enforce that match here so a
    // landlord cannot submit another user's document URL as their own.
    const safeGovernmentIdUrl = sanitizeInternalBlobPath(governmentIdUrl);
    const safeSelfieUrl = sanitizeInternalBlobPath(selfieUrl);
    const safeOwnershipProofUrl = sanitizeInternalBlobPath(ownershipProofUrl);

    if (!safeGovernmentIdUrl || !safeSelfieUrl || !safeOwnershipProofUrl) {
      return NextResponse.json(
        { success: false, error: "Invalid document URL provided. Please re-upload your files." },
        { status: 400 },
      );
    }

    const uidPrefix = `/${session.user.id}/`;
    const expectations: Array<[string, string]> = [
      [safeGovernmentIdUrl, "/api/files/uploads/governmentId"],
      [safeSelfieUrl, "/api/files/uploads/selfie"],
      [safeOwnershipProofUrl, "/api/files/uploads/ownershipProof"],
    ];
    for (const [url, expectedCategoryPrefix] of expectations) {
      if (!url.startsWith(expectedCategoryPrefix + uidPrefix)) {
        console.error("[verification] landlord submitted a blob path not owned by them", {
          landlordId: session.user.id,
          url,
        });
        return NextResponse.json(
          { success: false, error: "Document URL does not belong to your uploads. Please re-upload your files." },
          { status: 400 },
        );
      }
    }

    // V36 fix: we do NOT trust the phone number here. phoneVerified stays
    // false until an SMS-OTP flow verifies it (not implemented yet — tracked
    // as a TODO). Admin must treat the phone number as landlord-claimed, not
    // verified, during review. Do not set phoneVerified=true anywhere in this
    // route until an SMS OTP provider (e.g. Termii) is wired up.
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data:  {
        phoneNumber:             sanitizeText(phoneNumber, 25),
        phoneVerified:           false, // explicit — do not promote on submit
        governmentIdUrl:         safeGovernmentIdUrl,
        selfieUrl:               safeSelfieUrl,
        isDirectOwner,
        landlordAware:           isDirectOwner ? true : !!landlordAware,
        ownershipProofUrl:       safeOwnershipProofUrl,
        verificationStatus:      "UNDER_REVIEW",
        verificationNote:        null, // clear any previous rejection note
        verificationSubmittedAt: new Date(),
      },
      select: { verificationStatus: true, verificationSubmittedAt: true },
    });

    // Queue verification notifications
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@bouesti.edu.ng";
    const landlordUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
    if (landlordUser) {
      const submittedAt = new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
      const adminDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin`;
      const adminHtml = wrapEmailHtml("New Verification Submission", `
        <p>Hi Admin,</p>
        <p>A landlord has submitted their verification documents and is awaiting review.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${landlordUser.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;">${landlordUser.email}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Submitted</td><td style="padding:8px 0;">${submittedAt}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Status</td><td style="padding:8px 0;"><span style="background:#dbeafe;color:#1e40af;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">UNDER REVIEW</span></td></tr>
        </table>
        <p style="margin:28px 0;">
          <a href="${adminDashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Review in Admin Dashboard</a>
        </p>
      `);
      enqueueEmail(adminEmail, `Verification documents submitted — ${landlordUser.name}`, adminHtml).catch((err) => console.error("[email] verification submitted admin queue failed:", err));

      const landlordDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/landlord`;
      const landlordHtml = wrapEmailHtml("Verification Submitted", `
        <p>Hi <strong>${landlordUser.name}</strong>,</p>
        <p>We received your verification documents successfully.</p>
        <p>Your account is now under review. This typically takes <strong>24–48 hours</strong>.</p>
        <p style="margin:28px 0;">
          <a href="${landlordDashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Go to Dashboard</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">We will notify you by email once a decision is made.</p>
      `);
      enqueueEmail(landlordUser.email, "Verification submitted — under review", landlordHtml).catch((err) => console.error("[email] verification submission received landlord queue failed:", err));

      await Promise.all([
        notifyUser({
          userId: session.user.id,
          type: "VERIFICATION",
          title: "Verification submitted",
          message: "Your verification documents were submitted and are now under review.",
          link: "/landlord/verification",
        }),
        notifyRole(
          "ADMIN",
          "New landlord verification",
          `${landlordUser.name} submitted verification documents for review.`,
          "VERIFICATION",
          "/admin",
        ),
      ]);
    }

    return NextResponse.json({
      success: true,
      data:    updated,
      message: "Verification documents submitted. Our team will review them within 24–48 hours.",
    });
  } catch (error) {
    console.error("[VERIFICATION POST ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to submit verification." }, { status: 500 });
  }
}
