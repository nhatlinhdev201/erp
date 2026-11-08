// src/lib/security/rate-limiter.ts
// Rate limiting utility for L-ERP MRP System
// Uses in-memory store (Redis disabled for Render compatibility)

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/monitoring/logger";

// Check if running in test environment
function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' ||
         process.env.PLAYWRIGHT_TEST === 'true' ||
         process.env.E2E_TEST === 'true' ||
         process.env.SKIP_RATE_LIMIT === 'true';
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, record] of entries) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const {
    windowMs = 60000,
    maxRequests = 100,
    keyPrefix = "rl",
  } = config;

  // Skip rate limiting in test environment
  if (isTestEnvironment()) {
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
      limit: maxRequests,
    };
  }

  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  try {
    let record = rateLimitStore.get(key);

    // Create new window if doesn't exist or expired
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, record);

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: record.resetAt,
        limit: maxRequests,
      };
    }

    // Increment count
    record.count++;
    const allowed = record.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - record.count);

    if (!allowed) {
      logger.security({
        type: 'rate_limited',
        ip: identifier,
        details: `Request count: ${record.count}/${maxRequests}`,
      });
    }

    return {
      allowed,
      remaining,
      resetTime: record.resetAt,
      limit: maxRequests,
    };
  } catch (error) {
    const err = error as Error;
    logger.error("Rate limit check failed", { error: err.message, stack: err.stack });
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: now + windowMs,
      limit: maxRequests,
    };
  }
}

// Middleware helper
export async function rateLimitMiddleware(
  req: NextRequest,
  config?: Partial<RateLimitConfig>
): Promise<NextResponse | null> {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown";
  const identifier = `ip:${ip}`;

  const defaultConfig: RateLimitConfig = {
    windowMs: 60000,
    maxRequests: 100,
    ...config,
  };

  const result = await rateLimit(identifier, defaultConfig);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetTime.toString(),
          "Retry-After": Math.ceil(
            (result.resetTime - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  return null;
}

// API route rate limiting configurations
export const rateLimitConfigs = {
  api: { windowMs: 60000, maxRequests: 100 },
  auth: { windowMs: 60000, maxRequests: 10 },
  login: { windowMs: 300000, maxRequests: 5 },
  export: { windowMs: 60000, maxRequests: 5 },
  ai: { windowMs: 60000, maxRequests: 20 },
  dashboard: { windowMs: 60000, maxRequests: 60 },
  list: { windowMs: 60000, maxRequests: 120 },
  write: { windowMs: 60000, maxRequests: 30 },
};

// ============================================
// GRACEFUL DEGRADATION
// ============================================

interface DegradationConfig {
  enabled: boolean;
  thresholds: {
    warning: number;
    critical: number;
  };
  actions: {
    warning: () => void;
    critical: () => void;
  };
}

const defaultDegradationConfig: DegradationConfig = {
  enabled: true,
  thresholds: {
    warning: 70,
    critical: 90,
  },
  actions: {
    warning: () => {
      logger.warn("Rate limit warning threshold reached");
    },
    critical: () => {
      logger.error("Rate limit critical threshold reached");
    },
  },
};

export async function rateLimitWithDegradation(
  identifier: string,
  config: RateLimitConfig,
  degradation: Partial<DegradationConfig> = {}
): Promise<RateLimitResult & { degradationLevel: "normal" | "warning" | "critical" }> {
  const result = await rateLimit(identifier, config);
  const degradationConfig = { ...defaultDegradationConfig, ...degradation };

  const usagePercent = ((config.maxRequests - result.remaining) / config.maxRequests) * 100;
  let degradationLevel: "normal" | "warning" | "critical" = "normal";

  if (degradationConfig.enabled) {
    if (usagePercent >= degradationConfig.thresholds.critical) {
      degradationLevel = "critical";
      degradationConfig.actions.critical();
    } else if (usagePercent >= degradationConfig.thresholds.warning) {
      degradationLevel = "warning";
      degradationConfig.actions.warning();
    }
  }

  return { ...result, degradationLevel };
}

// Higher-order function for API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<RateLimitConfig>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimitMiddleware(req, config);
    if (rateLimitResponse) return rateLimitResponse;
    return handler(req);
  };
}
