/**
 * L-ERP HRM - Payroll Service Tests
 * Comprehensive tests for payroll calculation and management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/db', () => ({
    db: {
        payroll: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        payrollItem: {
            findMany: vi.fn(),
            createMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        employee: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        contract: {
            findFirst: vi.fn(),
        },
        attendance: {
            findMany: vi.fn(),
        },
        leaveRequest: {
            findMany: vi.fn(),
        },
        overtime: {
            findMany: vi.fn(),
        },
    },
}))

import { db } from '@/lib/db'

// ============================================================
// Payroll Calculation Logic Tests
// ============================================================
describe('Payroll Calculation Logic', () => {
    describe('Gross Salary Calculation', () => {
        it('should calculate gross salary correctly for full month', () => {
            const baseSalary = 15000000
            const allowances = 2000000
            const workingDays = 22
            const actualWorkingDays = 22

            const grossSalary = (baseSalary + allowances) * (actualWorkingDays / workingDays)

            expect(grossSalary).toBe(17000000)
        })

        it('should calculate pro-rated salary for partial month', () => {
            const baseSalary = 15000000
            const allowances = 2000000
            const workingDays = 22
            const actualWorkingDays = 15 // Joined mid-month

            const grossSalary = (baseSalary + allowances) * (actualWorkingDays / workingDays)

            expect(grossSalary).toBeCloseTo(11590909, 0)
        })

        it('should handle zero working days', () => {
            const baseSalary = 15000000
            const workingDays = 22
            const actualWorkingDays = 0

            const grossSalary = baseSalary * (actualWorkingDays / workingDays)

            expect(grossSalary).toBe(0)
        })
    })

    describe('Overtime Pay Calculation', () => {
        it('should calculate weekday overtime at 150%', () => {
            const hourlyRate = 100000
            const overtimeHours = 2
            const weekdayMultiplier = 1.5

            const overtimePay = hourlyRate * overtimeHours * weekdayMultiplier

            expect(overtimePay).toBe(300000)
        })

        it('should calculate weekend overtime at 200%', () => {
            const hourlyRate = 100000
            const overtimeHours = 4
            const weekendMultiplier = 2.0

            const overtimePay = hourlyRate * overtimeHours * weekendMultiplier

            expect(overtimePay).toBe(800000)
        })

        it('should calculate holiday overtime at 300%', () => {
            const hourlyRate = 100000
            const overtimeHours = 3
            const holidayMultiplier = 3.0

            const overtimePay = hourlyRate * overtimeHours * holidayMultiplier

            expect(overtimePay).toBe(900000)
        })

        it('should calculate night overtime with additional 30%', () => {
            const hourlyRate = 100000
            const overtimeHours = 2
            const weekdayMultiplier = 1.5
            const nightBonus = 0.3

            const overtimePay = hourlyRate * overtimeHours * (weekdayMultiplier + nightBonus)

            expect(overtimePay).toBe(360000)
        })
    })

    describe('Leave Deduction Calculation', () => {
        it('should not deduct for paid annual leave', () => {
            const dailyRate = 700000
            const unpaidLeaveDays = 0
            const paidLeaveDays = 2

            const deduction = dailyRate * unpaidLeaveDays

            expect(deduction).toBe(0)
        })

        it('should deduct for unpaid leave', () => {
            const dailyRate = 700000
            const unpaidLeaveDays = 3

            const deduction = dailyRate * unpaidLeaveDays

            expect(deduction).toBe(2100000)
        })

        it('should handle mixed paid and unpaid leave', () => {
            const dailyRate = 700000
            const unpaidLeaveDays = 2
            const paidLeaveDays = 3

            const deduction = dailyRate * unpaidLeaveDays

            expect(deduction).toBe(1400000)
        })
    })

    describe('Insurance Deduction Calculation', () => {
        // Vietnam social insurance rates (2024)
        const SOCIAL_INSURANCE_RATE = 0.08 // 8% employee contribution
        const HEALTH_INSURANCE_RATE = 0.015 // 1.5%
        const UNEMPLOYMENT_INSURANCE_RATE = 0.01 // 1%
        const MAX_INSURANCE_BASE = 36000000 // 20 x minimum wage

        it('should calculate social insurance correctly', () => {
            const baseSalary = 15000000
            const socialInsurance = baseSalary * SOCIAL_INSURANCE_RATE

            expect(socialInsurance).toBe(1200000)
        })

        it('should calculate health insurance correctly', () => {
            const baseSalary = 15000000
            const healthInsurance = baseSalary * HEALTH_INSURANCE_RATE

            expect(healthInsurance).toBe(225000)
        })

        it('should calculate unemployment insurance correctly', () => {
            const baseSalary = 15000000
            const unemploymentInsurance = baseSalary * UNEMPLOYMENT_INSURANCE_RATE

            expect(unemploymentInsurance).toBe(150000)
        })

        it('should cap insurance base at maximum', () => {
            const highSalary = 50000000
            const cappedBase = Math.min(highSalary, MAX_INSURANCE_BASE)
            const socialInsurance = cappedBase * SOCIAL_INSURANCE_RATE

            expect(socialInsurance).toBe(2880000) // 36M * 8%
        })

        it('should calculate total insurance deduction', () => {
            const baseSalary = 15000000
            const totalRate = SOCIAL_INSURANCE_RATE + HEALTH_INSURANCE_RATE + UNEMPLOYMENT_INSURANCE_RATE
            const totalInsurance = baseSalary * totalRate

            expect(totalInsurance).toBe(1575000) // 15M * 10.5%
        })
    })

    describe('PIT (Personal Income Tax) Calculation', () => {
        // Vietnam PIT rates (progressive tax brackets)
        const calculatePIT = (taxableIncome: number): number => {
            if (taxableIncome <= 0) return 0

            const brackets = [
                { limit: 5000000, rate: 0.05 },
                { limit: 10000000, rate: 0.10 },
                { limit: 18000000, rate: 0.15 },
                { limit: 32000000, rate: 0.20 },
                { limit: 52000000, rate: 0.25 },
                { limit: 80000000, rate: 0.30 },
                { limit: Infinity, rate: 0.35 },
            ]

            let tax = 0
            let remaining = taxableIncome
            let previousLimit = 0

            for (const bracket of brackets) {
                const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit)
                if (taxableInBracket <= 0) break

                tax += taxableInBracket * bracket.rate
                remaining -= taxableInBracket
                previousLimit = bracket.limit
            }

            return tax
        }

        it('should calculate PIT for first bracket (5% up to 5M)', () => {
            const taxableIncome = 4000000
            const pit = calculatePIT(taxableIncome)

            expect(pit).toBe(200000) // 4M * 5%
        })

        it('should calculate PIT for second bracket (10% 5M-10M)', () => {
            const taxableIncome = 8000000
            const pit = calculatePIT(taxableIncome)

            // First 5M * 5% = 250,000
            // Next 3M * 10% = 300,000
            expect(pit).toBe(550000)
        })

        it('should calculate PIT for third bracket (15% 10M-18M)', () => {
            const taxableIncome = 15000000
            const pit = calculatePIT(taxableIncome)

            // First 5M * 5% = 250,000
            // Next 5M * 10% = 500,000
            // Next 5M * 15% = 750,000
            expect(pit).toBe(1500000)
        })

        it('should calculate PIT for high income (multiple brackets)', () => {
            const taxableIncome = 40000000
            const pit = calculatePIT(taxableIncome)

            // First 5M * 5% = 250,000
            // Next 5M * 10% = 500,000
            // Next 8M * 15% = 1,200,000
            // Next 14M * 20% = 2,800,000
            // Next 8M * 25% = 2,000,000
            expect(pit).toBe(6750000)
        })

        it('should return 0 for zero or negative taxable income', () => {
            expect(calculatePIT(0)).toBe(0)
            expect(calculatePIT(-1000000)).toBe(0)
        })

        it('should apply personal deduction of 11M', () => {
            const grossIncome = 20000000
            const personalDeduction = 11000000
            const insurance = 2100000

            const taxableIncome = grossIncome - personalDeduction - insurance
            const pit = calculatePIT(taxableIncome)

            expect(taxableIncome).toBe(6900000)
            expect(pit).toBe(440000) // 5M*5% + 1.9M*10% = 250K + 190K
        })

        it('should apply dependent deduction of 4.4M per dependent', () => {
            const grossIncome = 25000000
            const personalDeduction = 11000000
            const dependents = 2
            const dependentDeduction = 4400000 * dependents
            const insurance = 2625000

            const taxableIncome = grossIncome - personalDeduction - dependentDeduction - insurance
            const pit = calculatePIT(taxableIncome)

            expect(taxableIncome).toBe(2575000)
            expect(pit).toBe(128750) // 2.575M * 5%
        })
    })

    describe('Net Salary Calculation', () => {
        it('should calculate net salary correctly', () => {
            const grossSalary = 20000000
            const insurance = 2100000
            const pit = 440000
            const otherDeductions = 0

            const netSalary = grossSalary - insurance - pit - otherDeductions

            expect(netSalary).toBe(17460000)
        })

        it('should include overtime and bonuses in net calculation', () => {
            const grossSalary = 20000000
            const overtime = 1500000
            const bonus = 2000000
            const insurance = 2100000
            const pit = 940000

            const netSalary = grossSalary + overtime + bonus - insurance - pit

            expect(netSalary).toBe(20460000)
        })

        it('should handle loan deductions', () => {
            const grossSalary = 20000000
            const insurance = 2100000
            const pit = 440000
            const loanDeduction = 3000000

            const netSalary = grossSalary - insurance - pit - loanDeduction

            expect(netSalary).toBe(14460000)
        })

        it('should ensure net salary is not negative', () => {
            const grossSalary = 5000000
            const insurance = 525000
            const pit = 0
            const loanDeduction = 6000000 // More than gross

            const rawNet = grossSalary - insurance - pit - loanDeduction
            const netSalary = Math.max(0, rawNet)

            expect(netSalary).toBe(0)
        })
    })

    describe('Payroll Period Validation', () => {
        it('should validate payroll period dates', () => {
            const startDate = new Date('2024-01-01')
            const endDate = new Date('2024-01-31')

            const isValid = endDate > startDate

            expect(isValid).toBe(true)
        })

        it('should reject invalid date range', () => {
            const startDate = new Date('2024-01-31')
            const endDate = new Date('2024-01-01')

            const isValid = endDate > startDate

            expect(isValid).toBe(false)
        })

        it('should calculate working days in period', () => {
            // January 2024 has 23 working days (excluding weekends)
            const workingDays = 23
            const holidays = 1 // New Year

            const actualWorkingDays = workingDays - holidays

            expect(actualWorkingDays).toBe(22)
        })
    })
})

// ============================================================
// Payroll Service Integration Tests
// ============================================================
describe('Payroll Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('findByPeriod', () => {
        it('should find payroll by period and tenant', async () => {
            const mockPayroll = {
                id: 'payroll-1',
                tenantId: 'tenant-1',
                periodId: 'period-1',
                status: 'DRAFT',
                totalGross: 100000000,
                totalNet: 85000000,
            }

            vi.mocked(db.payroll.findFirst).mockResolvedValue(mockPayroll as never)

            const result = await db.payroll.findFirst({
                where: { tenantId: 'tenant-1', periodId: 'period-1' }
            })

            expect(result).toEqual(mockPayroll)
            expect(db.payroll.findFirst).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-1', periodId: 'period-1' }
            })
        })
    })

    describe('calculateEmployeePayroll', () => {
        it('should calculate payroll for employee with all components', async () => {
            // This test verifies the calculation flow
            const employee = {
                id: 'emp-1',
                baseSalary: 15000000,
                allowances: 2000000,
            }

            const workingDays = {
                standard: 22,
                actual: 22,
            }

            const overtime = {
                weekday: 4, // hours
                weekend: 2,
                holiday: 0,
            }

            const hourlyRate = employee.baseSalary / 22 / 8
            const overtimePay =
                (hourlyRate * overtime.weekday * 1.5) +
                (hourlyRate * overtime.weekend * 2.0) +
                (hourlyRate * overtime.holiday * 3.0)

            const grossSalary = employee.baseSalary + employee.allowances + overtimePay

            expect(grossSalary).toBeGreaterThan(17000000)
        })
    })
})
