// =============================================================================
// L-ERP MRP - AUTH MIDDLEWARE WRAPPERS
// Reusable higher-order functions that eliminate duplicated inline auth checks
// in API route handlers. Wraps Next.js App Router handler signatures.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Session shape passed to authenticated handlers.
 * Mirrors the NextAuth session.user augmented in src/lib/auth.ts.
 */
export interface AuthSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  };
}

/**
 * Next.js 15 App Router route context.
 * params is a Promise in Next.js 15+.
 */
export type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Handler function that receives the authenticated session as a third argument.
 * Returns Response (not just NextResponse) to allow returning rate-limit
 * responses and other non-NextResponse instances.
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: RouteContext,
  session: AuthSession
) => Promise<Response>;

// =============================================================================
// withAuth - Require authentication (any role)
// =============================================================================

/**
 * Wraps a route handler with authentication.
 * If the user is not authenticated, returns 401 Unauthorized.
 * Otherwise, calls the handler with the session object.
 *
 * @example
 * ```ts
 * import { withAuth } from '@/lib/api/with-auth';
 *
 * export const GET = withAuth(async (request, context, session) => {
 *   // session.user.id is guaranteed to exist
 *   const data = await fetchData(session.user.id);
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context: RouteContext): Promise<Response> => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, context, session as AuthSession);
  };
}

// =============================================================================
// withRoleAuth - Require authentication + specific roles
// =============================================================================

/**
 * Wraps a route handler with authentication and role-based authorization.
 * If the user is not authenticated, returns 401 Unauthorized.
 * If the user's role is not in allowedRoles, returns 403 Forbidden.
 *
 * @example
 * ```ts
 * import { withRoleAuth } from '@/lib/api/with-auth';
 *
 * export const GET = withRoleAuth(['admin', 'manager'], async (request, context, session) => {
 *   // session.user.role is guaranteed to be 'admin' or 'manager'
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withRoleAuth(allowedRoles: string[], handler: AuthenticatedHandler) {
  return withAuth(async (request, context, session) => {
    const userRole = session.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(request, context, session);
  });
}
