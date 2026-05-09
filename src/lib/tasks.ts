/**
 * src/lib/tasks.ts
 *
 * Wrapper around Vercel Task Queue for background job processing.
 * Supports task types: email sending, image processing, payment verification, etc.
 *
 * Usage:
 *   const taskId = await enqueueTask('send-email', {
 *     to: 'user@example.com',
 *     subject: 'Welcome',
 *     template: 'welcome',
 *   });
 */

export type TaskType =
  | 'send-email'
  | 'process-image'
  | 'verify-payment'
  | 'verify-documents'
  | 'generate-description'
  | 'cache-invalidate';

export interface EmailTaskPayload {
  type: 'send-email';
  to: string;
  subject: string;
  html: string;
  bookingId?: string;
  userId?: string;
  retryCount?: number;
}

export interface ImageProcessingPayload {
  type: 'process-image';
  imageUrl: string;
  propertyId?: string;
  uploadedById: string;
  hash: string;
  retryCount?: number;
}

export interface PaymentVerificationPayload {
  type: 'verify-payment';
  paystackRef: string;
  bookingId: string;
  retryCount?: number;
}

export interface DocumentVerificationPayload {
  type: 'verify-documents';
  landlordId: string;
  documentUrls: string[];
  retryCount?: number;
}

export interface CacheInvalidationPayload {
  type: 'cache-invalidate';
  patterns: string[];
}

export type TaskPayload =
  | EmailTaskPayload
  | ImageProcessingPayload
  | PaymentVerificationPayload
  | DocumentVerificationPayload
  | CacheInvalidationPayload;

export interface TaskResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

/**
 * Enqueue a task for background processing via Vercel Task Queue.
 * Returns immediately; task executes asynchronously.
 */
export async function enqueueTask<T extends TaskPayload>(payload: T): Promise<TaskResult> {
  try {
    const response = await fetch('https://api.vercel.com/v1/projects/current/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TASK_QUEUE_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: payload.type,
        payload: JSON.stringify(payload),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[TASK QUEUE ERROR]', response.status, error);
      throw new Error(`Failed to enqueue task: ${error}`);
    }

    const data = (await response.json()) as { id: string };

    return {
      id: data.id,
      status: 'pending',
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('[TASK ENQUEUE ERROR]', error);
    // Fail-open: if Task Queue is down, log but don't crash
    // In production, consider storing failed tasks for retry
    throw error;
  }
}

/**
 * Convenience wrapper for email tasks.
 */
export async function enqueueEmail(
  to: string,
  subject: string,
  html: string,
  metadata?: { bookingId?: string; userId?: string }
): Promise<TaskResult> {
  return enqueueTask({
    type: 'send-email',
    to,
    subject,
    html,
    bookingId: metadata?.bookingId,
    userId: metadata?.userId,
  } as EmailTaskPayload);
}

/**
 * Convenience wrapper for image processing tasks.
 */
export async function enqueueImageProcessing(
  imageUrl: string,
  hash: string,
  uploadedById: string,
  propertyId?: string
): Promise<TaskResult> {
  return enqueueTask({
    type: 'process-image',
    imageUrl,
    hash,
    uploadedById,
    propertyId,
  } as ImageProcessingPayload);
}

/**
 * Helper to wrap email body in RentalHub HTML template.
 * Matches the wrap() function in src/lib/email.ts.
 */
export function wrapEmailHtml(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
            ${body}
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
}

/**
 * Convenience wrapper for cache invalidation.
 */
export async function invalidateCacheAsync(patterns: string[]): Promise<TaskResult> {
  return enqueueTask({
    type: 'cache-invalidate',
    patterns,
  } as CacheInvalidationPayload);
}
