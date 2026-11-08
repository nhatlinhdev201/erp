// =============================================================================
// L-ERP MRP - RESET PASSWORD API
// Validates token and sets new password
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  validateResetToken,
  validateResetTokenWithUser,
  TokenValidationError,
} from '@/lib/auth/password-reset-utils';
import { checkSigninLimit } from '@/lib/rate-limit';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token không hợp lệ'),
  newPassword: z
    .string()
    .min(12, 'Mật khẩu phải có ít nhất 12 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ in hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// GET - Validate token (check if it's still valid)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkSigninLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 400 }
      );
    }

    await validateResetToken(token);

    return NextResponse.json({ success: true, valid: true });
  } catch (error) {
    if (error instanceof TokenValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    logger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { context: '/api/auth/reset-password GET' }
    );
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}

// POST - Reset password with token
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkSigninLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    // Find and validate token (includes user data)
    const resetToken = await validateResetTokenWithUser(token);

    // Check new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, resetToken.user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mới không được trùng với mật khẩu cũ' },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    logger.info('Password reset successful', {
      context: 'reset-password',
      details: `User: ${resetToken.user.email}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.',
    });
  } catch (error) {
    if (error instanceof TokenValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    logger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { context: '/api/auth/reset-password POST' }
    );
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}
