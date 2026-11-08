/**
 * L-ERP HRM - RBAC (Role-Based Access Control) Utilities
 * Standardized permission checking for API routes
 * 
 * @module lib/security/rbac
 */

import { ApiError, ErrorCode } from '@/lib/errors/api-error'

/**
 * User roles in the system (from most to least privileged)
 */
export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    HR_MANAGER = 'HR_MANAGER',
    HR_STAFF = 'HR_STAFF',
    MANAGER = 'MANAGER',
    HR = 'HR',
    EMPLOYEE = 'EMPLOYEE',
}

/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 100,
    [Role.ADMIN]: 90,
    [Role.HR_MANAGER]: 80,
    [Role.HR_STAFF]: 70,
    [Role.HR]: 60,
    [Role.MANAGER]: 50,
    [Role.EMPLOYEE]: 10,
}

/**
 * Permission definitions by resource and action
 */
export type Resource =
    | 'employees'
    | 'departments'
    | 'positions'
    | 'attendance'
    | 'payroll'
    | 'leave'
    | 'overtime'
    | 'contracts'
    | 'reports'
    | 'settings'
    | 'users'
    | 'audit'
    | 'ai'

export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export'

/**
 * Permission matrix: resource -> action -> allowed roles
 */
const PERMISSIONS: Record<Resource, Partial<Record<Action, Role[]>>> = {
    employees: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        delete: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        export: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
    },
    departments: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER, Role.EMPLOYEE],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        delete: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    positions: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER, Role.EMPLOYEE],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        delete: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    attendance: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        delete: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        export: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
    },
    payroll: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        delete: [Role.SUPER_ADMIN, Role.ADMIN],
        approve: [Role.SUPER_ADMIN, Role.ADMIN],
        export: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
    },
    leave: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER, Role.EMPLOYEE],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER, Role.EMPLOYEE],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        delete: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        approve: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER],
    },
    overtime: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.MANAGER],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        delete: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        approve: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER],
    },
    contracts: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF],
        create: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        update: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
        delete: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    reports: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER],
        export: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER],
    },
    settings: {
        read: [Role.SUPER_ADMIN, Role.ADMIN],
        update: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    users: {
        read: [Role.SUPER_ADMIN, Role.ADMIN],
        create: [Role.SUPER_ADMIN, Role.ADMIN],
        update: [Role.SUPER_ADMIN, Role.ADMIN],
        delete: [Role.SUPER_ADMIN],
    },
    audit: {
        read: [Role.SUPER_ADMIN, Role.ADMIN],
        export: [Role.SUPER_ADMIN],
    },
    ai: {
        read: [Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.HR_STAFF, Role.HR, Role.MANAGER, Role.EMPLOYEE],
    },
}

/**
 * Check if a role has permission for a resource action
 */
export function hasPermission(
    userRole: string,
    resource: Resource,
    action: Action
): boolean {
    const allowedRoles = PERMISSIONS[resource]?.[action]

    if (!allowedRoles) {
        return false
    }

    return allowedRoles.includes(userRole as Role)
}

/**
 * Check if a role is at least the specified minimum role
 */
export function isAtLeastRole(userRole: string, minimumRole: Role): boolean {
    const userLevel = ROLE_HIERARCHY[userRole as Role] ?? 0
    const minimumLevel = ROLE_HIERARCHY[minimumRole]

    return userLevel >= minimumLevel
}

/**
 * Require permission or throw error
 */
export function requirePermission(
    userRole: string,
    resource: Resource,
    action: Action
): void {
    if (!hasPermission(userRole, resource, action)) {
        throw new ApiError(
            ErrorCode.FORBIDDEN,
            `Bạn không có quyền ${getActionLabel(action)} ${getResourceLabel(resource)}`
        )
    }
}

/**
 * Require minimum role or throw error
 */
export function requireRole(userRole: string, minimumRole: Role): void {
    if (!isAtLeastRole(userRole, minimumRole)) {
        throw new ApiError(
            ErrorCode.FORBIDDEN,
            'Bạn không có quyền thực hiện thao tác này'
        )
    }
}

/**
 * Check if user can access resource owned by another employee
 * Used for row-level security
 */
export function canAccessEmployeeData(
    userRole: string,
    userId: string,
    targetEmployeeId: string,
    userEmployeeId?: string | null
): boolean {
    // Admins and HR can access all employee data
    if (isAtLeastRole(userRole, Role.HR_STAFF)) {
        return true
    }

    // Employees can only access their own data
    if (userEmployeeId === targetEmployeeId) {
        return true
    }

    // Managers can access their direct reports (would need org chart lookup)
    // This is a simplified check - real implementation would query DB
    if (userRole === Role.MANAGER) {
        // TODO: Check if targetEmployeeId is a direct report of userId
        return false
    }

    return false
}

/**
 * Get Vietnamese label for action
 */
function getActionLabel(action: Action): string {
    const labels: Record<Action, string> = {
        read: 'xem',
        create: 'tạo',
        update: 'sửa',
        delete: 'xóa',
        approve: 'phê duyệt',
        export: 'xuất',
    }
    return labels[action]
}

/**
 * Get Vietnamese label for resource
 */
function getResourceLabel(resource: Resource): string {
    const labels: Record<Resource, string> = {
        employees: 'nhân viên',
        departments: 'phòng ban',
        positions: 'chức vụ',
        attendance: 'chấm công',
        payroll: 'bảng lương',
        leave: 'nghỉ phép',
        overtime: 'tăng ca',
        contracts: 'hợp đồng',
        reports: 'báo cáo',
        settings: 'cài đặt',
        users: 'người dùng',
        audit: 'nhật ký',
        ai: 'AI',
    }
    return labels[resource]
}

/**
 * Middleware-style permission checker for use in API handlers
 * 
 * @example
 * ```typescript
 * export const POST = withErrorHandler(async (request) => {
 *   const session = await auth()
 *   if (!session?.user) throw Errors.unauthorized()
 *   
 *   checkPermission(session.user.role, 'employees', 'create')
 *   
 *   // ... rest of handler
 * })
 * ```
 */
export const checkPermission = requirePermission

/**
 * HOF version for cleaner syntax with multiple permissions
 */
export function withPermission(
    resource: Resource,
    action: Action
) {
    return (userRole: string) => {
        requirePermission(userRole, resource, action)
    }
}
