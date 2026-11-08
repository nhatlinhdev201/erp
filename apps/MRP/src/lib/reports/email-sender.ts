// src/lib/reports/email-sender.ts
// Report Email Sender - Send scheduled reports via email
// Note: nodemailer is optional. If not installed, emails will be logged instead.

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { logger } from '@/lib/logger';

// Types
interface ReportEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  reportName: string;
  reportNameVi: string;
  summary: string;
  attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
  mrpUrl?: string;
}

interface MailOptions {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

interface Transporter {
  sendMail(options: MailOptions): Promise<{ messageId: string }>;
}

// Nodemailer module (loaded dynamically)
let nodemailerModule: { createTransport: (config: unknown) => Transporter } | null = null;
let transporter: Transporter | null = null;

// Try to load nodemailer dynamically (only on server-side)
async function loadNodemailer(): Promise<boolean> {
  if (typeof window !== 'undefined') return false;
  if (nodemailerModule) return true;

  try {
    // Dynamic import - webpackIgnore prevents bundler from resolving
    const mod = await import(/* webpackIgnore: true */ 'nodemailer');
    nodemailerModule = mod.default || mod;
    return true;
  } catch {
    return false;
  }
}

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const hasNodemailer = await loadNodemailer();

  // Use environment variables for configuration
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!hasNodemailer || !user || !pass) {
    logger.warn('[EmailSender] SMTP not configured or nodemailer not installed. Email sending will be simulated.', { context: 'email-sender' });
    // Return a mock transporter for development
    return {
      sendMail: async (options: MailOptions) => {
        logger.info('[MOCK EMAIL]', {
          context: 'email-sender',
          to: options.to,
          subject: options.subject,
          attachments: options.attachments?.map((a) => a.filename),
        });
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  transporter = nodemailerModule!.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Generate Vietnamese email HTML template
 */
function generateEmailTemplate(options: ReportEmailOptions): string {
  const now = new Date();
  const formattedTime = format(now, "HH:mm 'ngày' dd/MM/yyyy", { locale: vi });
  const mrpUrl = options.mrpUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #166534 0%, #3ecf8e 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
        📊 ${options.reportNameVi}
      </h2>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">
        L-ERP MRP Scheduled Report
      </p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
      <p style="margin: 0 0 16px; color: #374151;">Xin chào,</p>
      <p style="margin: 0 0 16px; color: #374151;">
        Đây là báo cáo tự động từ hệ thống L-ERP MRP:
      </p>

      <!-- Summary Box -->
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px; color: #1f2937; font-size: 14px; font-weight: 600;">
          Tóm tắt
        </h4>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
          ${options.summary}
        </p>
      </div>

      <p style="margin: 16px 0; color: #374151; font-size: 14px;">
        📎 File báo cáo chi tiết được đính kèm trong email này.
      </p>

      <!-- CTA Button -->
      <a href="${mrpUrl}" style="
        display: inline-block;
        background: #166534;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        margin-top: 8px;
      ">
        Mở L-ERP MRP →
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: 0;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        Báo cáo được tạo tự động lúc ${formattedTime}.
      </p>
      <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">
        Quản lý lịch gửi tại
        <a href="${mrpUrl}/reports/scheduled" style="color: #30a46c; text-decoration: none;">
          Settings → Reports
        </a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send report email
 */
export async function sendReportEmail(options: ReportEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const transport = await getTransporter();

    const mailOptions: MailOptions = {
      from: `"L-ERP MRP Reports" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@lerp-mrp.local'}>`,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: `📊 [L-ERP MRP] ${options.reportNameVi} - ${format(new Date(), 'dd/MM/yyyy')}`,
      html: generateEmailTemplate(options),
      attachments: options.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    };

    const result = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'email-sender', operation: 'sendReportEmail' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(to: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const transport = await getTransporter();

    const mailOptions: MailOptions = {
      from: `"L-ERP MRP" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@lerp-mrp.local'}>`,
      to: [to],
      subject: '✅ [L-ERP MRP] Test Email',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">✅ Email Configuration OK</h2>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
            <p>Cấu hình email đã hoạt động.</p>
            <p style="color: #6b7280; font-size: 14px;">
              Gửi lúc: ${format(new Date(), "HH:mm:ss 'ngày' dd/MM/yyyy", { locale: vi })}
            </p>
          </div>
        </div>
      `,
    };

    const result = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'email-sender', operation: 'sendTestEmail' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  sendReportEmail,
  sendTestEmail,
};
