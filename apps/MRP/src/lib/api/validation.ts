// =============================================================================
// L-ERP MRP - API VALIDATION WRAPPER
// Reusable validation middleware for API routes
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface ApiContext {
  params: Record<string, string>;
  searchParams: URLSearchParams;
  session: { user: { id: string; email: string; name?: string | null; role: string } } | null;
  tenantId: string;
  userId: string;
}

export interface ValidatedRequest<TBody = unknown, TQuery = unknown> {
  body: TBody;
  query: TQuery;
  context: ApiContext;
}

export type ApiHandler<TBody = unknown, TQuery = unknown, TResponse = unknown> = (
  req: ValidatedRequest<TBody, TQuery>
) => Promise<TResponse | NextResponse>;

export interface RouteConfig<TBody = unknown, TQuery = unknown> {
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
  requireAuth?: boolean;
  rateLimit?: {
    limit: number;
    windowSeconds: number;
  };
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export function errorResponse(
  message: string,
  status: number = 400,
  code: string = 'ERROR',
  details?: unknown
): NextResponse {
  const body: Record<string, unknown> = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };
  
  if (details !== undefined) {
    body.details = details;
  }
  
  return NextResponse.json(body, { status });
}

export function validationError(errors: z.ZodError): NextResponse {
  const details = errors.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', details);
}

export function unauthorizedError(): NextResponse {
  return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
}

export function forbiddenError(): NextResponse {
  return errorResponse('Forbidden', 403, 'FORBIDDEN');
}

export function notFoundError(resource: string = 'Resource'): NextResponse {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

export function serverError(message: string = 'Internal server error'): NextResponse {
  return errorResponse(message, 500, 'INTERNAL_ERROR');
}

// =============================================================================
// SUCCESS RESPONSES
// =============================================================================

export function successResponse<T>(
  data: T,
  meta?: { total?: number; page?: number; pageSize?: number }
): NextResponse {
  const body: Record<string, unknown> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  if (meta !== undefined) {
    body.meta = meta;
  }
  
  return NextResponse.json(body);
}

export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// =============================================================================
// VALIDATION WRAPPER
// =============================================================================

export function withValidation<TBody = unknown, TQuery = unknown>(
  config: RouteConfig<TBody, TQuery>,
  handler: ApiHandler<TBody, TQuery>
) {
  return async (
    request: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // Auth check
      let session = null;
      if (config.requireAuth !== false) {
        session = await auth();
        if (!session?.user) {
          return unauthorizedError();
        }
      }

      // Parse query params
      const searchParams = request.nextUrl.searchParams;
      let query: TQuery = {} as TQuery;
      
      if (config.querySchema) {
        const queryObj: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          queryObj[key] = value;
        });
        
        const queryResult = config.querySchema.safeParse(queryObj);
        if (!queryResult.success) {
          return validationError(queryResult.error);
        }
        query = queryResult.data;
      }

      // Parse body
      let body: TBody = {} as TBody;
      
      if (config.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const rawBody = await request.json();
          const bodyResult = config.bodySchema.safeParse(rawBody);
          if (!bodyResult.success) {
            return validationError(bodyResult.error);
          }
          body = bodyResult.data;
        } catch {
          return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
        }
      }

      // Build context
      const apiContext: ApiContext = {
        params: context.params || {},
        searchParams,
        session,
        tenantId: (session?.user as Record<string, unknown> | undefined)?.tenantId as string || 'default',
        userId: session?.user?.id || 'anonymous',
      };

      // Call handler
      const result = await handler({ body, query, context: apiContext });

      // Return response
      if (result instanceof NextResponse) {
        return result;
      }

      return successResponse(result);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'api-validation' });
      
      if (error instanceof ZodError) {
        return validationError(error);
      }
      
      const message = error instanceof Error ? error.message : 'Internal server error';
      return serverError(message);
    }
  };
}

// =============================================================================
// SIMPLE VALIDATORS
// =============================================================================

/**
 * Validate search params and return parsed data or error response
 */
export function validateQuery<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; response: NextResponse } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, response: validationError(result.error) };
}

/**
 * Validate request body and return parsed data or error response
 */
export async function validateBody<T>(
  schema: ZodSchema<T>,
  request: NextRequest
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, response: validationError(result.error) };
  } catch {
    return { success: false, response: errorResponse('Invalid JSON body', 400, 'INVALID_JSON') };
  }
}

/**
 * Get authenticated session or return error
 */
export async function requireAuth(): Promise<
  { success: true; session: { user: { id: string; email: string; name?: string | null; role: string } } } | { success: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, response: unauthorizedError() };
  }
  return { success: true, session };
}

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const IdParamSchema = z.object({
  id: z.string().min(1).max(100),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
});

export const DateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// =============================================================================
// EXPORT
// =============================================================================

export default {
  withValidation,
  validateQuery,
  validateBody,
  requireAuth,
  errorResponse,
  successResponse,
  createdResponse,
  noContentResponse,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  serverError,
  validationError,
};
