/**
 * L-ERP HRM - API Error Infrastructure
 * Standardized error codes and ApiError class
 * 
 * @module lib/errors/api-error
 */

/**
 * Standardized error codes for API responses
 * Used across all API endpoints for consistent error handling
 */
export enum ErrorCode {
    // Authentication & Authorization
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

    // Resource errors
    NOT_FOUND = 'NOT_FOUND',
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    RESOURCE_LOCKED = 'RESOURCE_LOCKED',

    // Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT = 'INVALID_FORMAT',

    // Business logic errors
    BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    WORKFLOW_ERROR = 'WORKFLOW_ERROR',
    APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',

    // System errors
    DATABASE_ERROR = 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    RATE_LIMITED = 'RATE_LIMITED',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    INTERNAL_ERROR = 'INTERNAL_ERROR',

    // File/Import errors
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    IMPORT_ERROR = 'IMPORT_ERROR',
}

/**
 * HTTP status codes mapping for error codes
 */
export const ErrorCodeToStatus: Record<ErrorCode, number> = {
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.SESSION_EXPIRED]: 401,
    [ErrorCode.INVALID_CREDENTIALS]: 401,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.ALREADY_EXISTS]: 409,
    [ErrorCode.DUPLICATE_ENTRY]: 409,
    [ErrorCode.RESOURCE_LOCKED]: 423,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.INVALID_FORMAT]: 400,
    [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
    [ErrorCode.INSUFFICIENT_BALANCE]: 422,
    [ErrorCode.WORKFLOW_ERROR]: 422,
    [ErrorCode.APPROVAL_REQUIRED]: 422,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorCode.RATE_LIMITED]: 429,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.FILE_TOO_LARGE]: 413,
    [ErrorCode.INVALID_FILE_TYPE]: 415,
    [ErrorCode.IMPORT_ERROR]: 422,
}

/**
 * Vietnamese error messages for user-friendly display
 */
export const ErrorMessages: Record<ErrorCode, string> = {
    [ErrorCode.UNAUTHORIZED]: 'Bạn chưa đăng nhập',
    [ErrorCode.FORBIDDEN]: 'Bạn không có quyền thực hiện thao tác này',
    [ErrorCode.SESSION_EXPIRED]: 'Phiên đăng nhập đã hết hạn',
    [ErrorCode.INVALID_CREDENTIALS]: 'Thông tin đăng nhập không chính xác',
    [ErrorCode.NOT_FOUND]: 'Không tìm thấy dữ liệu',
    [ErrorCode.ALREADY_EXISTS]: 'Dữ liệu đã tồn tại',
    [ErrorCode.DUPLICATE_ENTRY]: 'Dữ liệu bị trùng lặp',
    [ErrorCode.RESOURCE_LOCKED]: 'Tài nguyên đang bị khóa',
    [ErrorCode.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ',
    [ErrorCode.INVALID_INPUT]: 'Dữ liệu đầu vào không hợp lệ',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Thiếu thông tin bắt buộc',
    [ErrorCode.INVALID_FORMAT]: 'Định dạng không hợp lệ',
    [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Vi phạm quy tắc nghiệp vụ',
    [ErrorCode.INSUFFICIENT_BALANCE]: 'Số dư không đủ',
    [ErrorCode.WORKFLOW_ERROR]: 'Lỗi quy trình phê duyệt',
    [ErrorCode.APPROVAL_REQUIRED]: 'Cần phê duyệt để tiếp tục',
    [ErrorCode.DATABASE_ERROR]: 'Lỗi cơ sở dữ liệu',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Lỗi dịch vụ bên ngoài',
    [ErrorCode.RATE_LIMITED]: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Dịch vụ tạm thời không khả dụng',
    [ErrorCode.INTERNAL_ERROR]: 'Đã xảy ra lỗi hệ thống',
    [ErrorCode.FILE_TOO_LARGE]: 'File quá lớn',
    [ErrorCode.INVALID_FILE_TYPE]: 'Loại file không được hỗ trợ',
    [ErrorCode.IMPORT_ERROR]: 'Lỗi nhập dữ liệu',
}

/**
 * Error details interface for structured error information
 */
export interface ErrorDetails {
    field?: string
    value?: unknown
    constraint?: string
    [key: string]: unknown
}

/**
 * Custom API Error class for standardized error handling
 * 
 * @example
 * ```typescript
 * throw new ApiError(ErrorCode.NOT_FOUND, 'Không tìm thấy nhân viên')
 * throw new ApiError(ErrorCode.VALIDATION_ERROR, 'Email không hợp lệ', { field: 'email' })
 * ```
 */
export class ApiError extends Error {
    public readonly code: ErrorCode
    public readonly statusCode: number
    public readonly details?: ErrorDetails
    public readonly timestamp: string
    public readonly requestId?: string

    constructor(
        code: ErrorCode,
        message?: string,
        details?: ErrorDetails,
        requestId?: string
    ) {
        super(message || ErrorMessages[code])

        this.name = 'ApiError'
        this.code = code
        this.statusCode = ErrorCodeToStatus[code]
        this.details = details
        this.timestamp = new Date().toISOString()
        this.requestId = requestId

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor)
    }

    /**
     * Convert error to JSON response format
     */
    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: this.timestamp,
                requestId: this.requestId,
            }
        }
    }

    /**
     * Create ApiError from unknown error
     */
    static fromError(error: unknown, requestId?: string): ApiError {
        if (error instanceof ApiError) {
            return error
        }

        if (error instanceof Error) {
            // Check for Prisma errors
            if (error.message.includes('Unique constraint')) {
                return new ApiError(
                    ErrorCode.DUPLICATE_ENTRY,
                    'Dữ liệu đã tồn tại trong hệ thống',
                    { originalMessage: error.message },
                    requestId
                )
            }

            if (error.message.includes('Record to update not found')) {
                return new ApiError(
                    ErrorCode.NOT_FOUND,
                    'Không tìm thấy dữ liệu cần cập nhật',
                    undefined,
                    requestId
                )
            }

            if (error.message.includes('Foreign key constraint')) {
                return new ApiError(
                    ErrorCode.BUSINESS_RULE_VIOLATION,
                    'Không thể thực hiện do ràng buộc dữ liệu',
                    { originalMessage: error.message },
                    requestId
                )
            }
        }

        return new ApiError(
            ErrorCode.INTERNAL_ERROR,
            'Đã xảy ra lỗi không mong muốn',
            undefined,
            requestId
        )
    }
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
}

/**
 * Create common API errors with factory functions
 */
export const Errors = {
    unauthorized: (message?: string) =>
        new ApiError(ErrorCode.UNAUTHORIZED, message),

    forbidden: (message?: string) =>
        new ApiError(ErrorCode.FORBIDDEN, message),

    notFound: (resource = 'Dữ liệu') =>
        new ApiError(ErrorCode.NOT_FOUND, `${resource} không tồn tại`),

    duplicate: (field: string) =>
        new ApiError(ErrorCode.DUPLICATE_ENTRY, `${field} đã tồn tại`, { field }),

    validation: (message: string, details?: ErrorDetails) =>
        new ApiError(ErrorCode.VALIDATION_ERROR, message, details),

    businessRule: (message: string) =>
        new ApiError(ErrorCode.BUSINESS_RULE_VIOLATION, message),

    internal: (message?: string) =>
        new ApiError(ErrorCode.INTERNAL_ERROR, message),
}
