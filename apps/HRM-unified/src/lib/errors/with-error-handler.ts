/**
 * L-ERP HRM - API Error Handler HOF
 * Higher-Order Function to wrap API route handlers with standardized error handling
 * 
 * @module lib/errors/with-error-handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiError, ErrorCode, Errors } from './api-error'

/**
 * API Handler type definition
 */
export type ApiHandler<T = unknown> = (
    request: NextRequest,
    context?: { params: Record<string, string> }
) => Promise<NextResponse<T>>

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: {
        code: ErrorCode
        message: string
        details?: Record<string, unknown>
        timestamp: string
        requestId?: string
    }
    meta?: {
        page?: number
        pageSize?: number
        total?: number
        totalPages?: number
    }
}

/**
 * Format Zod validation errors to user-friendly format
 */
function formatZodError(error: ZodError): Record<string, string> {
    const formatted: Record<string, string> = {}

    for (const issue of error.issues) {
        const path = issue.path.join('.')
        formatted[path] = translateZodMessage(issue.message, issue.code)
    }

    return formatted
}

/**
 * Translate Zod error messages to Vietnamese
 */
function translateZodMessage(message: string, code: string): string {
    const translations: Record<string, string> = {
        'Required': 'Trường này bắt buộc',
        'Invalid email': 'Email không hợp lệ',
        'String must contain at least': 'Độ dài tối thiểu không đạt',
        'String must contain at most': 'Độ dài vượt quá giới hạn',
        'Invalid date': 'Ngày không hợp lệ',
        'Expected number': 'Phải là số',
        'Expected string': 'Phải là chuỗi',
        'Invalid enum value': 'Giá trị không hợp lệ',
    }

    for (const [key, value] of Object.entries(translations)) {
        if (message.includes(key)) {
            return value
        }
    }

    // Code-based translations
    const codeTranslations: Record<string, string> = {
        'invalid_type': 'Kiểu dữ liệu không đúng',
        'invalid_string': 'Chuỗi không hợp lệ',
        'too_small': 'Giá trị quá nhỏ',
        'too_big': 'Giá trị quá lớn',
        'invalid_date': 'Ngày không hợp lệ',
        'invalid_enum_value': 'Giá trị không nằm trong danh sách cho phép',
    }

    return codeTranslations[code] || message
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log error for debugging and monitoring
 */
function logError(error: unknown, requestId: string, path: string): void {
    const timestamp = new Date().toISOString()

    if (error instanceof ApiError) {
        console.error(`[${timestamp}] [${requestId}] API Error at ${path}:`, {
            code: error.code,
            message: error.message,
            details: error.details,
        })
    } else if (error instanceof Error) {
        console.error(`[${timestamp}] [${requestId}] Unhandled Error at ${path}:`, {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        })
    } else {
        console.error(`[${timestamp}] [${requestId}] Unknown Error at ${path}:`, error)
    }

    // TODO: Send to Sentry when integrated
    // captureException(error, { extra: { requestId, path } })
}

/**
 * Higher-Order Function to wrap API handlers with error handling
 * 
 * @example
 * ```typescript
 * export const GET = withErrorHandler(async (request) => {
 *   const session = await auth()
 *   if (!session?.user) {
 *     throw Errors.unauthorized()
 *   }
 *   
 *   const data = await service.findAll()
 *   return NextResponse.json({ success: true, data })
 * })
 * ```
 */
export function withErrorHandler<T = unknown>(
    handler: ApiHandler<T>
): ApiHandler<ApiResponse<T>> {
    return async (request, context) => {
        const requestId = generateRequestId()
        const path = request.nextUrl.pathname

        try {
            // Execute the handler
            const response = await handler(request, context)

            // Add request ID to successful responses
            const data = await response.json()

            return NextResponse.json(
                {
                    success: true,
                    ...data,
                    meta: {
                        ...data.meta,
                        requestId,
                    }
                },
                {
                    status: response.status,
                    headers: {
                        'X-Request-Id': requestId,
                    }
                }
            )
        } catch (error) {
            // Log the error
            logError(error, requestId, path)

            // Handle ApiError
            if (error instanceof ApiError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: error.code,
                            message: error.message,
                            details: error.details,
                            timestamp: error.timestamp,
                            requestId,
                        }
                    },
                    {
                        status: error.statusCode,
                        headers: {
                            'X-Request-Id': requestId,
                        }
                    }
                )
            }

            // Handle Zod validation errors
            if (error instanceof ZodError) {
                const formattedErrors = formatZodError(error)

                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: ErrorCode.VALIDATION_ERROR,
                            message: 'Dữ liệu không hợp lệ',
                            details: {
                                fields: formattedErrors,
                                issues: error.issues,
                            },
                            timestamp: new Date().toISOString(),
                            requestId,
                        }
                    },
                    {
                        status: 400,
                        headers: {
                            'X-Request-Id': requestId,
                        }
                    }
                )
            }

            // Convert unknown errors to ApiError
            const apiError = ApiError.fromError(error, requestId)

            return NextResponse.json(
                apiError.toJSON(),
                {
                    status: apiError.statusCode,
                    headers: {
                        'X-Request-Id': requestId,
                    }
                }
            )
        }
    }
}

/**
 * Wrapper for handlers that need auth check
 * Automatically throws unauthorized error if no session
 */
export function withAuth<T = unknown>(
    handler: (
        request: NextRequest,
        session: { user: { id: string; tenantId: string; email: string; role: string } },
        context?: { params: Record<string, string> }
    ) => Promise<NextResponse<T>>,
    authFn: () => Promise<{ user?: { id: string; tenantId: string; email: string; role: string } } | null>
): ApiHandler<T> {
    return async (request, context) => {
        const session = await authFn()

        if (!session?.user) {
            throw Errors.unauthorized()
        }

        return handler(request, session as { user: { id: string; tenantId: string; email: string; role: string } }, context)
    }
}

/**
 * Create a successful JSON response
 */
export function successResponse<T>(
    data: T,
    meta?: ApiResponse['meta'],
    status = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
            meta,
        },
        { status }
    )
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    pagination: { page: number; pageSize: number; total: number }
): NextResponse<ApiResponse<T[]>> {
    return NextResponse.json({
        success: true,
        data,
        meta: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.pageSize),
        }
    })
}
