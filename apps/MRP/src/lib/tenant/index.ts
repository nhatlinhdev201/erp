// =============================================================================
// L-ERP MRP - TENANT MODULE
// Multi-tenancy utilities
// =============================================================================

export * from './middleware';
export * from './prisma-tenant';

// Re-export commonly used items
export { withTenant, getTenantContext, hasFeature, checkLimit } from './middleware';
export { createTenantPrisma, getTenantPrisma } from './prisma-tenant';
export type { TenantContext, TenantInfo, AuthenticatedTenantContext } from './middleware';
export type { TenantPrismaClient } from './prisma-tenant';
