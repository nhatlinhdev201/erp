import { NextRequest, NextResponse } from 'next/server'
import { renderTemplate, type EmailTemplate } from '@/lib/email'

// Sample data for each template preview
const SAMPLE_DATA: Record<EmailTemplate, Record<string, any>> = {
  welcome: {
    userName: 'Nguyễn Văn A',
    loginUrl: 'http://localhost:3000/login',
  },
  'quote-sent': {
    customerName: 'Trần Thị B',
    quoteNumber: 'QUO-2026-0001',
    totalAmount: '125.000.000 ₫',
    validUntil: '15/03/2026',
    viewUrl: 'http://localhost:3000/portal/quotes/abc123',
    companyName: 'Công ty ABC',
  },
  'quote-expiring': {
    customerName: 'Lê Văn C',
    quoteNumber: 'QUO-2026-0002',
    validUntil: '28/02/2026',
    daysLeft: 3,
    viewUrl: 'http://localhost:3000/portal/quotes/def456',
  },
  'portal-magic-link': {
    customerName: 'Phạm Thị D',
    magicLinkUrl: 'http://localhost:3000/portal/verify?token=abc123',
    expiresIn: '30 phút',
  },
  'password-reset': {
    userName: 'Nguyễn Văn E',
    resetUrl: 'http://localhost:3000/reset-password?token=xyz789',
    expiresIn: '1 giờ',
  },
  campaign: {
    content:
      '<h2 style="color:#1F2937">Khuyến mãi đặc biệt tháng 3!</h2><p>Giảm giá <strong>20%</strong> cho tất cả sản phẩm từ ngày 01/03 đến 31/03/2026.</p><p>Đừng bỏ lỡ cơ hội này!</p>',
    recipientName: 'Khách hàng',
    unsubscribeUrl: 'http://localhost:3000/unsubscribe?id=abc',
  },
  'notification-quote-accepted': {
    userName: 'Nguyễn Văn A',
    quoteNumber: 'QUO-2026-0003',
    contactName: 'Trần Thị B',
    total: '85.000.000 VND',
    viewUrl: 'http://localhost:3013/quotes/abc',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
  'notification-quote-rejected': {
    userName: 'Nguyễn Văn A',
    quoteNumber: 'QUO-2026-0004',
    contactName: 'Lê Văn C',
    viewUrl: 'http://localhost:3013/quotes/def',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
  'notification-ticket-new': {
    userName: 'Nguyễn Văn A',
    subject: 'Không thể đăng nhập vào hệ thống',
    contactName: 'Phạm Thị D',
    priority: 'HIGH',
    viewUrl: 'http://localhost:3013/tickets/abc',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
  'notification-ticket-assigned': {
    userName: 'Nguyễn Văn A',
    subject: 'Lỗi xuất báo cáo',
    contactName: 'Trần Văn E',
    priority: 'MEDIUM',
    viewUrl: 'http://localhost:3013/tickets/def',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
  'notification-order-status': {
    userName: 'Nguyễn Văn A',
    orderNumber: 'ORD-2026-0015',
    statusLabel: 'Đang giao hàng',
    viewUrl: 'http://localhost:3013/orders/abc',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
  'notification-quote-expiring': {
    userName: 'Nguyễn Văn A',
    quoteNumber: 'QUO-2026-0005',
    days: 3,
    viewUrl: 'http://localhost:3013/quotes/ghi',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
  'notification-campaign-sent': {
    userName: 'Nguyễn Văn A',
    campaignName: 'Khuyến mãi tháng 3',
    sentCount: 1250,
    viewUrl: 'http://localhost:3013/campaigns/abc',
    unsubscribeUrl: 'http://localhost:3013/api/notifications/unsubscribe?token=test',
    settingsUrl: 'http://localhost:3013/settings',
  },
}

// GET /api/email/preview/[template] — Preview email templates (dev only)
export async function GET(
  req: NextRequest,
  { params }: { params: { template: string } }
) {
  // Production: return 404
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const template = params.template as EmailTemplate
  const sampleData = SAMPLE_DATA[template]

  if (!sampleData) {
    return NextResponse.json(
      {
        error: `Unknown template: ${template}`,
        available: Object.keys(SAMPLE_DATA),
      },
      { status: 404 }
    )
  }

  try {
    const html = await renderTemplate(template, sampleData)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error: any) {
    console.error(`Email preview error for ${template}:`, error)
    return NextResponse.json(
      { error: `Failed to render template: ${error.message}` },
      { status: 500 }
    )
  }
}
