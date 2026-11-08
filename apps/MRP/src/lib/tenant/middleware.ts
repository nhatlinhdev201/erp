// =============================================================================
// L-ERP MRP - TENANT CONTEXT & MIDDLEWARE
// Automatic tenant isolation for multi-tenancy
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createTenantPrisma, TenantPrismaClient } from './prisma-tenant';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface TenantInfo {
  id: string;
  code: string;
  name: string;
  plan: string;
  status: string;
  features: Record<string, boolean>;
  limits: {
    maxUsers: number;
    maxStorage: number;
    maxApiCalls: number;
    maxParts: number;
    maxOrders: number;
  };
  usage: {
    currentUsers: number;
    currentStorage: number;
    currentParts: number;
  };
}

export interface TenantContext {
  tenantId: string;
  tenant: TenantInfo;
  prisma: TenantPrismaClient;
}

export interface AuthenticatedTenantContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
  tenant: TenantInfo;
  tenantId: string;
  prisma: TenantPrismaClient;
}

// =============================================================================
// TENANT CONTEXT FUNCTIONS
// =============================================================================

/**
 * Get tenant context from session
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    const tenantId = (session.user as { tenantId?: string }).tenantId;

    if (!tenantId) {
      logger.warn('[TENANT] User has no tenantId', { context: 'tenant-middleware', email: session.user.email });
      return null;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        plan: true,
        status: true,
        features: true,
        maxUsers: true,
        maxStorage: true,
        maxApiCalls: true,
        maxParts: true,
        maxOrders: true,
        currentUsers: true,
        currentStorage: true,
        currentParts: true,
      },
    });

    if (!tenant) {
      logger.warn('[TENANT] Tenant not found', { context: 'tenant-middleware', tenantId });
      return null;
    }

    if (tenant.status !== 'ACTIVE') {
      logger.warn('[TENANT] Tenant not active', { context: 'tenant-middleware', tenantId, status: tenant.status });
      return null;
    }

    const tenantInfo: TenantInfo = {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      features: (tenant.features as Record<string, boolean>) || {},
      limits: {
        maxUsers: tenant.maxUsers,
        maxStorage: Number(tenant.maxStorage),
        maxApiCalls: tenant.maxApiCalls,
        maxParts: tenant.maxParts,
        maxOrders: tenant.maxOrders,
      },
      usage: {
        currentUsers: tenant.currentUsers,
        currentStorage: Number(tenant.currentStorage),
        currentParts: tenant.currentParts,
      },
    };

    return {
      tenantId,
      tenant: tenantInfo,
      prisma: createTenantPrisma(tenantId),
    };
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'tenant-middleware', operation: 'getTenantContext' });
    return null;
  }
}

/**
 * Get tenant by domain (for custom domains)
 */
export async function getTenantByDomain(domain: string): Promise<TenantInfo | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain },
          { slug: domain.split('.')[0] },
        ],
        status: 'ACTIVE',
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      features: (tenant.features as Record<string, boolean>) || {},
      limits: {
        maxUsers: tenant.maxUsers,
        maxStorage: Number(tenant.maxStorage),
        maxApiCalls: tenant.maxApiCalls,
        maxParts: tenant.maxParts,
        maxOrders: tenant.maxOrders,
      },
      usage: {
        currentUsers: tenant.currentUsers,
        currentStorage: Number(tenant.currentStorage),
        currentParts: tenant.currentParts,
      },
    };
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'tenant-middleware', operation: 'getTenantByDomain' });
    return null;
  }
}

// =============================================================================
// FEATURE CHECKS
// =============================================================================

/**
 * Check if tenant has feature enabled
 */
export function hasFeature(tenant: TenantInfo, feature: string): boolean {
  if (tenant.plan === 'ENTERPRISE') {
    return true;
  }

  const professionalFeatures = [
    'mrp', 'quality', 'oee', 'maintenance', 'workforce',
    'reports', 'analytics', 'api', 'webhooks', 'mobile',
  ];

  if (tenant.plan === 'PROFESSIONAL' && professionalFeatures.includes(feature)) {
    return true;
  }

  const starterFeatures = [
    'inventory', 'sales', 'purchasing', 'production',
    'parts', 'bom', 'reports', 'mobile',
  ];

  if (tenant.plan === 'STARTER' && starterFeatures.includes(feature)) {
    return true;
  }

  return tenant.features[feature] === true;
}

/**
 * Check if tenant is within limits
 */
export function checkLimit(
  tenant: TenantInfo,
  limitType: 'users' | 'storage' | 'parts' | 'apiCalls'
): { allowed: boolean; current: number; max: number; remaining: number } {
  let current = 0;
  let max = 0;

  switch (limitType) {
    case 'users':
      current = tenant.usage.currentUsers;
      max = tenant.limits.maxUsers;
      break;
    case 'storage':
      current = tenant.usage.currentStorage;
      max = tenant.limits.maxStorage;
      break;
    case 'parts':
      current = tenant.usage.currentParts;
      max = tenant.limits.maxParts;
      break;
    case 'apiCalls':
      current = 0;
      max = tenant.limits.maxApiCalls;
      break;
  }

  const remaining = Math.max(0, max - current);

  return {
    allowed: current < max,
    current,
    max,
    remaining,
  };
}

// =============================================================================
// API ROUTE MIDDLEWARE
// =============================================================================

type TenantApiHandler = (
  request: NextRequest,
  context: AuthenticatedTenantContext
) => Promise<NextResponse>;

interface TenantRouteOptions {
  permission?: string;
  role?: string;
  feature?: string;
  allowPublic?: boolean;
}

// Helper function to get permissions for role
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: ['*'],
    manager: [
      'parts:read', 'parts:write', 'parts:delete',
      'inventory:read', 'inventory:write', 'inventory:adjust',
      'sales:read', 'sales:write', 'sales:approve',
      'production:read', 'production:write', 'production:release',
      'quality:read', 'quality:write', 'quality:close',
      'mrp:read', 'mrp:run', 'mrp:approve',
      'reports:read', 'reports:export',
      'analytics:read',
    ],
    supervisor: [
      'parts:read', 'parts:write',
      'inventory:read', 'inventory:write',
      'sales:read', 'sales:write',
      'production:read', 'production:write',
      'quality:read', 'quality:write',
      'mrp:read',
      'reports:read',
    ],
    planner: [
      'parts:read',
      'inventory:read',
      'sales:read',
      'production:read', 'production:write',
      'mrp:read', 'mrp:run',
      'reports:read',
    ],
    operator: [
      'parts:read',
      'inventory:read', 'inventory:write',
      'production:read', 'production:update',
      'quality:read', 'quality:write',
    ],
    viewer: [
      'parts:read',
      'inventory:read',
      'sales:read',
      'production:read',
      'quality:read',
      'reports:read',
    ],
  };

  return rolePermissions[role] || rolePermissions.viewer;
}

/**
 * Wrap API route with tenant context
 */
export function withTenant(
  handler: TenantApiHandler,
  options: TenantRouteOptions = {}
) {
  return async (request: NextRequest) => {
    try {
      const session = await auth();

      // Allow public access if specified
      if (options.allowPublic && !session?.user) {
        const tenantCode = request.headers.get('x-tenant-code');
        if (!tenantCode) {
          return NextResponse.json(
            { success: false, error: 'Tenant context required' },
            { status: 400 }
          );
        }

        const tenant = await prisma.tenant.findUnique({
          where: { code: tenantCode },
        });

        if (!tenant || tenant.status !== 'ACTIVE') {
          return NextResponse.json(
            { success: false, error: 'Invalid tenant' },
            { status: 400 }
          );
        }

        const context: AuthenticatedTenantContext = {
          user: {
            id: 'anonymous',
            email: '',
            name: 'Anonymous',
            role: 'viewer',
            permissions: [],
          },
          tenant: {
            id: tenant.id,
            code: tenant.code,
            name: tenant.name,
            plan: tenant.plan,
            status: tenant.status,
            features: (tenant.features as Record<string, boolean>) || {},
            limits: {
              maxUsers: tenant.maxUsers,
              maxStorage: Number(tenant.maxStorage),
              maxApiCalls: tenant.maxApiCalls,
              maxParts: tenant.maxParts,
              maxOrders: tenant.maxOrders,
            },
            usage: {
              currentUsers: tenant.currentUsers,
              currentStorage: Number(tenant.currentStorage),
              currentParts: tenant.currentParts,
            },
          },
          tenantId: tenant.id,
          prisma: createTenantPrisma(tenant.id),
        };

        return handler(request, context);
      }

      // Require authentication
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please login.' },
          { status: 401 }
        );
      }

      // Get tenant context
      const tenantContext = await getTenantContext();

      if (!tenantContext) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found or inactive' },
          { status: 403 }
        );
      }

      // Check feature access
      if (options.feature && !hasFeature(tenantContext.tenant, options.feature)) {
        return NextResponse.json(
          {
            success: false,
            error: `This feature (${options.feature}) is not available in your plan. Please upgrade.`
          },
          { status: 403 }
        );
      }

      // Check permission
      const userRole = (session.user as { role?: string }).role || 'viewer';
      const userPermissions = getPermissionsForRole(userRole);

      if (options.permission && !userPermissions.includes(options.permission) && !userPermissions.includes('*')) {
        return NextResponse.json(
          { success: false, error: `Missing permission: ${options.permission}` },
          { status: 403 }
        );
      }

      // Check role
      if (options.role) {
        const roleHierarchy: Record<string, number> = {
          admin: 100,
          manager: 80,
          supervisor: 60,
          planner: 50,
          operator: 40,
          viewer: 20,
        };

        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[options.role] || 100;

        if (userLevel < requiredLevel) {
          return NextResponse.json(
            { success: false, error: `Required role: ${options.role}` },
            { status: 403 }
          );
        }
      }

      // Build context
      const context: AuthenticatedTenantContext = {
        user: {
          id: (session.user as { id?: string }).id || '',
          email: session.user.email || '',
          name: session.user.name || '',
          role: userRole,
          permissions: userPermissions,
        },
        tenant: tenantContext.tenant,
        tenantId: tenantContext.tenantId,
        prisma: tenantContext.prisma,
      };

      return handler(request, context);

    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'tenant-middleware', operation: 'withTenant' });
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export default withTenant;
