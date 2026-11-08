/**
 * L-ERP HRM - RBAC Unit Tests
 * Tests for Role-Based Access Control utilities
 */

import { describe, it, expect } from 'vitest'
import {
    Role,
    hasPermission,
    isAtLeastRole,
    requirePermission,
    requireRole,
    canAccessEmployeeData,
} from '@/lib/security/rbac'
import { ApiError, ErrorCode } from '@/lib/errors/api-error'

// ============================================================
// hasPermission Tests
// ============================================================
describe('hasPermission', () => {
    describe('employees resource', () => {
        it('should allow SUPER_ADMIN to read employees', () => {
            expect(hasPermission(Role.SUPER_ADMIN, 'employees', 'read')).toBe(true)
        })

        it('should allow HR_STAFF to create employees', () => {
            expect(hasPermission(Role.HR_STAFF, 'employees', 'create')).toBe(true)
        })

        it('should NOT allow EMPLOYEE to create employees', () => {
            expect(hasPermission(Role.EMPLOYEE, 'employees', 'create')).toBe(false)
        })

        it('should allow MANAGER to read employees', () => {
            expect(hasPermission(Role.MANAGER, 'employees', 'read')).toBe(true)
        })

        it('should NOT allow MANAGER to delete employees', () => {
            expect(hasPermission(Role.MANAGER, 'employees', 'delete')).toBe(false)
        })
    })

    describe('payroll resource', () => {
        it('should allow ADMIN to read payroll', () => {
            expect(hasPermission(Role.ADMIN, 'payroll', 'read')).toBe(true)
        })

        it('should allow SUPER_ADMIN to approve payroll', () => {
            expect(hasPermission(Role.SUPER_ADMIN, 'payroll', 'approve')).toBe(true)
        })

        it('should NOT allow HR_STAFF to read payroll', () => {
            expect(hasPermission(Role.HR_STAFF, 'payroll', 'read')).toBe(false)
        })

        it('should NOT allow HR_MANAGER to approve payroll', () => {
            expect(hasPermission(Role.HR_MANAGER, 'payroll', 'approve')).toBe(false)
        })
    })

    describe('leave resource', () => {
        it('should allow EMPLOYEE to create leave request', () => {
            expect(hasPermission(Role.EMPLOYEE, 'leave', 'create')).toBe(true)
        })

        it('should allow MANAGER to approve leave', () => {
            expect(hasPermission(Role.MANAGER, 'leave', 'approve')).toBe(true)
        })

        it('should NOT allow EMPLOYEE to approve leave', () => {
            expect(hasPermission(Role.EMPLOYEE, 'leave', 'approve')).toBe(false)
        })
    })

    describe('settings resource', () => {
        it('should allow ADMIN to read settings', () => {
            expect(hasPermission(Role.ADMIN, 'settings', 'read')).toBe(true)
        })

        it('should NOT allow HR_MANAGER to read settings', () => {
            expect(hasPermission(Role.HR_MANAGER, 'settings', 'read')).toBe(false)
        })
    })

    describe('audit resource', () => {
        it('should allow SUPER_ADMIN to export audit', () => {
            expect(hasPermission(Role.SUPER_ADMIN, 'audit', 'export')).toBe(true)
        })

        it('should NOT allow ADMIN to export audit', () => {
            expect(hasPermission(Role.ADMIN, 'audit', 'export')).toBe(false)
        })
    })

    describe('unknown permissions', () => {
        it('should return false for non-existent action', () => {
            expect(hasPermission(Role.ADMIN, 'employees', 'approve')).toBe(false)
        })
    })
})

// ============================================================
// isAtLeastRole Tests
// ============================================================
describe('isAtLeastRole', () => {
    it('should return true for SUPER_ADMIN >= ADMIN', () => {
        expect(isAtLeastRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true)
    })

    it('should return true for ADMIN >= ADMIN', () => {
        expect(isAtLeastRole(Role.ADMIN, Role.ADMIN)).toBe(true)
    })

    it('should return false for MANAGER >= ADMIN', () => {
        expect(isAtLeastRole(Role.MANAGER, Role.ADMIN)).toBe(false)
    })

    it('should return true for HR_MANAGER >= HR_STAFF', () => {
        expect(isAtLeastRole(Role.HR_MANAGER, Role.HR_STAFF)).toBe(true)
    })

    it('should return false for EMPLOYEE >= MANAGER', () => {
        expect(isAtLeastRole(Role.EMPLOYEE, Role.MANAGER)).toBe(false)
    })

    it('should return true for SUPER_ADMIN >= EMPLOYEE', () => {
        expect(isAtLeastRole(Role.SUPER_ADMIN, Role.EMPLOYEE)).toBe(true)
    })

    it('should handle unknown roles gracefully', () => {
        expect(isAtLeastRole('UNKNOWN_ROLE', Role.EMPLOYEE)).toBe(false)
    })
})

// ============================================================
// requirePermission Tests
// ============================================================
describe('requirePermission', () => {
    it('should not throw for valid permission', () => {
        expect(() => {
            requirePermission(Role.ADMIN, 'employees', 'read')
        }).not.toThrow()
    })

    it('should throw ApiError for invalid permission', () => {
        expect(() => {
            requirePermission(Role.EMPLOYEE, 'employees', 'delete')
        }).toThrow(ApiError)
    })

    it('should throw FORBIDDEN error code', () => {
        try {
            requirePermission(Role.EMPLOYEE, 'payroll', 'read')
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError)
            expect((error as ApiError).code).toBe(ErrorCode.FORBIDDEN)
        }
    })

    it('should include Vietnamese error message', () => {
        try {
            requirePermission(Role.EMPLOYEE, 'employees', 'create')
        } catch (error) {
            expect((error as ApiError).message).toContain('tạo')
            expect((error as ApiError).message).toContain('nhân viên')
        }
    })
})

// ============================================================
// requireRole Tests
// ============================================================
describe('requireRole', () => {
    it('should not throw for sufficient role', () => {
        expect(() => {
            requireRole(Role.SUPER_ADMIN, Role.ADMIN)
        }).not.toThrow()
    })

    it('should throw for insufficient role', () => {
        expect(() => {
            requireRole(Role.EMPLOYEE, Role.ADMIN)
        }).toThrow(ApiError)
    })

    it('should not throw for exact role match', () => {
        expect(() => {
            requireRole(Role.HR_MANAGER, Role.HR_MANAGER)
        }).not.toThrow()
    })
})

// ============================================================
// canAccessEmployeeData Tests
// ============================================================
describe('canAccessEmployeeData', () => {
    it('should allow HR_STAFF to access any employee data', () => {
        expect(canAccessEmployeeData(
            Role.HR_STAFF,
            'user-1',
            'emp-2',
            'emp-1'
        )).toBe(true)
    })

    it('should allow employee to access their own data', () => {
        expect(canAccessEmployeeData(
            Role.EMPLOYEE,
            'user-1',
            'emp-1',
            'emp-1'
        )).toBe(true)
    })

    it('should NOT allow employee to access other employee data', () => {
        expect(canAccessEmployeeData(
            Role.EMPLOYEE,
            'user-1',
            'emp-2',
            'emp-1'
        )).toBe(false)
    })

    it('should allow ADMIN to access any employee data', () => {
        expect(canAccessEmployeeData(
            Role.ADMIN,
            'admin-1',
            'emp-999',
            null
        )).toBe(true)
    })
})

// ============================================================
// Role Enum Tests
// ============================================================
describe('Role Enum', () => {
    it('should have all expected roles', () => {
        expect(Role.SUPER_ADMIN).toBe('SUPER_ADMIN')
        expect(Role.ADMIN).toBe('ADMIN')
        expect(Role.HR_MANAGER).toBe('HR_MANAGER')
        expect(Role.HR_STAFF).toBe('HR_STAFF')
        expect(Role.MANAGER).toBe('MANAGER')
        expect(Role.HR).toBe('HR')
        expect(Role.EMPLOYEE).toBe('EMPLOYEE')
    })

    it('should have 7 roles total', () => {
        const roleCount = Object.keys(Role).length
        expect(roleCount).toBe(7)
    })
})
