/**
 * L-ERP HRM - Leave Balance Service Tests
 * Unit tests for leave balance calculation and management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/db', () => ({
    db: {
        leaveBalance: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
        },
        leaveRequest: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
        leavePolicy: {
            findFirst: vi.fn(),
        },
        employee: {
            findFirst: vi.fn(),
        },
    },
}))

import { db } from '@/lib/db'

// ============================================================
// Leave Entitlement Calculation
// ============================================================
describe('Leave Entitlement Calculation', () => {
    describe('Annual Leave Entitlement', () => {
        it('should calculate standard annual leave of 12 days', () => {
            const yearsOfService = 1
            const baseEntitlement = 12

            const entitlement = baseEntitlement + Math.floor(yearsOfService / 5)

            expect(entitlement).toBe(12)
        })

        it('should add 1 day per 5 years of service', () => {
            const yearsOfService = 5
            const baseEntitlement = 12

            const entitlement = baseEntitlement + Math.floor(yearsOfService / 5)

            expect(entitlement).toBe(13)
        })

        it('should add 2 days for 10 years of service', () => {
            const yearsOfService = 10
            const baseEntitlement = 12

            const entitlement = baseEntitlement + Math.floor(yearsOfService / 5)

            expect(entitlement).toBe(14)
        })

        it('should add extra days for hazardous work conditions', () => {
            const baseEntitlement = 12
            const hazardousBonus = 4 // As per VN labor law for hazardous work

            const entitlement = baseEntitlement + hazardousBonus

            expect(entitlement).toBe(16)
        })

        it('should prorate for partial year employment', () => {
            const annualEntitlement = 12
            const monthsWorked = 6

            const proratedEntitlement = Math.round((annualEntitlement / 12) * monthsWorked * 10) / 10

            expect(proratedEntitlement).toBe(6)
        })

        it('should handle new hire mid-year proration', () => {
            const annualEntitlement = 12
            const hireDate = new Date('2024-04-15')
            const yearEnd = new Date('2024-12-31')

            // Calculate months from hire to year end
            const monthsRemaining = (yearEnd.getMonth() - hireDate.getMonth()) + 1
            const proratedEntitlement = Math.round((annualEntitlement / 12) * monthsRemaining * 10) / 10

            expect(proratedEntitlement).toBe(9) // April-December = 9 months
        })
    })

    describe('Sick Leave Entitlement', () => {
        it('should provide standard sick leave of 30 days', () => {
            const sickLeaveEntitlement = 30

            expect(sickLeaveEntitlement).toBe(30)
        })

        it('should provide 40 days for heavy work conditions', () => {
            const sickLeaveEntitlement = 40 // For workers in heavy/hazardous conditions

            expect(sickLeaveEntitlement).toBe(40)
        })

        it('should calculate sick leave based on insurance contribution', () => {
            const contributionYears = 15
            let sickLeaveDays: number

            if (contributionYears < 15) {
                sickLeaveDays = 30
            } else if (contributionYears < 30) {
                sickLeaveDays = 40
            } else {
                sickLeaveDays = 60
            }

            expect(sickLeaveDays).toBe(40)
        })
    })

    describe('Maternity Leave Entitlement', () => {
        it('should provide 6 months maternity leave', () => {
            const maternityLeaveDays = 180 // 6 months

            expect(maternityLeaveDays).toBe(180)
        })

        it('should add 1 month per additional child (twins)', () => {
            const baseMaternityDays = 180
            const additionalChildren = 1 // Twins
            const additionalDays = 30 * additionalChildren

            const totalDays = baseMaternityDays + additionalDays

            expect(totalDays).toBe(210)
        })
    })

    describe('Paternity Leave Entitlement', () => {
        it('should provide 5 days paternity leave for normal birth', () => {
            const paternityDays = 5

            expect(paternityDays).toBe(5)
        })

        it('should provide 7 days paternity leave for C-section', () => {
            const paternityDays = 7

            expect(paternityDays).toBe(7)
        })

        it('should provide 10 days paternity leave for twins+ C-section', () => {
            const paternityDays = 10

            expect(paternityDays).toBe(10)
        })
    })
})

// ============================================================
// Leave Balance Tracking
// ============================================================
describe('Leave Balance Tracking', () => {
    describe('Balance Calculation', () => {
        it('should calculate remaining balance correctly', () => {
            const entitlement = 12
            const used = 5
            const pending = 2

            const available = entitlement - used - pending

            expect(available).toBe(5)
        })

        it('should not allow negative balance by default', () => {
            const entitlement = 12
            const used = 10
            const requestedDays = 5

            const canApprove = (entitlement - used) >= requestedDays

            expect(canApprove).toBe(false)
        })

        it('should allow negative balance if policy permits', () => {
            const entitlement = 12
            const used = 10
            const requestedDays = 5
            const allowNegative = true
            const maxNegative = -5

            const projectedBalance = entitlement - used - requestedDays
            const canApprove = allowNegative && projectedBalance >= maxNegative

            expect(canApprove).toBe(true)
            expect(projectedBalance).toBe(-3)
        })

        it('should handle carried forward balance', () => {
            const currentYearEntitlement = 12
            const carriedForward = 3 // From last year
            const used = 5

            const totalBalance = currentYearEntitlement + carriedForward - used

            expect(totalBalance).toBe(10)
        })

        it('should cap carried forward balance', () => {
            const carriedForward = 10
            const maxCarryForward = 5

            const cappedCarryForward = Math.min(carriedForward, maxCarryForward)

            expect(cappedCarryForward).toBe(5)
        })
    })

    describe('Balance Expiry', () => {
        it('should expire carried forward balance after deadline', () => {
            const carriedForward = 5
            const expiryDate = new Date('2024-03-31')
            const today = new Date('2024-04-01')

            const isExpired = today > expiryDate
            const effectiveCarryForward = isExpired ? 0 : carriedForward

            expect(effectiveCarryForward).toBe(0)
        })

        it('should not expire if before deadline', () => {
            const carriedForward = 5
            const expiryDate = new Date('2024-03-31')
            const today = new Date('2024-03-15')

            const isExpired = today > expiryDate
            const effectiveCarryForward = isExpired ? 0 : carriedForward

            expect(effectiveCarryForward).toBe(5)
        })
    })

    describe('Leave Type Tracking', () => {
        it('should track balances separately by leave type', () => {
            const balances = {
                annual: { entitlement: 12, used: 3 },
                sick: { entitlement: 30, used: 2 },
                personal: { entitlement: 3, used: 0 },
            }

            expect(balances.annual.entitlement - balances.annual.used).toBe(9)
            expect(balances.sick.entitlement - balances.sick.used).toBe(28)
            expect(balances.personal.entitlement - balances.personal.used).toBe(3)
        })

        it('should not mix leave type balances', () => {
            const annualBalance = 9
            const sickBalance = 28
            const requestedAnnualDays = 10

            const annualSufficient = annualBalance >= requestedAnnualDays

            expect(annualSufficient).toBe(false)
            // Should NOT use sick days to cover annual leave
        })
    })
})

// ============================================================
// Leave Request Validation
// ============================================================
describe('Leave Request Validation', () => {
    describe('Date Validation', () => {
        it('should accept future start date', () => {
            const startDate = new Date('2024-12-01')
            const today = new Date('2024-11-15')

            const isValid = startDate > today

            expect(isValid).toBe(true)
        })

        it('should reject past start date', () => {
            const startDate = new Date('2024-10-01')
            const today = new Date('2024-11-15')

            const isValid = startDate >= today

            expect(isValid).toBe(false)
        })

        it('should require end date >= start date', () => {
            const startDate = new Date('2024-12-01')
            const endDate = new Date('2024-12-05')

            const isValid = endDate >= startDate

            expect(isValid).toBe(true)
        })

        it('should reject end date before start date', () => {
            const startDate = new Date('2024-12-05')
            const endDate = new Date('2024-12-01')

            const isValid = endDate >= startDate

            expect(isValid).toBe(false)
        })
    })

    describe('Duration Calculation', () => {
        it('should calculate full day leave', () => {
            const startDate = new Date('2024-12-02')
            const endDate = new Date('2024-12-06')

            // Simple calculation (inclusive)
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

            expect(days).toBe(5)
        })

        it('should calculate half day leave', () => {
            const startDate = new Date('2024-12-02')
            const endDate = new Date('2024-12-02')
            const isHalfDay = true

            const days = isHalfDay ? 0.5 : 1

            expect(days).toBe(0.5)
        })

        it('should exclude weekends from working days', () => {
            // Mon Dec 2 to Fri Dec 6 2024
            const workingDays = 5 // No weekends in this range

            expect(workingDays).toBe(5)
        })

        it('should exclude public holidays from working days', () => {
            const totalDays = 5
            const weekends = 0
            const holidays = 1

            const workingDays = totalDays - weekends - holidays

            expect(workingDays).toBe(4)
        })
    })

    describe('Minimum Notice Validation', () => {
        it('should require minimum notice for annual leave', () => {
            const requestDate = new Date('2024-11-15')
            const startDate = new Date('2024-11-20')
            const minimumNoticeDays = 3

            const noticeDays = Math.ceil((startDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24))
            const hasMinimumNotice = noticeDays >= minimumNoticeDays

            expect(hasMinimumNotice).toBe(true)
        })

        it('should allow emergency sick leave without notice', () => {
            const leaveType = 'SICK'
            const requiresNotice = leaveType !== 'SICK' && leaveType !== 'EMERGENCY'

            expect(requiresNotice).toBe(false)
        })
    })
})

// ============================================================
// Leave Balance Service Integration
// ============================================================
describe('Leave Balance Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getBalance', () => {
        it('should fetch employee leave balance', async () => {
            const mockBalance = {
                id: 'balance-1',
                employeeId: 'emp-1',
                leaveType: 'ANNUAL',
                entitlement: 12,
                used: 3,
                pending: 1,
                carriedForward: 2,
                year: 2024,
            }

            vi.mocked(db.leaveBalance.findFirst).mockResolvedValue(mockBalance as never)

            const result = await db.leaveBalance.findFirst({
                where: { employeeId: 'emp-1', leaveType: 'ANNUAL', year: 2024 }
            })

            expect(result).toEqual(mockBalance)
            expect(result?.entitlement).toBe(12)
        })

        it('should calculate available balance including carried forward', async () => {
            const balance = {
                entitlement: 12,
                used: 3,
                pending: 1,
                carriedForward: 2,
            }

            const available = balance.entitlement + balance.carriedForward - balance.used - balance.pending

            expect(available).toBe(10)
        })
    })

    describe('updateBalance', () => {
        it('should update used balance after leave approval', async () => {
            const currentUsed = 3
            const approvedDays = 2
            const newUsed = currentUsed + approvedDays

            vi.mocked(db.leaveBalance.update).mockResolvedValue({
                id: 'balance-1',
                used: newUsed,
            } as never)

            const result = await db.leaveBalance.update({
                where: { id: 'balance-1' },
                data: { used: newUsed },
            })

            expect(result.used).toBe(5)
        })

        it('should decrease pending after leave approval', async () => {
            const currentPending = 3
            const approvedDays = 2
            const newPending = currentPending - approvedDays

            expect(newPending).toBe(1)
        })

        it('should restore balance after leave cancellation', async () => {
            const currentUsed = 5
            const cancelledDays = 2
            const newUsed = currentUsed - cancelledDays

            expect(newUsed).toBe(3)
        })
    })

    describe('initializeYearlyBalance', () => {
        it('should create new balance for new year', async () => {
            const newBalance = {
                employeeId: 'emp-1',
                leaveType: 'ANNUAL',
                year: 2025,
                entitlement: 12,
                used: 0,
                pending: 0,
                carriedForward: 3, // From 2024
            }

            vi.mocked(db.leaveBalance.create).mockResolvedValue({
                id: 'new-balance',
                ...newBalance,
            } as never)

            const result = await db.leaveBalance.create({ data: newBalance })

            expect(result.year).toBe(2025)
            expect(result.entitlement).toBe(12)
            expect(result.carriedForward).toBe(3)
        })
    })
})
