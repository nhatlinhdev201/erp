/**
 * L-ERP HRM - Error Handling Module
 * Centralized exports for error handling utilities
 * 
 * @module lib/errors
 */

// Core error classes and types
export {
    ApiError,
    ErrorCode,
    ErrorCodeToStatus,
    ErrorMessages,
    Errors,
    isApiError,
    type ErrorDetails,
} from './api-error'

// Handler utilities
export {
    withErrorHandler,
    withAuth,
    successResponse,
    paginatedResponse,
    type ApiHandler,
    type ApiResponse,
} from './with-error-handler'
