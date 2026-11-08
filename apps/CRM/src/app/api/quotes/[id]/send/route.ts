import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, AuthError } from '@/lib/auth/get-current-user'
import { canAccess } from '@/lib/auth/rbac'
import { generateQuotePDF } from '@/lib/pdf/generate'
import { sendEmail } from '@/lib/email'
import { formatCurrency } from '@/lib/constants'
import { getCompanySettings } from '@/lib/pdf/utils'
import { rateLimitEmail } from '@/lib/api/rate-limit'
import { BadRequest, Forbidden, NotFound, RateLimited, InternalError, Unauthorized, handleApiError } from '@/lib/api/errors'
import { validateRequest, sendQuoteSchema } from '@/lib/validations'
import { apiSuccess } from '@/lib/api/response'
import { logger } from '@/lib/logger'

// POST /api/quotes/[id]/send — Send quote email with PDF attachment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id } = params

    // Rate limit
    const rl = rateLimitEmail(user.id)
    if (!rl.success) throw RateLimited(rl.resetAt)

    // Parse and validate request body
    const body = await req.json().catch(() => ({}))
    const sendData = validateRequest(sendQuoteSchema, body)
    const overrideTo = sendData.to
    const message = sendData.message

    // Fetch quote with contact and items
    const quote = await prisma.quote.findUnique({
      where: { id },
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
        items: { select: { id: true } },
      },
    })

    if (!quote) {
      throw NotFound('Báo giá')
    }

    // RBAC: owner (MEMBER+) or MANAGER+
    if (!canAccess(user, 'view_all') && quote.createdById !== user.id) {
      throw Forbidden()
    }

    // Validation: status must be DRAFT or SENT
    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      throw BadRequest('Chỉ có thể gửi báo giá ở trạng thái Nháp hoặc Đã gửi')
    }

    // Validation: must have items
    if (quote.items.length === 0) {
      throw BadRequest('Báo giá chưa có sản phẩm')
    }

    // Determine recipient email
    const recipientEmail = overrideTo || quote.contact?.email
    if (!recipientEmail) {
      throw BadRequest('Liên hệ chưa có email')
    }

    // Generate PDF
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateQuotePDF(id)
    } catch (pdfError) {
      logger.error('PDF generation failed', pdfError instanceof Error ? pdfError : null, {
        quoteId: id, userId: user.id,
      })
      throw InternalError('Không thể tạo PDF')
    }

    // Build email data
    const companyInfo = await getCompanySettings()
    const companyName = quote.company?.name || companyInfo.name
    const customerName = quote.contact
      ? `${quote.contact.firstName} ${quote.contact.lastName}`.trim()
      : recipientEmail
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'
    const viewUrl = `${appUrl}/quotes/${id}`
    const validUntil = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString('vi-VN')
      : 'Không giới hạn'

    const isResend = quote.status === 'SENT'

    // Send email
    const emailResult = await sendEmail(
      {
        to: recipientEmail,
        subject: `Báo giá ${quote.quoteNumber} từ ${companyName}`,
        template: 'quote-sent',
        data: {
          customerName,
          quoteNumber: quote.quoteNumber,
          totalAmount: formatCurrency(Number(quote.total)),
          validUntil,
          viewUrl,
          companyName,
        },
        attachments: [
          {
            filename: `${quote.quoteNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
        replyTo: user.email || undefined,
      },
      user.id
    )

    if (!emailResult.success) {
      logger.error('Email send failed', null, {
        quoteId: id, userId: user.id, error: emailResult.error,
      })
      throw InternalError('Không thể gửi email')
    }

    // Update quote status and sentAt
    await prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Create activity log
    const activitySubject = isResend
      ? `Gửi lại báo giá ${quote.quoteNumber}`
      : `Đã gửi báo giá ${quote.quoteNumber}`
    const activityDescription = message
      ? `Gửi đến ${recipientEmail}\nLời nhắn: ${message}`
      : `Gửi đến ${recipientEmail}`

    await prisma.activity.create({
      data: {
        type: 'EMAIL',
        subject: activitySubject,
        description: activityDescription,
        isCompleted: true,
        completedAt: new Date(),
        ...(quote.contactId && { contactId: quote.contactId }),
        userId: user.id,
      },
    })

    logger.audit('quote.send', user.id, {
      quoteId: id, sentTo: recipientEmail, isResend,
    })

    return apiSuccess({
      success: true,
      messageId: emailResult.messageId,
      sentTo: recipientEmail,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return handleApiError(Unauthorized(error.message), '/api/quotes/[id]/send')
    }
    return handleApiError(error, '/api/quotes/[id]/send')
  }
}
