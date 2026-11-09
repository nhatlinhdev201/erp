import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authConfig } from '@/lib/auth.config'

/**
 * Edge Runtime compatible middleware
 * Uses auth.config.ts which does NOT import bcryptjs or Prisma
 * SSO: Detects Supabase cookie and redirects to SSO callback
 */
const { auth } = NextAuth(authConfig)

// Wrap auth middleware with SSO cookie detection
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── CORS cho API (cross-origin từ các module L-ERP: 3010–3022 + Kong 18000) ───
  const cors = corsHeaders(request)
  if (cors && pathname.startsWith('/api')) {
    if (request.method === 'OPTIONS') {
      // Preflight — phản hồi ngay, không cần auth
      return new NextResponse(null, { status: 204, headers: cors })
    }
    const res = await (auth as any)(request)
    // auth() có thể trả NextResponse hoặc plain Response — gán headers cho bất kỳ response nào có headers.set
    if (res && typeof res.headers?.set === 'function') {
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v)
    }
    return res
  }

  // SSO: Check for Supabase auth cookie before NextAuth check
  if (process.env.ENABLE_SUPABASE_SSO === 'true' && pathname !== '/api/auth/sso-callback') {
    const hasSupabaseCookie = request.cookies.getAll().some(c =>
      c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )
    const nextAuthCookie = request.cookies.get('authjs.session-token') ||
                          request.cookies.get('__Secure-authjs.session-token')

    if (hasSupabaseCookie && !nextAuthCookie) {
      const isPublicRoute = pathname.startsWith('/careers') ||
                           pathname.startsWith('/api') ||
                           pathname.startsWith('/_next') ||
                           pathname === '/login' ||
                           pathname === '/register' ||
                           pathname === '/forgot-password'

      if (!isPublicRoute) {
        const callbackUrl = new URL('/api/auth/sso-callback', request.url)
        callbackUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(callbackUrl)
      }
    }
  }

  // Proceed with normal NextAuth middleware
  return (auth as any)(request)
}

/**
 * Allowlist CORS cho /api/*
 * - Env CORS_ALLOWED_ORIGINS (comma-separated) được ưu tiên
 * - Default dev: http://localhost:3010..3022 (apps L-ERP) + http://localhost:18000 (Kong)
 * - KHÔNG dùng "*" vì API cần cookie credentials (NextAuth session)
 */
function corsHeaders(request: NextRequest): Record<string, string> | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  const fromEnv = process.env.CORS_ALLOWED_ORIGINS
  let allowed: string[]
  if (fromEnv) {
    allowed = fromEnv.split(',').map((s) => s.trim()).filter(Boolean)
  } else if (process.env.NODE_ENV === 'production') {
    return null // production: phải khai báo tường minh qua CORS_ALLOWED_ORIGINS
  } else {
    allowed = [18000, ...Array.from({ length: 13 }, (_, i) => 3010 + i)].map(
      (p) => `http://localhost:${p}`
    )
  }

  if (!allowed.includes(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-Id,X-Request-ID',
    'Access-Control-Max-Age': '3600',
    Vary: 'Origin',
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
