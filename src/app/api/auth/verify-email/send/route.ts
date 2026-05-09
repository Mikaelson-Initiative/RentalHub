import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createEmailOtp } from "@/lib/otp";
import { sendEmailVerificationOtp } from "@/lib/email";
import { enqueueEmail } from "@/lib/tasks";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rl = await rateLimit(getRateLimitKey(request, "verify-email-send"), {
      limit: 5,
      windowSeconds: 15 * 60,
    });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Try again in ${rl.retryAfter} seconds.` },
        { status: 429 },
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRl = await rateLimit(`verify-email-send:${normalizedEmail}`, {
      limit: 3,
      windowSeconds: 15 * 60,
    });
    if (!emailRl.success) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Try again in ${emailRl.retryAfter} seconds.` },
        { status: 429 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ success: true, message: "If your account exists, an OTP has been sent." });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "If your account exists, an OTP has been sent." });
    }

    const otp = await createEmailOtp(user.id, user.email);

    // Queue OTP email in background
    enqueueEmail(user.email, "Verify your RentalHub email",
      `Hi <strong>${user.name}</strong>,<br/><br/>Your OTP code is: <strong>${otp}</strong><br/><br/>This code expires in 10 minutes.`
    ).catch(err => console.error("[VERIFY EMAIL SEND QUEUE ERROR]", err));

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email. It expires in 10 minutes.",
    });
  } catch (error) {
    console.error("[VERIFY EMAIL SEND ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to send verification OTP." }, { status: 500 });
  }
}
