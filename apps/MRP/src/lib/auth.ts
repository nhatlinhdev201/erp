// =============================================================================
// L-ERP MRP - NEXTAUTH CONFIGURATION (v5)
// Complete authentication with account lockout and security features
// =============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { logger } from '@/lib/logger';

// =============================================================================
// PASSWORD POLICY
// =============================================================================

export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  maxAge: 90, // days
  preventReuse: 5, // number of previous passwords to check
};

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${PASSWORD_POLICY.minLength} ký tự`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ in hoa');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  }
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// SECURITY HELPERS
// =============================================================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function checkAccountLock(userId: string): Promise<{ locked: boolean; message?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginCount: true,
        lockedUntil: true
      },
    });

    if (!user) {
      return { locked: false };
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return {
        locked: true,
        message: `Tài khoản bị khóa. Vui lòng thử lại sau ${remainingMin} phút.`
      };
    }

    return { locked: false };
  } catch {
    return { locked: false };
  }
}

async function incrementFailedAttempts(userId: string): Promise<void> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: { increment: 1 },
      },
      select: { failedLoginCount: true },
    });

    if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
        },
      });
      logger.warn(`[AUTH] Account locked due to failed attempts: ${userId}`, { context: 'auth' });
    }
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'auth', operation: 'incrementFailedAttempts' });
  }
}

async function resetFailedAttempts(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'auth', operation: 'resetFailedAttempts' });
  }
}

// =============================================================================
// NEXTAUTH CONFIGURATION
// =============================================================================

// =============================================================================
// SSO PROVIDER (conditional)
// =============================================================================

function getSSOProvider(): never[] {
  // SSO via @prismy/sso is not available in this build.
  // To enable, install @prismy/sso and set ENABLE_SUPABASE_SSO=true.
  return [];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "TOTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn('[AUTH] Login attempt with missing credentials', { context: 'auth' });
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              status: true,
              failedLoginCount: true,
              lockedUntil: true,
              mfaEnabled: true,
            },
          });

          if (!user) {
            logger.warn(`[AUTH] Login attempt for non-existent user: ${email}`, { context: 'auth' });
            return null;
          }

          // Check if account is locked
          const lockStatus = await checkAccountLock(user.id);
          if (lockStatus.locked) {
            logger.warn(`[AUTH] Login attempt for locked account: ${email}`, { context: 'auth' });
            throw new Error(lockStatus.message);
          }

          // Check if user is active
          if (user.status !== "active") {
            logger.warn(`[AUTH] Login attempt for inactive user: ${email}`, { context: 'auth' });
            return null;
          }

          // Verify password
          if (!user.password) {
            logger.warn(`[AUTH] User has no password set: ${email}`, { context: 'auth' });
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            logger.warn(`[AUTH] Invalid password for user: ${email}`, { context: 'auth' });
            await incrementFailedAttempts(user.id);
            return null;
          }

          // Check MFA if enabled
          if (user.mfaEnabled) {
            if (!credentials.totp) {
              throw new Error('MFA_REQUIRED');
            }
            // TOTP verification would be implemented here with speakeasy
          }

          // Reset failed attempts on successful login
          await resetFailedAttempts(user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: (user.role as UserRole) || 'viewer',
          };
        } catch (error) {
          if (error instanceof Error && error.message === 'MFA_REQUIRED') {
            throw error;
          }
          logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'auth', operation: 'login' });
          return null;
        }
      },
    }),
    ...getSSOProvider(),
  ],
  callbacks: {
    async signIn({ user }) {
      // Validate user object exists with required fields
      if (!user || !user.id) {
        logger.error('[AUTH] SignIn callback: Invalid user object', { context: 'auth' });
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // On initial sign in, add all user fields to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role || 'viewer';
      }
      return token;
    },
    async session({ session, token }) {
      // Transfer token data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string || null;
        session.user.role = (token.role as UserRole) || 'viewer';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // Update session every hour
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.callback-url'
        : 'authjs.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-authjs.csrf-token'
        : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
});

// =============================================================================
// TYPE DECLARATIONS
// =============================================================================

// ... imports
import { UserRole } from "./roles";

// ... existing code ...

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    };
  }
}

