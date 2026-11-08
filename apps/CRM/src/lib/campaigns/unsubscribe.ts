/**
 * Unsubscribe Token Generation & Verification
 *
 * Tokens are HMAC-signed Base64-encoded JSON payloads containing:
 * { email, campaignId, ts }
 */

import { createHmac } from 'crypto'

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET or RESEND_API_KEY env var required')
  }
  return secret
}

/**
 * Generate an unsubscribe token for an email + campaign combo.
 */
export function generateUnsubscribeToken(
  email: string,
  campaignId?: string
): string {
  const payload = JSON.stringify({ email, campaignId, ts: Date.now() })
  const secret = getSecret()
  const signature = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)
  const data = Buffer.from(payload).toString('base64url')
  return `${signature}.${data}`
}

/**
 * Verify and decode an unsubscribe token.
 * Returns null if invalid.
 */
export function verifyUnsubscribeToken(
  token: string
): { email: string; campaignId?: string } | null {
  try {
    const [signature, data] = token.split('.')
    if (!signature || !data) return null

    const payload = Buffer.from(data, 'base64url').toString('utf-8')
    const secret = getSecret()
    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)

    if (signature !== expectedSig) return null

    const parsed = JSON.parse(payload)
    if (!parsed.email) return null

    return { email: parsed.email, campaignId: parsed.campaignId }
  } catch {
    return null
  }
}

/**
 * Generate the full unsubscribe URL for an email.
 */
export function generateUnsubscribeUrl(
  email: string,
  campaignId?: string
): string {
  const token = generateUnsubscribeToken(email, campaignId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'
  return `${appUrl}/api/unsubscribe?token=${token}`
}
