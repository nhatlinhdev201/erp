// =============================================================================
// L-ERP MRP - RATE LIMITER (Gate 5.2)
// Upstash Redis-based rate limiting with in-memory fallback
// =============================================================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// =============================================================================
// ENVIRONMENT CHECKS
// =============================================================================

function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' ||
         process.env.PLAYWRIGHT_TEST === 'true' ||
         process.env.E2E_TEST === 'true' ||
         process.env.SKIP_RATE_LIMIT === 'true';
}

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// =============================================================================
// IN-MEMORY SLIDING WINDOW RATE LIMITER (fallback when Redis unavailable)
// =============================================================================

interface InMemoryLimiterConfig {
  limit: number;        // Max requests per window
  windowMs: number;     // Window size in ms
  maxTokens?: number;   // Max tracked tokens (LRU eviction)
}

/**
 * Simple in-memory sliding window rate limiter.
 * Uses a Map with periodic cleanup. Not suitable for multi-instance deployments
 * (use Redis for that), but provides protection in single-instance / dev mode.
 */
function createInMemoryLimiter(config: InMemoryLimiterConfig) {
  const store = new Map<string, number[]>();
  const maxTokens = config.maxTokens ?? 10_000;

  // Periodic cleanup every 2 minutes to prevent memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const cutoff = now - config.windowMs;
    for (const [key, timestamps] of store) {
      const valid = timestamps.filter(ts => ts > cutoff);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }, 120_000);

  // Allow GC if module is unloaded
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }

  return {
    check(token: string): { success: boolean; limit: number; remaining: number; reset: number } {
      const now = Date.now();
      const cutoff = now - config.windowMs;

      // Get and filter timestamps
      const timestamps = (store.get(token) || []).filter(ts => ts > cutoff);

      if (timestamps.length >= config.limit) {
        const oldestValid = timestamps[0];
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: oldestValid + config.windowMs,
        };
      }

      // Add current request
      timestamps.push(now);
      store.set(token, timestamps);

      // LRU eviction if too many tokens
      if (store.size > maxTokens) {
        const firstKey = store.keys().next().value;
        if (firstKey) store.delete(firstKey);
      }

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - timestamps.length,
        reset: now + config.windowMs,
      };
    },
    reset(token: string) {
      store.delete(token);
    },
  };
}

// =============================================================================
// REDIS RATE LIMITERS (when Upstash is configured)
// =============================================================================

let redis: Redis | null = null;
let heavyEndpointLimiter: Ratelimit | null = null;
let writeEndpointLimiter: Ratelimit | null = null;
let readEndpointLimiter: Ratelimit | null = null;

if (hasRedis) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  heavyEndpointLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:heavy',
  });

  writeEndpointLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    analytics: true,
    prefix: 'ratelimit:write',
  });

  readEndpointLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    analytics: true,
    prefix: 'ratelimit:read',
  });
}

// =============================================================================
// IN-MEMORY FALLBACK LIMITERS (when Redis is NOT configured)
// =============================================================================

const memHeavyLimiter = createInMemoryLimiter({ limit: 60, windowMs: 60_000 });
const memWriteLimiter = createInMemoryLimiter({ limit: 120, windowMs: 60_000 });
const memReadLimiter = createInMemoryLimiter({ limit: 300, windowMs: 60_000 });
// Auth sub-limiters created on-demand via getAuthSubLimiter()

// =============================================================================
// IDENTIFIER EXTRACTION
// =============================================================================

/**
 * Extract identifier for rate limiting
 * Priority: userId (if authenticated) -> IP from x-forwarded-for -> x-real-ip
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp}`;

  return 'ip:127.0.0.1';
}

/**
 * Get IP-only identifier (for auth endpoints — always use IP, not userId)
 */
export function getIpIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp}`;

  return 'ip:127.0.0.1';
}

// =============================================================================
// 429 RESPONSE BUILDER
// =============================================================================

function build429Response(result: { limit: number; remaining: number; reset: number }): Response {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}

// =============================================================================
// PUBLIC API — RATE LIMIT CHECK FUNCTIONS
// =============================================================================

/**
 * Check rate limit for heavy endpoints (AI, OCR, import: 60 req/min)
 */
export async function checkHeavyEndpointLimit(
  request: Request,
  userId?: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  if (isTestEnvironment()) {
    return { success: true, limit: 9999, remaining: 9999, reset: 0 };
  }

  const identifier = getRateLimitIdentifier(request, userId);

  if (heavyEndpointLimiter) {
    const result = await heavyEndpointLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  // In-memory fallback
  const result = memHeavyLimiter.check(identifier);
  return {
    ...result,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

/**
 * Check rate limit for write endpoints (create, update: 120 req/min)
 * Returns null if allowed, or a 429 Response if rate limited
 */
export async function checkWriteEndpointLimit(
  request: Request,
  userId?: string
): Promise<Response | null> {
  if (isTestEnvironment()) return null;

  const identifier = getRateLimitIdentifier(request, userId);

  if (writeEndpointLimiter) {
    const result = await writeEndpointLimiter.limit(identifier);
    return result.success ? null : build429Response(result);
  }

  // In-memory fallback
  const result = memWriteLimiter.check(identifier);
  return result.success ? null : build429Response(result);
}

/**
 * Check rate limit for read endpoints (list, get: 300 req/min)
 * Returns null if allowed, or a 429 Response if rate limited
 */
export async function checkReadEndpointLimit(
  request: Request,
  userId?: string
): Promise<Response | null> {
  if (isTestEnvironment()) return null;

  const identifier = getRateLimitIdentifier(request, userId);

  if (readEndpointLimiter) {
    const result = await readEndpointLimiter.limit(identifier);
    return result.success ? null : build429Response(result);
  }

  // In-memory fallback
  const result = memReadLimiter.check(identifier);
  return result.success ? null : build429Response(result);
}

// Dedicated auth sub-limiters for different strictness levels
const authSubLimiters = new Map<number, ReturnType<typeof createInMemoryLimiter>>();

function getAuthSubLimiter(limit: number) {
  let limiter = authSubLimiters.get(limit);
  if (!limiter) {
    limiter = createInMemoryLimiter({ limit, windowMs: 60_000, maxTokens: 1000 });
    authSubLimiters.set(limit, limiter);
  }
  return limiter;
}

/**
 * Check rate limit for auth signin (strict: 5 req/min per IP)
 */
export async function checkSigninLimit(request: Request): Promise<Response | null> {
  if (isTestEnvironment()) return null;
  const identifier = getIpIdentifier(request);
  const result = getAuthSubLimiter(5).check(`signin:${identifier}`);
  return result.success ? null : build429Response(result);
}

/**
 * Check rate limit for auth signup / forgot-password (strict: 3 req/min per IP)
 */
export async function checkStrictAuthLimit(request: Request): Promise<Response | null> {
  if (isTestEnvironment()) return null;
  const identifier = getIpIdentifier(request);
  const result = getAuthSubLimiter(3).check(`strict-auth:${identifier}`);
  return result.success ? null : build429Response(result);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { heavyEndpointLimiter, writeEndpointLimiter, readEndpointLimiter };
export { createInMemoryLimiter };
