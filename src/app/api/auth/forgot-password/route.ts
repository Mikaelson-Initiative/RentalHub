/**
 * POST /api/auth/forgot-password
 *
 * Generates a signed, time-limited reset token and emails it to the user.
 *
 * Token design (stateless — no DB table needed):
 *   Payload: { sub: userId, email, pwdFragment: first-8-chars-of-bcrypt-hash, exp }
 *   Signed with NEXTAUTH_SECRET via HS256.
 *   The pwdFragment ensures the token is automatically invalidated once the
 *   password is successfully changed.
 */

import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { enqueueEmail } from "@/lib/tasks";

const EXPIRY_SECONDS = 60 * 60; // 1 hour

export async function POST(request: Request) {
  try {
    // V5 fix: rate-limit to prevent email bombing (5 per IP per 15 min)
    const rl = await rateLimit(getRateLimitKey(request, "forgot-password"), {
      limit: 5,
      windowSeconds: 900,
    });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: `Too many reset requests. Try again in ${rl.retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 },
      );
    }

    const normalised = email.trim().toLowerCase();

    // Always return the same response shape to prevent user enumeration
    const ok = NextResponse.json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });

    const user = await prisma.user.findUnique({ where: { email: normalised } });
    if (!user) return ok; // silently succeed

    if (!process.env.NEXTAUTH_SECRET) {
      console.error("[forgot-password] NEXTAUTH_SECRET is not set — refusing to mint reset tokens");
      return NextResponse.json(
        { success: false, error: "Server misconfiguration. Please contact support." },
        { status: 500 },
      );
    }
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

    // Include the first 8 chars of the current hash so the token is invalidated
    // the moment the password is changed.
    // Google-only accounts have no password — password reset is not applicable
    if (!user.password) return ok;
    const pwdFragment = user.password.slice(0, 8);

    const token = await new SignJWT({ sub: user.id, email: user.email, pwdFragment })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRY_SECONDS)
      .sign(secret);

    // Queue password reset email (fire-and-forget)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#192F59;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">RentalHub</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>We received a request to reset your RentalHub account password. Click the button below to choose a new password.</p>
            <p style="margin:28px 0;">
              <a href="${resetUrl}" style="background:#E67E22;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Reset Password</a>
            </p>
            <p style="color:#6b7280;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
            <p style="color:#6b7280;font-size:12px;word-break:break-all;">If the button above doesn't work, copy and paste this URL into your browser:<br/>${resetUrl}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} RentalHub · Ikere-Ekiti, Ekiti State</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `;
    enqueueEmail(user.email, "Reset your RentalHub password", html).catch((err) =>
      console.error("[forgot-password] email queue error:", err),
    );

    return ok;
  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
