/**
 * PATCH /api/properties/[id]/status
 *
 * Admin-only: approve or reject a property listing.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { enqueueEmail, wrapEmailHtml } from '@/lib/tasks';
import { notifyUser } from '@/lib/notifications';
import type { PropertyStatus } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { status, reason }: { status: PropertyStatus; reason?: string } = body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status value.' }, { status: 400 });
    }

    if (status === "REJECTED" && !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required when rejecting a listing." },
        { status: 400 },
      );
    }

    const property = await prisma.property.update({
      where: { id },
      data:  {
        status,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote: reason?.trim() || null,
      },
      include: {
        landlord: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true, email: true } },
        location: true,
      },
    });

    // Queue notifications to landlord about review outcome
    if (status === 'APPROVED') {
      const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/properties/${property.id}`;
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/landlord`;
      const html = wrapEmailHtml("Listing Approved ✅", `
        <p>Hi <strong>${property.landlord.name}</strong>,</p>
        <p>Congratulations! Your property listing has been <strong style="color:#16a34a;">approved</strong> and is now live on RentalHub.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Status</td><td style="padding:8px 0;"><span style="background:#dcfce7;color:#166534;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">APPROVED</span></td></tr>
        </table>
        <p style="margin:28px 0;">
          <a href="${propertyUrl}" style="background:#E67E22;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Live Listing</a>
          &nbsp;&nbsp;
          <a href="${dashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">My Dashboard</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Students can now discover and book your property through RentalHub.</p>
      `);
      enqueueEmail(property.landlord.email, `Your listing has been approved — ${property.title}`, html).catch((err) => console.error('[email] property approved queue failed:', err));

      await notifyUser({
        userId: property.landlordId,
        type: "PROPERTY",
        title: "Listing approved",
        message: `${property.title} is now live for students to book.`,
        link: `/landlord/properties/${property.id}`,
      });
    } else if (status === 'REJECTED') {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/landlord`;
      const html = wrapEmailHtml("Listing Not Approved", `
        <p>Hi <strong>${property.landlord.name}</strong>,</p>
        <p>After review, your property listing requires some changes before it can be published on RentalHub.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Property</td><td style="padding:8px 0;font-weight:600;color:#192F59;">${property.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Status</td><td style="padding:8px 0;"><span style="background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">REJECTED</span></td></tr>
        </table>
        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;font-size:14px;color:#92400e;"><strong>Reviewer's note:</strong><br/>${reason?.trim() ?? ''}</p>
        </div>
        <p style="margin:28px 0;">
          <a href="${dashboardUrl}" style="background:#192F59;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">View Dashboard</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Please address the feedback above and submit a new listing. If you have questions, contact our support team at <a href="mailto:support@rentalhub.ng" style="color:#E67E22;">support@rentalhub.ng</a>.</p>
      `);
      enqueueEmail(property.landlord.email, `Listing update required — ${property.title}`, html).catch((err) => console.error('[email] property rejected queue failed:', err));

      await notifyUser({
        userId: property.landlordId,
        type: "PROPERTY",
        title: "Listing rejected",
        message: `${property.title} requires updates before it can go live.`,
        link: `/landlord/properties/${property.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      data:    property,
      message: `Property ${status.toLowerCase()} successfully.`,
    });
  } catch (error) {
    console.error('[PROPERTY STATUS PATCH ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update property status.' }, { status: 500 });
  }
}
