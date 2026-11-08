// =============================================================================
// L-ERP MRP - AUTH MIDDLEWARE
// Centralized authentication and authorization for API routes
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// =============================================================================
// TYPES
// =============================================================================

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'planner' | 'operator' | 'viewer' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  status?: number;
}

// =============================================================================
// ROLE HIERARCHY & PERMISSIONS
// =============================================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  manager: 80,
  supervisor: 60,
  planner: 50,
  operator: 40,
  viewer: 20,
  user: 10,
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // All permissions
  manager: [
    'parts:read', 'parts:write', 'parts:delete',
    'inventory:read', 'inventory:write', 'inventory:adjust',
    'sales:read', 'sales:write', 'sales:approve',
    'production:read', 'production:write', 'production:release',
    'quality:read', 'quality:write', 'quality:close',
    'bom:read', 'bom:write',
    'analytics:read',
    'reports:read', 'reports:export',
    'users:read',
  ],
  supervisor: [
    'parts:read', 'parts:write',
    'inventory:read', 'inventory:write', 'inventory:adjust',
    'sales:read', 'sales:write',
    'production:read', 'production:write', 'production:release',
    'quality:read', 'quality:write',
    'bom:read', 'bom:write',
    'analytics:read',
    'reports:read',
  ],
  planner: [
    'parts:read', 'parts:write',
    'inventory:read', 'inventory:write',
    'sales:read', 'sales:write',
    'production:read', 'production:write',
    'quality:read',
    'bom:read', 'bom:write',
    'analytics:read',
    'reports:read',
  ],
  operator: [
    'parts:read',
    'inventory:read', 'inventory:write',
    'sales:read',
    'production:read', 'production:update',
    'quality:read', 'quality:write',
    'bom:read',
  ],
  viewer: [
    'parts:read',
    'inventory:read',
    'sales:read',
    'production:read',
    'quality:read',
    'bom:read',
    'analytics:read',
  ],
  user: [
    'parts:read',
    'inventory:read',
    'production:read',
  ],
};

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

/**
 * Get authenticated user from session
 */
export async function getAuthUser(request?: NextRequest): Promise<AuthResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized - Please login',
        status: 401,
      };
    }

    const sessionUser = session.user as { id?: string; email?: string; name?: string; role?: string; department?: string };
    const user: AuthUser = {
      id: sessionUser.id || sessionUser.email || '',
      email: sessionUser.email || '',
      name: sessionUser.name || '',
      role: (sessionUser.role as UserRole) || 'viewer',
      department: sessionUser.department,
      permissions: ROLE_PERMISSIONS[(sessionUser.role as UserRole) || 'viewer'],
    };

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
    };
  }
}

/**
 * Check if user has required permission
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Admin has all permissions
  if (user.permissions.includes('*')) {
    return true;
  }

  // Check exact permission
  if (user.permissions.includes(permission)) {
    return true;
  }

  // Check wildcard (e.g., 'parts:*' covers 'parts:read')
  const [resource] = permission.split(':');
  if (user.permissions.includes(`${resource}:*`)) {
    return true;
  }

  return false;
}

/**
 * Check if user has required role level
 */
export function hasRole(user: AuthUser, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check resource ownership
 */
export function isOwner(user: AuthUser, resourceOwnerId: string): boolean {
  return user.id === resourceOwnerId || hasRole(user, 'admin');
}

// =============================================================================
// MIDDLEWARE HELPERS
// =============================================================================

/**
 * Require authentication
 */
export async function requireAuth(): Promise<AuthResult> {
  return getAuthUser();
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string): Promise<AuthResult> {
  const auth = await getAuthUser();

  if (!auth.success || !auth.user) {
    return auth;
  }

  if (!hasPermission(auth.user, permission)) {
    return {
      success: false,
      error: `Forbidden - Missing permission: ${permission}`,
      status: 403,
    };
  }

  return auth;
}

/**
 * Require specific role
 */
export async function requireRole(role: UserRole): Promise<AuthResult> {
  const auth = await getAuthUser();

  if (!auth.success || !auth.user) {
    return auth;
  }

  if (!hasRole(auth.user, role)) {
    return {
      success: false,
      error: `Forbidden - Required role: ${role}`,
      status: 403,
    };
  }

  return auth;
}

/**
 * Require ownership or admin
 */
export async function requireOwnership(resourceOwnerId: string): Promise<AuthResult> {
  const auth = await getAuthUser();

  if (!auth.success || !auth.user) {
    return auth;
  }

  if (!isOwner(auth.user, resourceOwnerId)) {
    return {
      success: false,
      error: 'Forbidden - Not authorized for this resource',
      status: 403,
    };
  }

  return auth;
}

// =============================================================================
// API ROUTE WRAPPER
// =============================================================================

type ApiHandler<P = Record<string, string | string[]>> = (
  request: NextRequest,
  context: { params: P; user: AuthUser }
) => Promise<Response>;

interface ProtectedRouteOptions {
  permission?: string;
  role?: UserRole;
  allowPublic?: boolean;
}

/**
 * Wrap API route with authentication
 */
export function withAuth<P = Record<string, string | string[]>>(
  handler: ApiHandler<P>,
  options: ProtectedRouteOptions = {}
) {
  return async (request: NextRequest, context: { params: P }) => {
    // Allow public access if specified
    if (options.allowPublic) {
      const auth = await getAuthUser();
      const user = auth.user || {
        id: 'anonymous',
        email: '',
        name: 'Anonymous',
        role: 'viewer' as UserRole,
        permissions: ['read'],
      };
      return handler(request, { ...context, user });
    }

    // Check permission if specified
    if (options.permission) {
      const auth = await requirePermission(options.permission);
      if (!auth.success || !auth.user) {
        return NextResponse.json(
          { success: false, error: auth.error },
          { status: auth.status || 401 }
        );
      }
      return handler(request, { ...context, user: auth.user });
    }

    // Check role if specified
    if (options.role) {
      const auth = await requireRole(options.role);
      if (!auth.success || !auth.user) {
        return NextResponse.json(
          { success: false, error: auth.error },
          { status: auth.status || 401 }
        );
      }
      return handler(request, { ...context, user: auth.user });
    }

    // Default: just require authentication
    const auth = await requireAuth();
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status || 401 }
      );
    }

    return handler(request, { ...context, user: auth.user });
  };
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

export function notFoundResponse(message = 'Not found') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  );
}
