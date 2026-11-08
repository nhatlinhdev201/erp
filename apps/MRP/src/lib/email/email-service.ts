// =============================================================================
// EMAIL SERVICE
// Abstraction layer for email sending with multiple provider support
// =============================================================================

// Note: nodemailer is optional. If not installed, emails will be logged instead.
// To enable actual email sending, install nodemailer: npm install nodemailer

import { logger } from '@/lib/logger';

// Nodemailer types - we use dynamic import to make it optional
interface NodemailerTransporter {
  sendMail(options: unknown): Promise<{ messageId: string }>;
  verify(): Promise<void>;
}

type NodemailerModule = {
  createTransport(options: unknown): NodemailerTransporter;
};

// Will be loaded dynamically if available
let nodemailer: NodemailerModule | null = null;
let nodemailerLoaded = false;

// Load nodemailer dynamically (only on server-side and if explicitly configured)
async function loadNodemailer(): Promise<NodemailerModule | null> {
  if (nodemailerLoaded) return nodemailer;
  nodemailerLoaded = true;

  if (typeof window === 'undefined' && process.env.EMAIL_PROVIDER) {
    try {
      // Dynamic import - webpackIgnore prevents bundler from resolving
      const mod = await import(/* webpackIgnore: true */ 'nodemailer');
      nodemailer = mod.default || mod;
    } catch {
      // nodemailer not installed - this is fine, emails will be logged
    }
  }
  return nodemailer;
}

// =============================================================================
// TYPES
// =============================================================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type EmailProvider = 'smtp' | 'sendgrid' | 'ses' | 'resend';

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export const emailTemplates = {
  workflowApproval: (data: {
    recipientName: string;
    workflowName: string;
    instanceId: string;
    stepName: string;
    submittedBy: string;
    actionUrl: string;
  }) => ({
    subject: `[Action Required] Approval Request: ${data.workflowName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #30a46c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #30a46c; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Approval Request</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>You have a pending approval request that requires your attention.</p>
            <table style="width: 100%; margin: 16px 0;">
              <tr><td><strong>Workflow:</strong></td><td>${data.workflowName}</td></tr>
              <tr><td><strong>Step:</strong></td><td>${data.stepName}</td></tr>
              <tr><td><strong>Submitted by:</strong></td><td>${data.submittedBy}</td></tr>
            </table>
            <p>Please review and take action.</p>
            <a href="${data.actionUrl}" class="button">Review Now</a>
          </div>
          <div class="footer">
            <p>This is an automated message from L-ERP MRP System.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.recipientName},

You have a pending approval request that requires your attention.

Workflow: ${data.workflowName}
Step: ${data.stepName}
Submitted by: ${data.submittedBy}

Please review at: ${data.actionUrl}

This is an automated message from L-ERP MRP System.
    `,
  }),

  overdueReminder: (data: {
    recipientName: string;
    workflowName: string;
    stepName: string;
    dueDate: string;
    actionUrl: string;
  }) => ({
    subject: `[Overdue] Reminder: ${data.workflowName} - ${data.stepName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Overdue Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p class="warning">Your approval for the following item is overdue.</p>
            <table style="width: 100%; margin: 16px 0;">
              <tr><td><strong>Workflow:</strong></td><td>${data.workflowName}</td></tr>
              <tr><td><strong>Step:</strong></td><td>${data.stepName}</td></tr>
              <tr><td><strong>Due Date:</strong></td><td>${data.dueDate}</td></tr>
            </table>
            <p>Please take action as soon as possible.</p>
            <a href="${data.actionUrl}" class="button">Take Action Now</a>
          </div>
          <div class="footer">
            <p>This is an automated message from L-ERP MRP System.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.recipientName},

OVERDUE: Your approval for the following item is overdue.

Workflow: ${data.workflowName}
Step: ${data.stepName}
Due Date: ${data.dueDate}

Please take action at: ${data.actionUrl}

This is an automated message from L-ERP MRP System.
    `,
  }),

  alertNotification: (data: {
    recipientName: string;
    alertType: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionUrl?: string;
  }) => {
    const severityColors = {
      low: '#30a46c',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#dc2626',
    };
    const color = severityColors[data.severity];

    return {
      subject: `[${data.severity.toUpperCase()}] ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: ${color}; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.alertType} Alert</h1>
            </div>
            <div class="content">
              <p>Hi ${data.recipientName},</p>
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Details</a>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message from L-ERP MRP System.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${data.recipientName},

[${data.severity.toUpperCase()}] ${data.alertType} Alert

${data.title}

${data.message}

${data.actionUrl ? `View details at: ${data.actionUrl}` : ''}

This is an automated message from L-ERP MRP System.
      `,
    };
  },

  reportDelivery: (data: {
    recipientName: string;
    reportName: string;
    reportType: string;
    generatedAt: string;
    downloadUrl: string;
  }) => ({
    subject: `Report Ready: ${data.reportName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Report Ready</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>Your requested report is ready for download.</p>
            <table style="width: 100%; margin: 16px 0;">
              <tr><td><strong>Report:</strong></td><td>${data.reportName}</td></tr>
              <tr><td><strong>Type:</strong></td><td>${data.reportType}</td></tr>
              <tr><td><strong>Generated:</strong></td><td>${data.generatedAt}</td></tr>
            </table>
            <a href="${data.downloadUrl}" class="button">Download Report</a>
            <p style="margin-top: 16px; font-size: 12px; color: #666;">
              This link will expire in 7 days.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from L-ERP MRP System.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.recipientName},

Your requested report is ready for download.

Report: ${data.reportName}
Type: ${data.reportType}
Generated: ${data.generatedAt}

Download at: ${data.downloadUrl}

This link will expire in 7 days.

This is an automated message from L-ERP MRP System.
    `,
  }),
};

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

class EmailService {
  private transporter: NodemailerTransporter | null = null;
  private provider: EmailProvider;
  private fromAddress: string;
  private fromName: string;
  private initialized = false;

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'smtp';
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@lerp-mrp.local';
    this.fromName = process.env.EMAIL_FROM_NAME || 'L-ERP MRP System';
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    await loadNodemailer();
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // If nodemailer is not installed, skip transporter initialization
    if (!nodemailer) {
      logger.warn('[EmailService] nodemailer not available. Emails will be logged instead.', { context: 'email-service' });
      return;
    }

    switch (this.provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        break;

      case 'ses':
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: {
            user: process.env.AWS_SES_ACCESS_KEY_ID,
            pass: process.env.AWS_SES_SECRET_ACCESS_KEY,
          },
        });
        break;

      case 'resend':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY,
          },
        });
        break;

      case 'smtp':
      default:
        // Generic SMTP configuration
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');
        const smtpSecure = process.env.SMTP_SECURE === 'true';

        if (smtpHost) {
          this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: process.env.SMTP_USER
              ? {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
                }
              : undefined,
          });
        } else {
          // Development: create test account or use console logging
          logger.warn('[EmailService] No SMTP configuration found. Emails will be logged instead.', { context: 'email-service' });
        }
        break;
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      await this.ensureInitialized();

      // Validate
      if (!options.to || (!options.text && !options.html)) {
        return {
          success: false,
          error: 'Missing required fields: to, and text or html',
        };
      }

      // If no transporter configured, log to console (development mode)
      if (!this.transporter) {
        logger.info('[EmailService] Email would be sent', {
          to: options.to,
          subject: options.subject,
          hasHtml: !!options.html,
          hasAttachments: (options.attachments?.length || 0) > 0,
        });

        return {
          success: true,
          messageId: `dev-${Date.now()}`,
        };
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
        })),
        replyTo: options.replyTo,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('[EmailService] Email sent successfully', { messageId: result.messageId });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'email-service', operation: 'sendEmail' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send workflow approval request email
   */
  async sendWorkflowApproval(
    to: string,
    recipientName: string,
    data: {
      workflowName: string;
      instanceId: string;
      stepName: string;
      submittedBy: string;
    }
  ): Promise<EmailResult> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const actionUrl = `${baseUrl}/approvals/${data.instanceId}`;

    const template = emailTemplates.workflowApproval({
      recipientName,
      ...data,
      actionUrl,
    });

    return this.send({
      to,
      ...template,
    });
  }

  /**
   * Send overdue reminder email
   */
  async sendOverdueReminder(
    to: string,
    recipientName: string,
    data: {
      workflowName: string;
      instanceId: string;
      stepName: string;
      dueDate: string;
    }
  ): Promise<EmailResult> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const actionUrl = `${baseUrl}/approvals/${data.instanceId}`;

    const template = emailTemplates.overdueReminder({
      recipientName,
      workflowName: data.workflowName,
      stepName: data.stepName,
      dueDate: data.dueDate,
      actionUrl,
    });

    return this.send({
      to,
      ...template,
    });
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotification(
    to: string,
    recipientName: string,
    data: {
      alertType: string;
      title: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      actionUrl?: string;
    }
  ): Promise<EmailResult> {
    const template = emailTemplates.alertNotification({
      recipientName,
      ...data,
    });

    return this.send({
      to,
      ...template,
    });
  }

  /**
   * Send report delivery email with optional attachment
   */
  async sendReportDelivery(
    to: string,
    recipientName: string,
    data: {
      reportName: string;
      reportType: string;
      generatedAt: string;
      downloadUrl: string;
      attachReport?: boolean;
      reportContent?: Buffer;
      reportFilename?: string;
    }
  ): Promise<EmailResult> {
    const template = emailTemplates.reportDelivery({
      recipientName,
      reportName: data.reportName,
      reportType: data.reportType,
      generatedAt: data.generatedAt,
      downloadUrl: data.downloadUrl,
    });

    const attachments: EmailAttachment[] = [];
    if (data.attachReport && data.reportContent && data.reportFilename) {
      attachments.push({
        filename: data.reportFilename,
        content: data.reportContent,
        contentType: data.reportFilename.endsWith('.pdf')
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }

    return this.send({
      to,
      ...template,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  }

  /**
   * Verify transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'email-service', operation: 'verifyConnection' });
      return false;
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const emailService = new EmailService();
export default emailService;
