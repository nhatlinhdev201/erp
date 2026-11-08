// =============================================================================
// L-ERP MRP - FORGOT PASSWORD API
// Sends password reset email via email-service (logs to console if SMTP not configured)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/email/email-service';
import { checkStrictAuthLimit } from '@/lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (strict: 3 req/min per IP for password reset)
    const rateLimitResult = await checkStrictAuthLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, status: true },
    });

    if (!user || user.status !== 'active') {
      // Return success anyway to prevent enumeration
      return successResponse;
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used
      },
    });

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send password reset email
    const emailResult = await emailService.send({
      to: user.email,
      subject: '[L-ERP MRP] Đặt lại mật khẩu',
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5;">
          <div style="max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#166534 0%,#3ecf8e 100%);color:white;padding:24px;border-radius:12px 12px 0 0;">
              <h2 style="margin:0;font-size:20px;">Đặt lại mật khẩu</h2>
              <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">L-ERP MRP System</p>
            </div>
            <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
              <p style="margin:0 0 16px;color:#374151;">Xin chào ${user.name || 'bạn'},</p>
              <p style="margin:0 0 16px;color:#374151;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                Nhấn vào nút bên dưới để tạo mật khẩu mới:
              </p>
              <a href="${resetUrl}" style="display:inline-block;background:#166534;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">
                Đặt lại mật khẩu
              </a>
              <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
                Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              </p>
            </div>
            <div style="background:#f9fafb;padding:16px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                Email này được gửi tự động từ hệ thống L-ERP MRP.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Xin chào ${user.name || 'bạn'},\n\nĐặt lại mật khẩu tại: ${resetUrl}\n\nLiên kết hết hạn sau 1 giờ.\n\nL-ERP MRP System`,
    });

    if (!emailResult.success) {
      logger.warn('Failed to send password reset email, SMTP may not be configured', {
        context: 'forgot-password',
        details: emailResult.error || 'Unknown email error',
      });
    }

    // Log reset request (without exposing token)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Password reset requested', {
        context: 'forgot-password',
        details: `Reset token generated for ${user.email} (token redacted)`,
      });
    }

    logger.info('Password reset token generated', {
      context: 'forgot-password',
      details: `User: ${user.email}, emailSent: ${emailResult.success}`,
    });

    return successResponse;
  } catch (error) {
    logger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { context: '/api/auth/forgot-password' }
    );
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
