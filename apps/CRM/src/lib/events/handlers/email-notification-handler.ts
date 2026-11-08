import { eventBus } from '../event-bus'
import { CRM_EVENTS } from '../types'
import type {
  QuoteEventPayload,
  QuoteExpiringPayload,
  TicketEventPayload,
  OrderStatusEventPayload,
  CampaignEventPayload,
} from '../types'
import { sendEmail, type EmailTemplate } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { generateNotifUnsubscribeUrl } from '@/lib/notifications/unsubscribe-token'

// ── Rate limit: 50 notification emails per user per day ──────────────

const DAILY_LIMIT = 50

async function isRateLimited(userEmail: string): Promise<boolean> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todayCount = await prisma.emailLog.count({
    where: {
      to: userEmail,
      template: { startsWith: 'notification-' },
      createdAt: { gte: startOfDay },
    },
  })
  return todayCount >= DAILY_LIMIT
}

// ── Event → email config map ─────────────────────────────────────────

interface EmailEventConfig {
  template: EmailTemplate
  getRecipientIds: (payload: unknown) => string[] | Promise<string[]>
  getSubject: (payload: unknown) => string
  getData: (payload: unknown, baseUrl: string) => Record<string, any>
}

const EMAIL_EVENT_MAP: Record<string, EmailEventConfig> = {
  [CRM_EVENTS.QUOTE_ACCEPTED]: {
    template: 'notification-quote-accepted',
    getRecipientIds: (p) => [(p as QuoteEventPayload).ownerId],
    getSubject: (p) => {
      const q = p as QuoteEventPayload
      return `\u2705 Báo giá ${q.quote.quoteNumber} được chấp nhận`
    },
    getData: (p, baseUrl) => {
      const q = p as QuoteEventPayload
      return {
        quoteNumber: q.quote.quoteNumber,
        contactName: q.quote.contactName || '',
        total: q.quote.total ? new Intl.NumberFormat('vi-VN').format(q.quote.total) + ' VND' : '',
        viewUrl: `${baseUrl}/quotes/${q.quoteId}`,
      }
    },
  },

  [CRM_EVENTS.QUOTE_REJECTED]: {
    template: 'notification-quote-rejected',
    getRecipientIds: (p) => [(p as QuoteEventPayload).ownerId],
    getSubject: (p) => {
      const q = p as QuoteEventPayload
      return `\u274C Báo giá ${q.quote.quoteNumber} bị từ chối`
    },
    getData: (p, baseUrl) => {
      const q = p as QuoteEventPayload
      return {
        quoteNumber: q.quote.quoteNumber,
        contactName: q.quote.contactName || '',
        viewUrl: `${baseUrl}/quotes/${q.quoteId}`,
      }
    },
  },

  [CRM_EVENTS.TICKET_CREATED]: {
    template: 'notification-ticket-new',
    getRecipientIds: async () => {
      const managers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER'] } },
        select: { id: true },
      })
      return managers.map((m) => m.id)
    },
    getSubject: (p) => {
      const t = p as TicketEventPayload
      return `\uD83C\uDFAB Yêu cầu hỗ trợ mới: ${t.ticket.subject}`
    },
    getData: (p, baseUrl) => {
      const t = p as TicketEventPayload
      return {
        subject: t.ticket.subject,
        contactName: t.contactName,
        priority: t.ticket.priority,
        viewUrl: `${baseUrl}/tickets/${t.ticketId}`,
      }
    },
  },

  [CRM_EVENTS.TICKET_ASSIGNED]: {
    template: 'notification-ticket-assigned',
    getRecipientIds: (p) => {
      const t = p as TicketEventPayload
      return t.assigneeId ? [t.assigneeId] : []
    },
    getSubject: (p) => {
      const t = p as TicketEventPayload
      return `\uD83D\uDCCB Ticket được gán cho bạn: ${t.ticket.subject}`
    },
    getData: (p, baseUrl) => {
      const t = p as TicketEventPayload
      return {
        subject: t.ticket.subject,
        contactName: t.contactName,
        priority: t.ticket.priority,
        viewUrl: `${baseUrl}/tickets/${t.ticketId}`,
      }
    },
  },

  [CRM_EVENTS.ORDER_STATUS_CHANGED]: {
    template: 'notification-order-status',
    getRecipientIds: (p) => [(p as OrderStatusEventPayload).ownerId],
    getSubject: (p) => {
      const o = p as OrderStatusEventPayload
      return `\uD83D\uDCE6 Đơn hàng ${o.order.orderNumber}: ${o.statusLabel}`
    },
    getData: (p, baseUrl) => {
      const o = p as OrderStatusEventPayload
      return {
        orderNumber: o.order.orderNumber,
        statusLabel: o.statusLabel,
        viewUrl: `${baseUrl}/orders/${o.orderId}`,
      }
    },
  },

  [CRM_EVENTS.QUOTE_EXPIRING]: {
    template: 'notification-quote-expiring',
    getRecipientIds: (p) => [(p as QuoteExpiringPayload).ownerId],
    getSubject: (p) => {
      const q = p as QuoteExpiringPayload
      return `\u23F0 Báo giá ${q.quote.quoteNumber} sắp hết hạn`
    },
    getData: (p, baseUrl) => {
      const q = p as QuoteExpiringPayload
      return {
        quoteNumber: q.quote.quoteNumber,
        days: q.days,
        viewUrl: `${baseUrl}/quotes/${q.quoteId}`,
      }
    },
  },

  [CRM_EVENTS.CAMPAIGN_SENT]: {
    template: 'notification-campaign-sent',
    getRecipientIds: (p) => [(p as CampaignEventPayload).createdById],
    getSubject: (p) => {
      const c = p as CampaignEventPayload
      return `\uD83D\uDCE7 Chiến dịch "${c.campaign.name}" đã gửi xong`
    },
    getData: (p, baseUrl) => {
      const c = p as CampaignEventPayload
      return {
        campaignName: c.campaign.name,
        sentCount: c.sentCount,
        viewUrl: `${baseUrl}/campaigns/${c.campaignId}`,
      }
    },
  },
}

// ── Register handlers ────────────────────────────────────────────────

export function registerEmailNotificationHandlers(): void {
  for (const [event, config] of Object.entries(EMAIL_EVENT_MAP)) {
    eventBus.on(event, async (payload: unknown) => {
      try {
        const recipientIds = await Promise.resolve(config.getRecipientIds(payload))
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'
        const settingsUrl = `${baseUrl}/settings`

        for (const userId of recipientIds) {
          // Check user preference — default: email OFF
          const pref = await prisma.notificationPreference.findUnique({
            where: { userId_eventType: { userId, eventType: event } },
          })
          if (!pref?.email) continue

          // Get user
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
          })
          if (!user?.email) continue

          // Rate limit check
          if (await isRateLimited(user.email)) continue

          // Build template data
          const data = config.getData(payload, baseUrl)
          const unsubscribeUrl = generateNotifUnsubscribeUrl(userId, event)

          // Fire-and-forget send
          sendEmail(
            {
              to: user.email,
              subject: config.getSubject(payload),
              template: config.template,
              data: {
                ...data,
                userName: user.name || user.email,
                unsubscribeUrl,
                settingsUrl,
              },
            },
            userId
          ).catch((err) => {
            console.error(`[EmailNotification] Send failed for ${event} to ${user.email}:`, err)
          })
        }
      } catch (err) {
        console.error(`[EmailNotification] Error for ${event}:`, err)
      }
    })
  }
}
