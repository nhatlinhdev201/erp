// =============================================================================
// L-ERP MRP - REGISTER API
// Create new user account with email/password
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { checkStrictAuthLimit } from '@/lib/rate-limit';

const ALLOWED_ROLES = ['viewer', 'operator', 'manager'] as const;

const registerSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(100, 'Tên quá dài'),
  email: z
    .string()
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
  role: z.enum(ALLOWED_ROLES, { message: 'Vai trò không hợp lệ' }).default('viewer'),
  password: z
    .string()
    .min(12, 'Mật khẩu phải có ít nhất 12 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ in hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (strict: 3 req/min per IP)
    const rateLimitResult = await checkStrictAuthLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, role, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email này đã được sử dụng' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with selected role
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        status: 'active',
      },
    });

    logger.info('New user registered', {
      context: 'register',
      details: `Email: ${normalizedEmail}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Tài khoản đã được tạo thành công',
    });
  } catch (error) {
    logger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { context: '/api/auth/register POST' }
    );
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
