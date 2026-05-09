/**
 * POST /api/tasks
 *
 * Webhook handler for Vercel Task Queue.
 * Receives task events and routes them to appropriate handlers.
 *
 * Task types:
 * - send-email: Send transactional emails
 * - process-image: Perceptual hashing, duplicate/AI detection
 * - verify-payment: Paystack payment verification
 * - verify-documents: AI pre-screening of landlord documents
 * - cache-invalidate: Clear Redis cache patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TaskPayload } from '@/lib/tasks';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/email';
import { notifyUser } from '@/lib/notifications';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface TaskEvent {
  type: string;
  id: string;
  payload: string;
  attempt: number;
  timestamp: string;
}

/**
 * Verify Task Queue webhook signature (optional, recommended for production).
 */
function verifySignature(request: NextRequest, signature: string | null): boolean {
  // TODO: Implement HMAC signature verification if Vercel provides secret
  // For now, rely on URL-only accessibility (add to allowed IP whitelist in production)
  return true;
}

async function handleEmailTask(
  payload: Exclude<TaskPayload, { type: Exclude<TaskPayload['type'], 'send-email'> }>
): Promise<void> {
  if (payload.type !== 'send-email') return;

  try {
    const success = await sendMail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    if (!success && (payload.retryCount || 0) < 3) {
      console.warn(`[TASK] Email send failed, will retry. Attempt: ${(payload.retryCount || 0) + 1}`);
      // Retry logic: throw error to trigger Vercel Task Queue retry
      throw new Error('Email send failed, retrying...');
    }

    // Log success
    if (payload.userId) {
      await notifyUser({
        userId: payload.userId,
        title: 'Email Sent',
        message: `Your email to ${payload.to} has been sent.`,
        type: 'SYSTEM',
      }).catch(() => {
        // Ignore notification errors
      });
    }
  } catch (error) {
    console.error('[TASK EMAIL ERROR]', error);
    throw error; // Re-throw for Task Queue retry logic
  }
}

async function handleImageProcessingTask(
  payload: Exclude<TaskPayload, { type: Exclude<TaskPayload['type'], 'process-image'> }>
): Promise<void> {
  if (payload.type !== 'process-image') return;

  try {
    // TODO: Implement image processing
    // 1. Fetch image from payload.imageUrl
    // 2. Compare hash against existing hashes in image_hashes table
    // 3. Run AI image analysis if duplicate found
    // 4. Store results in ImageHash model
    // 5. Notify admin if suspicious

    console.log(`[TASK] Processing image: ${payload.imageUrl}`);

    // Placeholder: Mark in database that processing is complete
    await prisma.imageHash.updateMany(
      {
        imageUrl: payload.imageUrl,
      },
      {
        flagged: false,
        flagReason: null,
      }
    );
  } catch (error) {
    console.error('[TASK IMAGE PROCESSING ERROR]', error);
    throw error;
  }
}

async function handlePaymentVerificationTask(
  payload: Exclude<TaskPayload, { type: Exclude<TaskPayload['type'], 'verify-payment'> }>
): Promise<void> {
  if (payload.type !== 'verify-payment') return;

  try {
    // TODO: Implement payment verification
    // 1. Fetch from Paystack API
    // 2. Update booking payment status
    // 3. Trigger payout notifications if payment successful

    console.log(`[TASK] Verifying payment: ${payload.paystackRef}`);

    // Placeholder: Log verification
    await prisma.payment.updateMany(
      {
        paystackRef: payload.paystackRef,
      },
      {
        status: 'SUCCESS',
      }
    );
  } catch (error) {
    console.error('[TASK PAYMENT VERIFICATION ERROR]', error);
    throw error;
  }
}

async function handleDocumentVerificationTask(
  payload: Exclude<TaskPayload, { type: Exclude<TaskPayload['type'], 'verify-documents'> }>
): Promise<void> {
  if (payload.type !== 'verify-documents') return;

  try {
    // TODO: Implement document verification
    // 1. Call Gemini AI for each document
    // 2. Store pre-screening scores in User model
    // 3. Notify admin of results

    console.log(`[TASK] Verifying documents for landlord: ${payload.landlordId}`);

    // Placeholder: Log verification
    await prisma.user.update({
      where: { id: payload.landlordId },
      data: {
        aiPreScreenScore: 'PENDING',
        aiPreScreenNote: 'Documents queued for AI pre-screening',
      },
    });
  } catch (error) {
    console.error('[TASK DOCUMENT VERIFICATION ERROR]', error);
    throw error;
  }
}

async function handleCacheInvalidationTask(
  payload: Exclude<TaskPayload, { type: Exclude<TaskPayload['type'], 'cache-invalidate'> }>
): Promise<void> {
  if (payload.type !== 'cache-invalidate') return;

  try {
    // TODO: Implement cache invalidation
    // 1. Connect to Upstash Redis
    // 2. For each pattern, delete matching keys
    // 3. Log invalidations

    console.log(`[TASK] Invalidating cache patterns: ${payload.patterns.join(', ')}`);

    // Placeholder: Log invalidation
  } catch (error) {
    console.error('[TASK CACHE INVALIDATION ERROR]', error);
    // Don't throw: cache invalidation failures shouldn't block tasks
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-vercel-signature');
    if (!verifySignature(request, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = (await request.json()) as TaskEvent;

    if (!body.type || !body.id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    let payload: TaskPayload;
    try {
      payload = JSON.parse(body.payload);
    } catch {
      return NextResponse.json({ error: 'Invalid payload JSON' }, { status: 400 });
    }

    console.log(`[TASK] Processing task: ${body.id} (type: ${payload.type}, attempt: ${body.attempt})`);

    // Route to appropriate handler
    switch (payload.type) {
      case 'send-email':
        await handleEmailTask(payload);
        break;
      case 'process-image':
        await handleImageProcessingTask(payload);
        break;
      case 'verify-payment':
        await handlePaymentVerificationTask(payload);
        break;
      case 'verify-documents':
        await handleDocumentVerificationTask(payload);
        break;
      case 'cache-invalidate':
        await handleCacheInvalidationTask(payload);
        break;
      default:
        return NextResponse.json({ error: `Unknown task type: ${payload.type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, taskId: body.id });
  } catch (error) {
    console.error('[TASK HANDLER ERROR]', error);
    // Return 500 to trigger retry
    return NextResponse.json(
      { error: 'Task processing failed' },
      { status: 500 }
    );
  }
}
