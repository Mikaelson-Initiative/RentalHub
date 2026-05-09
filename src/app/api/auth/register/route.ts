/**
 * POST /api/auth/register
 *
 * Register a new user (STUDENT or LANDLORD).
 * Admins can only be created via the seed script or direct DB access.
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createEmailOtp } from '@/lib/otp';
import { sendEmailVerificationOtp } from '@/lib/email';
import { enqueueEmail } from '@/lib/tasks';
import { notifyUser } from '@/lib/notifications';

type AllowedRole = 'STUDENT' | 'LANDLORD';

interface RegisterBody {
  name:     string;
  email:    string;
  password: string;
  role?:    unknown; // validated explicitly before use
}

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registration attempts per IP per 15 minutes
    const rl = await rateLimit(getRateLimitKey(request, 'register'), { limit: 5, windowSeconds: 900 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: `Too many registration attempts. Try again in ${rl.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const body: RegisterBody = await request.json();
    const { name, email, password } = body;
    const rawRole = body.role;

    // Validation
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 },
      );
    }

    const ALLOWED_ROLES: AllowedRole[] = ['STUDENT', 'LANDLORD'];
    if (typeof rawRole !== 'string' || !ALLOWED_ROLES.includes(rawRole as AllowedRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Choose STUDENT or LANDLORD.' },
        { status: 400 },
      );
    }
    const role: AllowedRole = rawRole as AllowedRole;

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
    if (existing) {
      if (!existing.emailVerified) {
        const otp = await createEmailOtp(existing.id, existing.email);

        // Queue OTP email in background instead of blocking
        enqueueEmail(existing.email, "Verify your RentalHub email",
          `Hi <strong>${existing.name}</strong>,<br/><br/>Your OTP code is: <strong>${otp}</strong><br/><br/>This code expires in 10 minutes.`
        ).catch(err => logger.error("[REGISTER OTP QUEUE ERROR]", err));

        await notifyUser({
          userId: existing.id,
          type: "ACCOUNT",
          title: "Verify your email",
          message: "We sent your OTP code. Verify your email to continue.",
          link: `/verify-email?email=${encodeURIComponent(existing.email)}`,
        });

        return NextResponse.json(
          {
            success: true,
            message: "Account already exists but is not verified. A new OTP has been sent to your email.",
          },
          { status: 200 },
        );
      }
      return NextResponse.json(
        {
          success: true,
          message: "If your account exists, continue to login or verify email.",
        },
        { status: 200 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name:  name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        emailVerified: false,
        // Landlords start UNVERIFIED for document verification.
        verificationStatus: role === 'LANDLORD' ? 'UNVERIFIED' : 'VERIFIED',
      },
      select: {
        id:                 true,
        name:               true,
        email:              true,
        role:               true,
        verificationStatus: true,
        createdAt:          true,
      },
    });

    const otp = await createEmailOtp(user.id, user.email);

    // Queue OTP email in background instead of blocking
    enqueueEmail(user.email, "Verify your RentalHub email",
      `Hi <strong>${user.name}</strong>,<br/><br/>Your OTP code is: <strong>${otp}</strong><br/><br/>This code expires in 10 minutes.`
    ).catch(err => logger.error("[REGISTER OTP QUEUE ERROR]", err));

    await notifyUser({
      userId: user.id,
      type: "ACCOUNT",
      title: "Verify your email",
      message: "Use the OTP sent to your email to verify your account before logging in.",
      link: `/verify-email?email=${encodeURIComponent(user.email)}`,
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: "Account created. Check your email for OTP verification.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    const inferredCode = (message.match(/P\d{4}/)?.[0] ?? undefined) as string | undefined;

    logger.error('[REGISTER ERROR]', { code: code ?? inferredCode, error: message });

    // Duplicate unique key, usually email race-condition.
    if (code === 'P2002' || inferredCode === 'P2002') {
      return NextResponse.json(
        { success: true, message: "If your account exists, continue to login or verify email." },
        { status: 200 },
      );
    }

    // Missing table/column because DB schema is behind deployed code.
    if (code === 'P2021' || code === 'P2022' || inferredCode === 'P2021' || inferredCode === 'P2022') {
      return NextResponse.json(
        { success: false, error: 'Registration is temporarily unavailable. Database schema is outdated.' },
        { status: 503 },
      );
    }

    // DB connectivity/auth/env config issues.
    if (
      code === 'P1000' ||
      code === 'P1001' ||
      code === 'P1003' ||
      inferredCode === 'P1000' ||
      inferredCode === 'P1001' ||
      inferredCode === 'P1003' ||
      message.includes('DATABASE_URL') ||
      message.includes("Can't reach database server")
    ) {
      return NextResponse.json(
        { success: false, error: 'Registration is temporarily unavailable. Please try again shortly.' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 },
    );
  }
}
