// =============================================================================
// L-ERP MRP - API OPTIMIZATION MODULE
// Rate limiting, validation, compression, caching headers
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// =============================================================================
// RATE LIMITING
// =============================================================================

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
}

// In-memory store (use Redis in production for distributed rate limiting)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}, 60000); // Every minute

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.headers.get('x-forwarded-for') || 
                           req.headers.get('x-real-ip') || 
                           'anonymous',
  } = config;

  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    const remaining = Math.max(0, maxRequests - record.count);
    const resetIn = Math.ceil((record.resetTime - now) / 1000);

    if (record.count > maxRequests) {
      return NextResponse.json(
        { error: message, retryAfter: resetIn },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
            'Retry-After': resetIn.toString(),
          },
        }
      );
    }

    const response = await handler();
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', record.resetTime.toString());
    
    return response;
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Standard API: 100 requests per minute
  standard: rateLimit({ windowMs: 60000, maxRequests: 100 }),
  
  // Strict: 20 requests per minute (for expensive operations)
  strict: rateLimit({ windowMs: 60000, maxRequests: 20 }),
  
  // Relaxed: 500 requests per minute (for read-only endpoints)
  relaxed: rateLimit({ windowMs: 60000, maxRequests: 500 }),
  
  // Auth: 10 attempts per 15 minutes
  auth: rateLimit({ 
    windowMs: 900000, 
    maxRequests: 10,
    message: 'Too many login attempts, please try again later',
  }),
  
  // Export: 5 requests per hour
  export: rateLimit({
    windowMs: 3600000,
    maxRequests: 5,
    message: 'Export limit reached, please try again later',
  }),
};

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodIssue[];
}

/**
 * Validate request body against Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    return { success: false, errors: result.error.issues };
  } catch (error) {
    return {
      success: false,
      errors: [{ code: 'custom', message: 'Invalid JSON body', path: [] }],
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  const result = schema.safeParse(params);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
}

// Common validation schemas
export const commonSchemas = {
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  search: z.object({
    search: z.string().max(200).optional(),
    filter: z.string().optional(),
  }),
  
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
  
  id: z.object({
    id: z.string().uuid(),
  }),
};

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: z.ZodIssue[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create success response with proper headers
 */
export function successResponse<T>(
  data: T,
  options: {
    status?: number;
    meta?: ApiResponse<T>['meta'];
    cache?: string;
    etag?: string;
  } = {}
): NextResponse {
  const { status = 200, meta, cache, etag } = options;
  
  const response = NextResponse.json(
    { success: true, data, ...(meta && { meta }) },
    { status }
  );
  
  // Add cache headers
  if (cache) {
    response.headers.set('Cache-Control', cache);
  }
  
  if (etag) {
    response.headers.set('ETag', etag);
  }
  
  return response;
}

/**
 * Create error response
 */
export function errorResponse(
  error: string | Error | z.ZodError,
  status = 400
): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        errors: error.issues,
      },
      { status: 400 }
    );
  }
  
  const message = error instanceof Error ? error.message : error;
  
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  options: { cache?: string } = {}
): NextResponse {
  return successResponse(data, {
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    cache: options.cache,
  });
}

// =============================================================================
// CACHING HEADERS
// =============================================================================

export const cacheHeaders = {
  // No caching for dynamic data
  noCache: 'no-store, no-cache, must-revalidate',
  
  // Private cache (user-specific data)
  privateShort: 'private, max-age=60, stale-while-revalidate=30',
  privateMedium: 'private, max-age=300, stale-while-revalidate=60',
  
  // Public cache (shared data)
  publicShort: 'public, max-age=60, stale-while-revalidate=30',
  publicMedium: 'public, max-age=300, stale-while-revalidate=60',
  publicLong: 'public, max-age=3600, stale-while-revalidate=300',
  
  // Static assets
  immutable: 'public, max-age=31536000, immutable',
};

/**
 * Generate ETag from data
 */
export function generateETag(data: unknown): string {
  const content = JSON.stringify(data);
  // Simple hash without crypto for edge runtime compatibility
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Check if-none-match header
 */
export function checkETag(req: NextRequest, etag: string): boolean {
  const ifNoneMatch = req.headers.get('if-none-match');
  return ifNoneMatch === etag;
}

/**
 * Return 304 Not Modified if ETag matches
 */
export function conditionalResponse<T>(
  req: NextRequest,
  data: T,
  options: { cache?: string } = {}
): NextResponse {
  const etag = generateETag(data);
  
  if (checkETag(req, etag)) {
    return new NextResponse(null, { 
      status: 304,
      headers: { 'ETag': etag },
    });
  }
  
  return successResponse(data, { etag, cache: options.cache });
}

// =============================================================================
// REQUEST PROCESSING
// =============================================================================

/**
 * Parse and sanitize request body
 */
export async function parseBody<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Get pagination params from request
 */
export function getPagination(req: NextRequest): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
  
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Get sort params from request
 */
export function getSort(
  req: NextRequest,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): { [key: string]: 'asc' | 'desc' } {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || defaultField;
  const sortOrder = (searchParams.get('sortOrder') || defaultOrder) as 'asc' | 'desc';
  
  // Validate sort field to prevent injection
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  
  return { [field]: sortOrder };
}

// =============================================================================
// API WRAPPER WITH ALL OPTIMIZATIONS
// =============================================================================

export interface ApiHandlerOptions {
  rateLimit?: keyof typeof rateLimiters | RateLimitConfig;
  cache?: string;
  validateBody?: z.ZodSchema<unknown>;
  validateQuery?: z.ZodSchema<unknown>;
}

/**
 * Wrap API handler with all optimizations
 */
export function withOptimizations(
  handler: (
    req: NextRequest,
    context: { body?: unknown; query?: unknown }
  ) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const startTime = performance.now();
    
    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const limiter = typeof options.rateLimit === 'string'
          ? rateLimiters[options.rateLimit]
          : rateLimit(options.rateLimit);
        
        const rateLimitCheck = await limiter(req, async () => {
          return new NextResponse(null, { status: 200 });
        });
        
        if (rateLimitCheck.status === 429) {
          return rateLimitCheck;
        }
      }
      
      // Validate body
      let body: unknown;
      if (options.validateBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const validation = await validateBody(req, options.validateBody);
        if (!validation.success) {
          return errorResponse(new z.ZodError(validation.errors || []));
        }
        body = validation.data;
      }
      
      // Validate query
      let query: unknown;
      if (options.validateQuery) {
        const validation = validateQuery(req, options.validateQuery);
        if (!validation.success) {
          return errorResponse(new z.ZodError(validation.errors || []));
        }
        query = validation.data;
      }
      
      // Execute handler
      const response = await handler(req, { body, query });
      
      // Add performance timing
      const duration = performance.now() - startTime;
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
      
      // Add cache headers
      if (options.cache) {
        response.headers.set('Cache-Control', options.cache);
      }
      
      return response;
      
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'api-optimization', operation: 'apiHandler' });
      return errorResponse(
        error instanceof Error ? error : 'Internal server error',
        500
      );
    }
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  rateLimit,
  rateLimiters,
  validateBody,
  validateQuery,
  commonSchemas,
  successResponse,
  errorResponse,
  paginatedResponse,
  cacheHeaders,
  generateETag,
  checkETag,
  conditionalResponse,
  parseBody,
  getPagination,
  getSort,
  withOptimizations,
};
