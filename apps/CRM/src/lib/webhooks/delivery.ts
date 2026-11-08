import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// ── HMAC Signature ──────────────────────────────────────────────

export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// ── Delivery Result ─────────────────────────────────────────────

interface WebhookDeliveryResult {
  success: boolean
  statusCode: number | null
  duration: number
  error: string | null
}

// ── Deliver Single Webhook ──────────────────────────────────────

export async function deliverWebhook(
  webhook: { id: string; url: string; secret: string },
  event: string,
  payload: unknown,
  attempt: number = 1
): Promise<WebhookDeliveryResult> {
  const deliveryId = crypto.randomUUID()
  const body = JSON.stringify({ event, data: payload, deliveryId })
  const signature = generateSignature(body, webhook.secret)

  const start = Date.now()
  let statusCode: number | null = null
  let responseText: string | null = null
  let success = false
  let error: string | null = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-L-ERP-Signature': `sha256=${signature}`,
        'X-L-ERP-Event': event,
        'X-L-ERP-Delivery': deliveryId,
        'User-Agent': 'L-ERP-CRM-Webhook/1.0',
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    statusCode = res.status
    success = res.status >= 200 && res.status < 300

    try {
      const raw = await res.text()
      responseText = raw.slice(0, 1000)
    } catch {
      responseText = null
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unknown error'
    if (error.includes('abort')) {
      error = 'Request timed out (5s)'
    }
  }

  const duration = Date.now() - start

  // Log to DB (fire-and-forget)
  prisma.webhookLog.create({
    data: {
      webhookId: webhook.id,
      event,
      payload: payload as any,
      statusCode,
      response: responseText,
      success,
      duration,
      attempt,
      error,
    },
  }).catch((err) => {
    console.error('[Webhook] Failed to log delivery:', err)
  })

  return { success, statusCode, duration, error }
}

// ── Deliver With Retry ──────────────────────────────────────────

const RETRY_DELAYS = [0, 5000, 30000] // immediate, 5s, 30s

export async function deliverWithRetry(
  webhook: { id: string; url: string; secret: string },
  event: string,
  payload: unknown,
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delay = RETRY_DELAYS[attempt - 1] ?? 30000
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const result = await deliverWebhook(webhook, event, payload, attempt)
    if (result.success) return
  }
}
