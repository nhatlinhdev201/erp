// =============================================================================
// L-ERP MRP - API RESPONSE OPTIMIZATION
// Response compression, ETags, and caching headers
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface ResponseOptions {
  status?: number;
  cache?: CacheControl;
  etag?: boolean;
  compress?: boolean;
  headers?: Record<string, string>;
}

export interface CacheControl {
  public?: boolean;
  private?: boolean;
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

// =============================================================================
// CACHE CONTROL PRESETS
// =============================================================================

export const CachePresets = {
  // No caching
  noCache: {
    noCache: true,
    noStore: true,
    mustRevalidate: true,
  } as CacheControl,
  
  // Private, short cache (user-specific data)
  privateShort: {
    private: true,
    maxAge: 60,
    staleWhileRevalidate: 30,
  } as CacheControl,
  
  // Private, medium cache
  privateMedium: {
    private: true,
    maxAge: 300,
    staleWhileRevalidate: 60,
  } as CacheControl,
  
  // Public, short cache (frequently changing data)
  publicShort: {
    public: true,
    maxAge: 60,
    sMaxAge: 120,
    staleWhileRevalidate: 60,
  } as CacheControl,
  
  // Public, medium cache (lists, search results)
  publicMedium: {
    public: true,
    maxAge: 300,
    sMaxAge: 600,
    staleWhileRevalidate: 300,
  } as CacheControl,
  
  // Public, long cache (reference data)
  publicLong: {
    public: true,
    maxAge: 3600,
    sMaxAge: 7200,
    staleWhileRevalidate: 1800,
  } as CacheControl,
  
  // Immutable (static assets)
  immutable: {
    public: true,
    maxAge: 31536000, // 1 year
    immutable: true,
  } as CacheControl,
};

// =============================================================================
// CACHE CONTROL HEADER BUILDER
// =============================================================================

/**
 * Build Cache-Control header value
 */
export function buildCacheControl(options: CacheControl): string {
  const parts: string[] = [];
  
  if (options.public) parts.push('public');
  if (options.private) parts.push('private');
  if (options.noCache) parts.push('no-cache');
  if (options.noStore) parts.push('no-store');
  if (options.mustRevalidate) parts.push('must-revalidate');
  if (options.immutable) parts.push('immutable');
  
  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`);
  }
  if (options.sMaxAge !== undefined) {
    parts.push(`s-maxage=${options.sMaxAge}`);
  }
  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  if (options.staleIfError !== undefined) {
    parts.push(`stale-if-error=${options.staleIfError}`);
  }
  
  return parts.join(', ');
}

// =============================================================================
// ETAG GENERATION
// =============================================================================

/**
 * Generate ETag from data
 */
export function generateETag(data: unknown): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = createHash('md5').update(content).digest('hex');
  return `"${hash}"`;
}

/**
 * Generate weak ETag
 */
export function generateWeakETag(data: unknown): string {
  return `W/${generateETag(data)}`;
}

/**
 * Check if ETag matches
 */
export function checkETag(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  
  if (!ifNoneMatch) return false;
  
  // Handle multiple ETags
  const tags = ifNoneMatch.split(',').map(t => t.trim());
  return tags.includes(etag) || tags.includes('*');
}

// =============================================================================
// OPTIMIZED RESPONSE BUILDERS
// =============================================================================

/**
 * Create optimized JSON response
 */
export function optimizedResponse<T>(
  data: T,
  request: NextRequest,
  options: ResponseOptions = {}
): NextResponse {
  const {
    status = 200,
    cache = CachePresets.privateShort,
    etag = true,
    headers = {},
  } = options;
  
  // Generate ETag
  let etagValue: string | undefined;
  if (etag) {
    etagValue = generateETag(data);
    
    // Check If-None-Match
    if (checkETag(request, etagValue)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etagValue,
          'Cache-Control': buildCacheControl(cache),
        },
      });
    }
  }
  
  // Build response
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': buildCacheControl(cache),
    ...headers,
  };
  
  if (etagValue) {
    responseHeaders['ETag'] = etagValue;
  }
  
  // Add Vary header for proper caching
  responseHeaders['Vary'] = 'Accept-Encoding, Authorization';
  
  return NextResponse.json(data, {
    status,
    headers: responseHeaders,
  });
}

/**
 * Create paginated response with optimal caching
 */
export function paginatedResponse<T>(
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  },
  request: NextRequest,
  options: ResponseOptions = {}
): NextResponse {
  const cache = options.cache || (
    data.page === 1 
      ? CachePresets.publicShort 
      : CachePresets.privateShort
  );
  
  return optimizedResponse(
    {
      success: true,
      data: data.items,
      pagination: {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasNext: data.page < data.totalPages,
        hasPrevious: data.page > 1,
      },
    },
    request,
    { ...options, cache }
  );
}

/**
 * Stream large responses
 */
export function streamResponse<T>(
  generator: AsyncGenerator<T>,
  request: NextRequest
): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('['));
      let first = true;
      
      for await (const item of generator) {
        if (!first) {
          controller.enqueue(encoder.encode(','));
        }
        controller.enqueue(encoder.encode(JSON.stringify(item)));
        first = false;
      }
      
      controller.enqueue(encoder.encode(']'));
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

// =============================================================================
// CONDITIONAL REQUEST HANDLING
// =============================================================================

/**
 * Check If-Modified-Since header
 */
export function checkIfModifiedSince(
  request: NextRequest,
  lastModified: Date
): boolean {
  const ifModifiedSince = request.headers.get('if-modified-since');
  
  if (!ifModifiedSince) return false;
  
  const modifiedSinceDate = new Date(ifModifiedSince);
  return lastModified <= modifiedSinceDate;
}

/**
 * Create response with Last-Modified header
 */
export function responseWithLastModified<T>(
  data: T,
  lastModified: Date,
  request: NextRequest,
  options: ResponseOptions = {}
): NextResponse {
  // Check If-Modified-Since
  if (checkIfModifiedSince(request, lastModified)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': buildCacheControl(options.cache || CachePresets.publicMedium),
      },
    });
  }
  
  return optimizedResponse(data, request, {
    ...options,
    headers: {
      ...options.headers,
      'Last-Modified': lastModified.toUTCString(),
    },
  });
}

// =============================================================================
// RESPONSE SIZE OPTIMIZATION
// =============================================================================

/**
 * Omit null/undefined values from response
 */
export function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Flatten nested objects for smaller response
 */
export function flattenResponse<T extends Record<string, unknown>>(
  obj: T,
  prefix: string = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenResponse(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

/**
 * Pick specific fields from object
 */
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): Partial<T> {
  const result: Partial<T> = {};

  for (const field of fields) {
    if (field in obj) {
      (result as Record<string, unknown>)[field] = obj[field];
    }
  }

  return result;
}

/**
 * Transform response for minimal payload
 */
export function minimalResponse<T extends { id: string }>(
  items: T[],
  fields: (keyof T)[]
): Partial<T>[] {
  return items.map(item => {
    const result: Partial<T> = { id: item.id } as Partial<T>;
    for (const field of fields) {
      if (field in item) {
        result[field] = item[field];
      }
    }
    return result;
  });
}

// =============================================================================
// BATCH RESPONSE
// =============================================================================

/**
 * Batch multiple responses into single response
 */
export async function batchResponses<T extends Record<string, () => Promise<unknown>>>(
  requests: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(requests);
  const results = await Promise.all(entries.map(([, fn]) => fn()));

  const response = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
  entries.forEach(([key], index) => {
    (response as Record<string, unknown>)[key] = results[index];
  });

  return response;
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  CachePresets,
  buildCacheControl,
  generateETag,
  generateWeakETag,
  checkETag,
  optimizedResponse,
  paginatedResponse,
  streamResponse,
  checkIfModifiedSince,
  responseWithLastModified,
  omitEmpty,
  flattenResponse,
  pickFields,
  minimalResponse,
  batchResponses,
};
