import { prisma } from '@/lib/prisma'
import { getCurrentUser, AuthError } from '@/lib/auth/get-current-user'
import { canAccess } from '@/lib/auth/rbac'
import { sendEmail } from '@/lib/email'
import { daysUntilExpiry } from '@/lib/quotes/status'
import { Forbidden, Unauthorized, handleApiError } from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import { logger } from '@/lib/logger'
import { eventBus, CRM_EVENTS } from '@/lib/events'

// POST /api/quotes/check-expiry — Check and expire overdue quotes, send reminders
export async function POST() {
  try {
    const user = await getCurrentUser()

    // Only ADMIN or MANAGER can run this
    if (!canAccess(user, 'view_all')) {
      throw Forbidden()
    }

    const now = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    // ── 1. Auto-expire overdue quotes ──────────────────────────────────
    const expiredQuotes = await prisma.quote.findMany({
      where: {
        status: 'SENT',
        validUntil: {
          not: null,
          lte: now,
        },
      },
      select: {
        id: true,
        quoteNumber: true,
        contactId: true,
        createdById: true,
      },
    })

    for (const quote of expiredQuotes) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' },
      })

      await prisma.activity.create({
        data: {
          type: 'NOTE',
          subject: `Báo giá ${quote.quoteNumber} đã hết hạn`,
          description: 'Tự động cập nhật bởi hệ thống',
          isCompleted: true,
          completedAt: new Date(),
          ...(quote.contactId && { contactId: quote.contactId }),
          userId: quote.createdById,
        },
      })
    }

    // ── 2. Send reminder for quotes expiring within 3 days ─────────────
    const expiringQuotes = await prisma.quote.findMany({
      where: {
        status: 'SENT',
        validUntil: {
          not: null,
          gt: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: { name: true },
        },
      },
    })

    let remindersSent = 0

    for (const quote of expiringQuotes) {
      // Skip if contact has no email
      if (!quote.contact?.email) continue

      // Check if we already sent a reminder for this quote (avoid duplicates)
      const existingReminder = await prisma.emailLog.findFirst({
        where: {
          template: 'quote-expiring',
          to: quote.contact.email,
          // Check if reminder sent in last 24 hours for this quote
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          subject: { contains: quote.quoteNumber },
        },
      })

      if (existingReminder) continue

      const customerName = `${quote.contact.firstName} ${quote.contact.lastName}`.trim()
      const days = daysUntilExpiry(quote) ?? 0
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'
      const viewUrl = `${appUrl}/quotes/${quote.id}`
      const validUntilStr = quote.validUntil
        ? new Date(quote.validUntil).toLocaleDateString('vi-VN')
        : ''

      const emailResult = await sendEmail(
        {
          to: quote.contact.email,
          subject: `Báo giá ${quote.quoteNumber} sắp hết hạn`,
          template: 'quote-expiring',
          data: {
            customerName,
            quoteNumber: quote.quoteNumber,
            validUntil: validUntilStr,
            daysLeft: days,
            viewUrl,
          },
        },
        quote.createdById
      )

      if (emailResult.success) {
        remindersSent++

        await prisma.activity.create({
          data: {
            type: 'EMAIL',
            subject: `Gửi nhắc nhở hết hạn báo giá ${quote.quoteNumber}`,
            description: `Tự động gửi đến ${quote.contact.email} — còn ${days} ngày`,
            isCompleted: true,
            completedAt: new Date(),
            ...(quote.contactId && { contactId: quote.contactId }),
            userId: quote.createdById,
          },
        })

        // Fire-and-forget: emit quote expiring event
        eventBus.emit(CRM_EVENTS.QUOTE_EXPIRING, {
          timestamp: new Date().toISOString(),
          quoteId: quote.id,
          quote: { quoteNumber: quote.quoteNumber },
          ownerId: quote.createdById,
          days,
        }).catch(() => {})
      }
    }

    logger.info('Quote expiry check completed', {
      expired: expiredQuotes.length,
      reminders: remindersSent,
      userId: user.id,
    })

    return apiSuccess({
      expired: expiredQuotes.length,
      reminders: remindersSent,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return handleApiError(Unauthorized(error.message), '/api/quotes/check-expiry')
    }
    return handleApiError(error, '/api/quotes/check-expiry')
  }
}
