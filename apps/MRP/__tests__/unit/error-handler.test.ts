// =============================================================================
// L-ERP MRP - ERROR HANDLER UNIT TESTS
// Tests for error handling utilities
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleError,
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  tryCatch,
} from '@/lib/error-handler';

// Mock logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    logError: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// =============================================================================
// APP ERROR TESTS
// =============================================================================

describe('AppError', () => {
  it('should create error with default values', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
  });

  it('should create error with custom values', () => {
    const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', true, { field: 'test' });
    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('CUSTOM_ERROR');
    expect(error.context).toEqual({ field: 'test' });
  });

  it('should be instance of Error', () => {
    const error = new AppError('Test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

// =============================================================================
// SPECIALIZED ERROR CLASSES TESTS
// =============================================================================

describe('Specialized Error Classes', () => {
  describe('ValidationError', () => {
    it('should have correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should include context', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('AuthenticationError', () => {
    it('should have correct status code', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.message).toBe('Authentication required');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('AuthorizationError', () => {
    it('should have correct status code', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should have correct status code', () => {
      const error = new NotFoundError('Part');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Part not found');
    });

    it('should include id in message', () => {
      const error = new NotFoundError('Part', 'part-123');
      expect(error.message).toBe("Part with id 'part-123' not found");
    });
  });

  describe('ConflictError', () => {
    it('should have correct status code', () => {
      const error = new ConflictError('Duplicate entry');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('should have correct status code', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT');
    });
  });
});

// =============================================================================
// HANDLE ERROR TESTS
// =============================================================================

describe('handleError', () => {
  it('should handle AppError correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    const response = handleError(error);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
  });

  it('should handle ValidationError correctly', () => {
    const error = new ValidationError('Invalid input');
    const response = handleError(error);

    expect(response.status).toBe(400);
  });

  it('should handle ZodError correctly', () => {
    const schema = z.object({ name: z.string().min(1) });

    try {
      schema.parse({ name: '' });
    } catch (error) {
      const response = handleError(error);
      expect(response.status).toBe(400);
    }
  });

  it('should handle generic Error correctly', () => {
    const error = new Error('Generic error');
    const response = handleError(error);

    expect(response.status).toBe(500);
  });

  it('should handle unknown error types', () => {
    const response = handleError('string error');

    expect(response.status).toBe(500);
  });

  it('should handle null/undefined errors', () => {
    const response = handleError(null);
    expect(response.status).toBe(500);
  });
});

// =============================================================================
// SUCCESS RESPONSE TESTS
// =============================================================================

describe('Success Response Helpers', () => {
  describe('successResponse', () => {
    it('should return JSON response with data', async () => {
      const response = successResponse({ id: '123', name: 'Test' });
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual({ id: '123', name: 'Test' });
    });

    it('should have 200 status code', () => {
      const response = successResponse({ test: true });
      expect(response.status).toBe(200);
    });

    it('should include message if provided', async () => {
      const response = successResponse({ id: '123' }, 'Success!');
      const json = await response.json();

      expect(json.message).toBe('Success!');
    });
  });

  describe('createdResponse', () => {
    it('should have 201 status code', () => {
      const response = createdResponse({ id: '123' });
      expect(response.status).toBe(201);
    });

    it('should include default message', async () => {
      const response = createdResponse({ id: '123' });
      const json = await response.json();

      expect(json.message).toBe('Created successfully');
    });
  });

  describe('noContentResponse', () => {
    it('should have 204 status code', () => {
      const response = noContentResponse();
      expect(response.status).toBe(204);
    });
  });

  describe('paginatedResponse', () => {
    it('should include pagination metadata', async () => {
      const items = [{ id: '1' }, { id: '2' }];
      const response = paginatedResponse(items, 100, 1, 20);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data.items).toEqual(items);
      expect(json.data.total).toBe(100);
      expect(json.data.page).toBe(1);
      expect(json.data.pageSize).toBe(20);
      expect(json.data.totalPages).toBe(5);
    });

    it('should calculate totalPages correctly', async () => {
      const response = paginatedResponse([], 45, 3, 10);
      const json = await response.json();

      expect(json.data.totalPages).toBe(5);
    });
  });
});

// =============================================================================
// TRY-CATCH WRAPPER TESTS
// =============================================================================

describe('tryCatch', () => {
  it('should return result on success', async () => {
    const result = await tryCatch(async () => 'success');
    expect(result).toBe('success');
  });

  it('should throw AppError on failure', async () => {
    await expect(
      tryCatch(async () => {
        throw new Error('Failed');
      })
    ).rejects.toThrow(AppError);
  });

  it('should preserve AppError type', async () => {
    const originalError = new ValidationError('Validation failed');

    await expect(
      tryCatch(async () => {
        throw originalError;
      })
    ).rejects.toThrow(AppError);

    // Verify the error message and code are preserved
    try {
      await tryCatch(async () => {
        throw originalError;
      });
    } catch (error) {
      expect((error as AppError).message).toBe('Validation failed');
      expect((error as AppError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('should use custom error message', async () => {
    try {
      await tryCatch(
        async () => {
          throw new Error('Original');
        },
        'Custom message'
      );
    } catch (error) {
      expect((error as AppError).message).toBe('Custom message');
    }
  });
});
