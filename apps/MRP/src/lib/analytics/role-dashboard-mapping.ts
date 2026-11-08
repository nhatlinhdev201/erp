// =============================================================================
// L-ERP MRP - ROLE DASHBOARD MAPPING
// Maps user roles to their default dashboards and permissions
// =============================================================================

import type { UserRole } from '@/lib/roles';

export interface RoleDashboardConfig {
  defaultTemplate: string;
  allowedTemplates: string[];
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
    canViewAll: boolean;
  };
  maxDashboards: number;
  features: {
    canCustomizeWidgets: boolean;
    canExportData: boolean;
    canScheduleReports: boolean;
    canAccessRawData: boolean;
  };
}

export const ROLE_DASHBOARD_MAPPING: Record<UserRole, RoleDashboardConfig> = {
  admin: {
    defaultTemplate: 'template-executive-default',
    allowedTemplates: [
      'template-executive-default',
      'template-operations-default',
      'template-quality-default',
    ],
    permissions: {
      canCreate: true,
      canEdit: true,
      canShare: true,
      canDelete: true,
      canViewAll: true,
    },
    maxDashboards: -1, // Unlimited
    features: {
      canCustomizeWidgets: true,
      canExportData: true,
      canScheduleReports: true,
      canAccessRawData: true,
    },
  },

  manager: {
    defaultTemplate: 'template-executive-default',
    allowedTemplates: [
      'template-executive-default',
      'template-operations-default',
      'template-quality-default',
    ],
    permissions: {
      canCreate: true,
      canEdit: true,
      canShare: true,
      canDelete: true,
      canViewAll: true,
    },
    maxDashboards: 20,
    features: {
      canCustomizeWidgets: true,
      canExportData: true,
      canScheduleReports: true,
      canAccessRawData: true,
    },
  },

  supervisor: {
    defaultTemplate: 'template-operations-default',
    allowedTemplates: [
      'template-operations-default',
      'template-quality-default',
    ],
    permissions: {
      canCreate: true,
      canEdit: true,
      canShare: true,
      canDelete: false,
      canViewAll: false,
    },
    maxDashboards: 10,
    features: {
      canCustomizeWidgets: true,
      canExportData: true,
      canScheduleReports: false,
      canAccessRawData: false,
    },
  },

  planner: {
    defaultTemplate: 'template-operations-default',
    allowedTemplates: [
      'template-operations-default',
    ],
    permissions: {
      canCreate: true,
      canEdit: true,
      canShare: false,
      canDelete: false,
      canViewAll: false,
    },
    maxDashboards: 5,
    features: {
      canCustomizeWidgets: true,
      canExportData: true,
      canScheduleReports: false,
      canAccessRawData: false,
    },
  },

  operator: {
    defaultTemplate: 'template-operations-default',
    allowedTemplates: [
      'template-operations-default',
    ],
    permissions: {
      canCreate: false,
      canEdit: false,
      canShare: false,
      canDelete: false,
      canViewAll: false,
    },
    maxDashboards: 1,
    features: {
      canCustomizeWidgets: false,
      canExportData: false,
      canScheduleReports: false,
      canAccessRawData: false,
    },
  },

  quality: {
    defaultTemplate: 'template-quality-default',
    allowedTemplates: [
      'template-quality-default',
      'template-operations-default',
    ],
    permissions: {
      canCreate: true,
      canEdit: true,
      canShare: false,
      canDelete: false,
      canViewAll: false,
    },
    maxDashboards: 5,
    features: {
      canCustomizeWidgets: true,
      canExportData: true,
      canScheduleReports: false,
      canAccessRawData: false,
    },
  },

  viewer: {
    defaultTemplate: 'template-executive-default',
    allowedTemplates: [
      'template-executive-default',
    ],
    permissions: {
      canCreate: false,
      canEdit: false,
      canShare: false,
      canDelete: false,
      canViewAll: true,
    },
    maxDashboards: 0,
    features: {
      canCustomizeWidgets: false,
      canExportData: false,
      canScheduleReports: false,
      canAccessRawData: false,
    },
  },

  user: {
    defaultTemplate: 'template-operations-default',
    allowedTemplates: [
      'template-operations-default',
    ],
    permissions: {
      canCreate: false,
      canEdit: false,
      canShare: false,
      canDelete: false,
      canViewAll: false,
    },
    maxDashboards: 0,
    features: {
      canCustomizeWidgets: false,
      canExportData: false,
      canScheduleReports: false,
      canAccessRawData: false,
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the dashboard configuration for a specific role
 */
export function getRoleDashboardConfig(role: UserRole): RoleDashboardConfig {
  return ROLE_DASHBOARD_MAPPING[role] || ROLE_DASHBOARD_MAPPING.user;
}

/**
 * Check if a role can access a specific template
 */
export function canAccessTemplate(role: UserRole, templateId: string): boolean {
  const config = getRoleDashboardConfig(role);
  return config.allowedTemplates.includes(templateId);
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: UserRole,
  permission: keyof RoleDashboardConfig['permissions']
): boolean {
  const config = getRoleDashboardConfig(role);
  return config.permissions[permission];
}

/**
 * Check if a role has a specific feature
 */
export function hasFeature(
  role: UserRole,
  feature: keyof RoleDashboardConfig['features']
): boolean {
  const config = getRoleDashboardConfig(role);
  return config.features[feature];
}

/**
 * Get the default template ID for a role
 */
export function getDefaultTemplateForRole(role: UserRole): string {
  const config = getRoleDashboardConfig(role);
  return config.defaultTemplate;
}

/**
 * Get the list of allowed templates for a role
 */
export function getAllowedTemplatesForRole(role: UserRole): string[] {
  const config = getRoleDashboardConfig(role);
  return config.allowedTemplates;
}

/**
 * Check if a user can create more dashboards
 */
export function canCreateMoreDashboards(
  role: UserRole,
  currentCount: number
): boolean {
  const config = getRoleDashboardConfig(role);
  if (config.maxDashboards === -1) return true; // Unlimited
  return currentCount < config.maxDashboards;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): RoleDashboardConfig['permissions'] {
  const config = getRoleDashboardConfig(role);
  return config.permissions;
}

/**
 * Get all features for a role
 */
export function getRoleFeatures(role: UserRole): RoleDashboardConfig['features'] {
  const config = getRoleDashboardConfig(role);
  return config.features;
}

// =============================================================================
// TEMPLATE CATEGORY MAPPING
// =============================================================================

export const TEMPLATE_CATEGORIES = {
  executive: {
    name: 'Executive',
    nameVi: 'Điều hành',
    description: 'High-level KPIs for management',
    descriptionVi: 'KPI tổng quan cho quản lý',
    minRole: 'viewer' as UserRole,
  },
  operations: {
    name: 'Operations',
    nameVi: 'Vận hành',
    description: 'Production and operations metrics',
    descriptionVi: 'Chỉ số sản xuất và vận hành',
    minRole: 'operator' as UserRole,
  },
  quality: {
    name: 'Quality',
    nameVi: 'Chất lượng',
    description: 'Quality metrics and NCR/CAPA tracking',
    descriptionVi: 'Chỉ số chất lượng và theo dõi NCR/CAPA',
    minRole: 'quality' as UserRole,
  },
} as const;

export type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES;
