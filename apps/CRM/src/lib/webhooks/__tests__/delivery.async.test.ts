import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockWebhookLog } = vi.hoisted(() => ({
  mockWebhookLog: { create: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { webhookLog: mockWebhookLog },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { deliverWebhook } from '../delivery'

describe('deliverWebhook (async)', () => {
  const webhook = { id: 'wh-1', url: 'https://example.com/hook', secret: 'test-secret' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWebhookLog.create.mockReturnValue({ catch: vi.fn() })
  })

  it('returns success for 200 response', async () => {
    mockFetch.mockResolvedValue({ status: 200, text: vi.fn().mockResolvedValue('OK') })
    const result = await deliverWebhook(webhook, 'test.event', { id: 1 })
    expect(result.success).toBe(true)
    expect(result.statusCode).toBe(200)
    expect(result.error).toBeNull()
  })

  it('returns failure for 500 response', async () => {
    mockFetch.mockResolvedValue({ status: 500, text: vi.fn().mockResolvedValue('Error') })
    const result = await deliverWebhook(webhook, 'test.event', { id: 1 })
    expect(result.success).toBe(false)
    expect(result.statusCode).toBe(500)
  })

  it('handles timeout/abort gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('The operation was aborted'))
    const result = await deliverWebhook(webhook, 'test.event', {})
    expect(result.success).toBe(false)
    expect(result.error).toContain('timed out')
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const result = await deliverWebhook(webhook, 'test.event', {})
    expect(result.success).toBe(false)
    expect(result.error).toBe('ECONNREFUSED')
  })

  it('sends correct headers including HMAC signature', async () => {
    mockFetch.mockResolvedValue({ status: 200, text: vi.fn().mockResolvedValue('OK') })
    await deliverWebhook(webhook, 'order.created', { orderId: '123' })
    const [, fetchOptions] = mockFetch.mock.calls[0]
    expect(fetchOptions.headers['X-L-ERP-Event']).toBe('order.created')
    expect(fetchOptions.headers['X-L-ERP-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/)
    expect(fetchOptions.headers['X-L-ERP-Delivery']).toBeDefined()
  })

  it('logs delivery to database', async () => {
    mockFetch.mockResolvedValue({ status: 200, text: vi.fn().mockResolvedValue('OK') })
    await deliverWebhook(webhook, 'test.event', {}, 1)
    expect(mockWebhookLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        webhookId: 'wh-1',
        event: 'test.event',
        success: true,
        attempt: 1,
      }),
    })
  })

  it('tracks duration', async () => {
    mockFetch.mockResolvedValue({ status: 200, text: vi.fn().mockResolvedValue('OK') })
    const result = await deliverWebhook(webhook, 'test.event', {})
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })
})
