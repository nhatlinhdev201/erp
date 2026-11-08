/**
 * L-ERP HRM - API Error Tests
 * Unit tests for error handling infrastructure
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
    ApiError,
    ErrorCode,
    ErrorCodeToStatus,
    ErrorMessages,
    Errors,
    isApiError,
} from '@/lib/errors/api-error'
import {
    withErrorHandler,
    successResponse,
    paginatedResponse,
} from '@/lib/errors/with-error-handler'
import { ZodError, z } from 'zod'

// ============================================================
// ApiError Class Tests
// ============================================================
describe('ApiError', () => {
    describe('constructor', () => {
        it('should create error with code and default message', () => {
            const error = new ApiError(ErrorCode.NOT_FOUND)

            expect(error.code).toBe(ErrorCode.NOT_FOUND)
            expect(error.message).toBe(ErrorMessages[ErrorCode.NOT_FOUND])
            expect(error.statusCode).toBe(404)
            expect(error.timestamp).toBeDefined()
        })

        it('should create error with custom message', () => {
            const error = new ApiError(ErrorCode.NOT_FOUND, 'Nhân viên không tồn tại')

            expect(error.message).toBe('Nhân viên không tồn tại')
        })

        it('should create error with details', () => {
            const details = { field: 'email', value: 'invalid' }
            const error = new ApiError(ErrorCode.VALIDATION_ERROR, 'Email không hợp lệ', details)

            expect(error.details).toEqual(details)
        })

        it('should create error with request ID', () => {
            const error = new ApiError(ErrorCode.INTERNAL_ERROR, 'Test', undefined, 'req_123')

            expect(error.requestId).toBe('req_123')
        })
    })

    describe('toJSON', () => {
        it('should return standardized JSON format', () => {
            const error = new ApiError(ErrorCode.UNAUTHORIZED, 'Chưa đăng nhập')
            const json = error.toJSON()

            expect(json).toEqual({
                success: false,
                error: {
                    code: ErrorCode.UNAUTHORIZED,
                    message: 'Chưa đăng nhập',
                    details: undefined,
                    timestamp: expect.any(String),
                    requestId: undefined,
                }
            })
        })
    })

    describe('fromError', () => {
        it('should return same ApiError if already ApiError', () => {
            const original = new ApiError(ErrorCode.NOT_FOUND)
            const converted = ApiError.fromError(original)

            expect(converted).toBe(original)
        })

        it('should convert Prisma unique constraint error', () => {
            const prismaError = new Error('Unique constraint failed on the fields: (`email`)')
            const converted = ApiError.fromError(prismaError)

            expect(converted.code).toBe(ErrorCode.DUPLICATE_ENTRY)
            expect(converted.statusCode).toBe(409)
        })

        it('should convert Prisma record not found error', () => {
            const prismaError = new Error('Record to update not found')
            const converted = ApiError.fromError(prismaError)

            expect(converted.code).toBe(ErrorCode.NOT_FOUND)
        })

        it('should convert foreign key constraint error', () => {
            const prismaError = new Error('Foreign key constraint failed')
            const converted = ApiError.fromError(prismaError)

            expect(converted.code).toBe(ErrorCode.BUSINESS_RULE_VIOLATION)
        })

        it('should convert unknown error to INTERNAL_ERROR', () => {
            const unknownError = 'some string error'
            const converted = ApiError.fromError(unknownError)

            expect(converted.code).toBe(ErrorCode.INTERNAL_ERROR)
        })
    })
})

// ============================================================
// Error Factory Tests
// ============================================================
describe('Errors factory', () => {
    it('should create unauthorized error', () => {
        const error = Errors.unauthorized()
        expect(error.code).toBe(ErrorCode.UNAUTHORIZED)
        expect(error.statusCode).toBe(401)
    })

    it('should create forbidden error', () => {
        const error = Errors.forbidden()
        expect(error.code).toBe(ErrorCode.FORBIDDEN)
        expect(error.statusCode).toBe(403)
    })

    it('should create not found error with resource name', () => {
        const error = Errors.notFound('Nhân viên')
        expect(error.message).toBe('Nhân viên không tồn tại')
    })

    it('should create duplicate error with field name', () => {
        const error = Errors.duplicate('email')
        expect(error.message).toBe('email đã tồn tại')
        expect(error.details).toEqual({ field: 'email' })
    })

    it('should create validation error with details', () => {
        const error = Errors.validation('Dữ liệu không hợp lệ', { field: 'phone' })
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(error.details).toEqual({ field: 'phone' })
    })

    it('should create business rule error', () => {
        const error = Errors.businessRule('Không thể xóa phòng ban có nhân viên')
        expect(error.code).toBe(ErrorCode.BUSINESS_RULE_VIOLATION)
        expect(error.statusCode).toBe(422)
    })

    it('should create internal error', () => {
        const error = Errors.internal()
        expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
        expect(error.statusCode).toBe(500)
    })
})

// ============================================================
// isApiError Type Guard Tests
// ============================================================
describe('isApiError', () => {
    it('should return true for ApiError instance', () => {
        const error = new ApiError(ErrorCode.NOT_FOUND)
        expect(isApiError(error)).toBe(true)
    })

    it('should return false for regular Error', () => {
        const error = new Error('test')
        expect(isApiError(error)).toBe(false)
    })

    it('should return false for non-error', () => {
        expect(isApiError('string')).toBe(false)
        expect(isApiError(null)).toBe(false)
        expect(isApiError(undefined)).toBe(false)
    })
})

// ============================================================
// ErrorCode Mapping Tests  
// ============================================================
describe('ErrorCodeToStatus', () => {
    it('should map all error codes to HTTP status codes', () => {
        expect(ErrorCodeToStatus[ErrorCode.UNAUTHORIZED]).toBe(401)
        expect(ErrorCodeToStatus[ErrorCode.FORBIDDEN]).toBe(403)
        expect(ErrorCodeToStatus[ErrorCode.NOT_FOUND]).toBe(404)
        expect(ErrorCodeToStatus[ErrorCode.VALIDATION_ERROR]).toBe(400)
        expect(ErrorCodeToStatus[ErrorCode.DUPLICATE_ENTRY]).toBe(409)
        expect(ErrorCodeToStatus[ErrorCode.RATE_LIMITED]).toBe(429)
        expect(ErrorCodeToStatus[ErrorCode.INTERNAL_ERROR]).toBe(500)
    })
})

describe('ErrorMessages', () => {
    it('should have Vietnamese messages for all error codes', () => {
        const allCodes = Object.values(ErrorCode)

        for (const code of allCodes) {
            expect(ErrorMessages[code]).toBeDefined()
            expect(typeof ErrorMessages[code]).toBe('string')
            expect(ErrorMessages[code].length).toBeGreaterThan(0)
        }
    })
})

// ============================================================
// Response Helper Tests
// ============================================================
describe('successResponse', () => {
    it('should create success response with data', () => {
        const data = { id: '1', name: 'Test' }
        const response = successResponse(data)

        expect(response.status).toBe(200)
    })

    it('should create success response with custom status', () => {
        const data = { id: '1' }
        const response = successResponse(data, undefined, 201)

        expect(response.status).toBe(201)
    })
})

describe('paginatedResponse', () => {
    it('should create paginated response with meta', async () => {
        const data = [{ id: '1' }, { id: '2' }]
        const response = paginatedResponse(data, { page: 1, pageSize: 10, total: 100 })
        const json = await response.json()

        expect(json.success).toBe(true)
        expect(json.data).toEqual(data)
        expect(json.meta).toEqual({
            page: 1,
            pageSize: 10,
            total: 100,
            totalPages: 10,
        })
    })

    it('should calculate total pages correctly', async () => {
        const data = [{ id: '1' }]
        const response = paginatedResponse(data, { page: 1, pageSize: 20, total: 45 })
        const json = await response.json()

        expect(json.meta.totalPages).toBe(3) // Math.ceil(45/20) = 3
    })
})

// ============================================================
// withErrorHandler HOF Tests
// ============================================================
describe('withErrorHandler', () => {
    const createMockRequest = (url = 'http://localhost:3000/api/test') => {
        return new NextRequest(new URL(url))
    }

    it('should pass through successful response', async () => {
        const handler = withErrorHandler(async () => {
            return NextResponse.json({ data: 'test' })
        })

        const response = await handler(createMockRequest())
        const json = await response.json()

        expect(json.success).toBe(true)
        expect(json.data).toBe('test')
    })

    it('should handle ApiError and return proper response', async () => {
        const handler = withErrorHandler(async () => {
            throw Errors.notFound('Resource')
        })

        const response = await handler(createMockRequest())
        const json = await response.json()

        expect(response.status).toBe(404)
        expect(json.success).toBe(false)
        expect(json.error.code).toBe(ErrorCode.NOT_FOUND)
    })

    it('should handle ZodError and return validation error', async () => {
        const schema = z.object({ email: z.string().email() })

        const handler = withErrorHandler(async () => {
            schema.parse({ email: 'invalid' })
            return NextResponse.json({})
        })

        const response = await handler(createMockRequest())
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.success).toBe(false)
        expect(json.error.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(json.error.details.fields).toBeDefined()
    })

    it('should handle unknown error and return 500', async () => {
        const handler = withErrorHandler(async () => {
            throw new Error('Something went wrong')
        })

        const response = await handler(createMockRequest())

        expect(response.status).toBe(500)
    })

    it('should add request ID to response headers', async () => {
        const handler = withErrorHandler(async () => {
            return NextResponse.json({ data: 'test' })
        })

        const response = await handler(createMockRequest())

        expect(response.headers.get('X-Request-Id')).toMatch(/^req_/)
    })

    it('should add request ID to error response', async () => {
        const handler = withErrorHandler(async () => {
            throw Errors.unauthorized()
        })

        const response = await handler(createMockRequest())
        const json = await response.json()

        expect(json.error.requestId).toMatch(/^req_/)
    })
})
