// =============================================================================
// L-ERP MRP - NEXT.JS MIDDLEWARE
// Route protection, security headers, rate limiting, request ID tracking
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Dev mode: skip all auth middleware
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
}

let getToken: any;
let uuidv4: any;
try {
  getToken = require('next-auth/jwt').getToken;
  uuidv4 = require('uuid').v4;
} catch {
  getToken = async () => null;
  uuidv4 = () => Math.random().toString(36).slice(2);
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/health',
  '/api/metrics',
  '/api/demo',  // Covers /api/demo/check, /api/demo/unlock, etc.
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
];

// Static file extensions
const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.woff', '.woff2'];

// Routes that require specific roles
const roleProtectedRoutes: Record<string, string[]> = {
  '/settings': ['admin'],
  '/users': ['admin'],
  '/api/v2/users': ['admin'],
  '/mrp-wizard': ['planner', 'manager', 'admin'],
  '/reports': ['planner', 'supervisor', 'manager', 'admin'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isPublicRoute(pathname: string): boolean {
  // Check if it's a static file
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return true;
  }

  // Check public routes
  return publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(roleProtectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return roles;
    }
  }
  return null;
}

import { hasPermission, type UserRole } from './lib/roles';

// ...

function hasRole(userRole: string, requiredRoles: string[]): boolean {
  // Check if user has AT LEAST one of the required roles (or higher authority)
  // Logic refactored to check against the minimum level required by the route.
  // Actually, usually routes require *specific* minimal usage.
  // The logic in original middleware was: 
  // const minRequiredLevel = Math.min(...requiredRoles.map(r => roleHierarchy[r] || 100));
  // return userLevel >= minRequiredLevel;

  // We will defer to the helper but since requiredRoles is an array, we find the "lowest" privilege needed?
  // Or is it "Allows [admin, planner]" means "Planner OR Admin"? Yes.
  // So we just need to satisfy one of them.

  return requiredRoles.some(role => hasPermission(userRole, role as UserRole));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  // Next.js requires 'unsafe-inline' for script hydration and style injection
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://cloudflareinsights.com wss:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ')
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// =============================================================================
// SIMPLE RATE LIMITER (In-memory)
// For production, use Redis-based rate limiting
// =============================================================================

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 500; // requests per window

// Check if running in test environment
function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' ||
         process.env.PLAYWRIGHT_TEST === 'true' ||
         process.env.E2E_TEST === 'true' ||
         process.env.SKIP_RATE_LIMIT === 'true';
}

function checkRateLimit(ip: string): boolean {
  // Skip rate limiting in test environment
  if (isTestEnvironment()) {
    return true;
  }

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((record, ip) => {
      if (now - record.timestamp > RATE_LIMIT_WINDOW) {
        keysToDelete.push(ip);
      }
    });
    keysToDelete.forEach(ip => rateLimitMap.delete(ip));
  }, RATE_LIMIT_WINDOW);
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export async function middleware(request: NextRequest) {
  // SECURITY: Explicit opt-in auth bypass for local development ONLY.
  // Requires BOTH: ALLOW_AUTH_BYPASS=true AND loopback IP.
  // Never active in production (NODE_ENV=production ignores this entirely).
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_AUTH_BYPASS === 'true'
  ) {
    const bypassIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const isLoopback = bypassIp === '127.0.0.1' || bypassIp === '::1' || bypassIp === 'unknown';
    if (isLoopback) {
      if (isApiRoute(request.nextUrl.pathname)) {
        console.warn(`[middleware] AUTH BYPASS active for local request from ${bypassIp} (ALLOW_AUTH_BYPASS=true)`);
      }
      return NextResponse.next();
    }
    // Non-loopback request with bypass enabled — still enforce full middleware chain
    console.warn(`[middleware] ALLOW_AUTH_BYPASS is set but request IP ${bypassIp} is not loopback — enforcing auth`);
  }

  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // Generate or preserve request ID (Gate 5.3 requirement)
  const requestId = request.headers.get('x-request-id') ?? uuidv4();

  // SSO: Detect Supabase auth cookie and redirect to SSO callback if no NextAuth session
  if (process.env.ENABLE_SUPABASE_SSO === 'true' && !isPublicRoute(pathname) && pathname !== '/api/auth/sso-callback') {
    const hasSupabaseCookie = Array.from(request.cookies.getAll()).some(c =>
      c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );
    const isProduction = process.env.NODE_ENV === 'production';
    const nextAuthCookie = request.cookies.get(
      isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token'
    );

    if (hasSupabaseCookie && !nextAuthCookie) {
      // Find the Supabase auth cookie value
      const sbCookie = Array.from(request.cookies.getAll()).find(c =>
        c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
      );
      if (sbCookie) {
        const callbackUrl = new URL('/api/auth/sso-callback', request.url);
        callbackUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(callbackUrl);
      }
    }
  }

  // Create new headers with requestId
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Rate limiting for API routes
  if (isApiRoute(pathname) && !isTestEnvironment() && !checkRateLimit(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('x-request-id', requestId);
    return addSecurityHeaders(response);
  }

  // Get session token - use correct cookie name for production
  // IMPORTANT: Must use AUTH_SECRET to match NextAuth v5 token signing
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({
    req: request,
    secret,
    cookieName: isProduction
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });

  // Redirect to login if not authenticated
  if (!token) {
    // For API routes, return 401
    if (isApiRoute(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized. Please login.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For web pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const requiredRoles = getRequiredRoles(pathname);
  if (requiredRoles) {
    const userRole = (token as { role?: string }).role || 'viewer';

    if (!hasRole(userRole, requiredRoles)) {
      // For API routes, return 403
      if (isApiRoute(pathname)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden. You do not have permission to access this resource.'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // For web pages, redirect to dashboard with error
      const dashboardUrl = new URL('/home', request.url);
      dashboardUrl.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Continue with request
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Add requestId to response headers
  response.headers.set('x-request-id', requestId);

  // Add user info to request headers for API routes
  if (isApiRoute(pathname)) {
    response.headers.set('x-user-id', (token as { id?: string }).id || '');
    response.headers.set('x-user-role', (token as { role?: string }).role || '');
  }

  return addSecurityHeaders(response);
}

// =============================================================================
// MIDDLEWARE CONFIG
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
