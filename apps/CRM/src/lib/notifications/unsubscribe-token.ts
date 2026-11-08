/**
 * HMAC-signed tokens for notification email unsubscribe.
 * Pattern: {signature}.{base64_payload}
 * Payload: { userId, eventType, ts }
 */

import { createHmac } from 'crypto'

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET or RESEND_API_KEY env var required')
  }
  return secret
}

export function generateNotifUnsubscribeToken(
  userId: string,
  eventType: string
): string {
  const payload = JSON.stringify({ userId, eventType, ts: Date.now() })
  const secret = getSecret()
  const signature = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)
  const data = Buffer.from(payload).toString('base64url')
  return `${signature}.${data}`
}

export function verifyNotifUnsubscribeToken(
  token: string
): { userId: string; eventType: string } | null {
  try {
    const [signature, data] = token.split('.')
    if (!signature || !data) return null

    const payload = Buffer.from(data, 'base64url').toString('utf-8')
    const secret = getSecret()
    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)

    if (signature !== expectedSig) return null

    const parsed = JSON.parse(payload)
    if (!parsed.userId || !parsed.eventType) return null

    return { userId: parsed.userId, eventType: parsed.eventType }
  } catch {
    return null
  }
}

export function generateNotifUnsubscribeUrl(
  userId: string,
  eventType: string
): string {
  const token = generateNotifUnsubscribeToken(userId, eventType)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'
  return `${appUrl}/api/notifications/unsubscribe?token=${token}&type=${eventType}`
}
