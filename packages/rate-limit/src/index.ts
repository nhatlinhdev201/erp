/**
 * @linkk/rate-limit
 * Rate limiting package for L-ERP using Redis and flexible strategies
 */

// Main exports
export { RateLimiter, createRateLimiter, createRateLimiterWithStrategy } from './limiter';

// Middleware exports
export {
  withRateLimit,
  rateLimitMiddleware,
  createRateLimitMiddleware,
  createPathBasedRateLimiter,
  defaultKeyGenerator,
} from './middleware';

// Strategy exports
export {
  FixedWindowStrategy,
  SlidingWindowStrategy,
  TokenBucketStrategy,
  createStrategy,
} from './strategies';

// Type exports
export type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStrategy,
  IRateLimiter,
  IRateLimitStrategy,
  KeyGenerator,
  MiddlewareConfig,
  AdvancedRateLimitConfig,
} from './types';

export { RateLimitStrategy } from './types';

// Constants exports
export {
  PUBLIC_TIER,
  AUTHENTICATED_TIER,
  ADMIN_TIER,
  WEBHOOK_TIER,
  DEFAULT_CONFIG,
  REDIS_PREFIXES,
  HTTP_STATUS,
  DEFAULT_RATE_LIMIT_MESSAGE,
  DEFAULT_RATE_LIMIT_MESSAGE_EN,
} from './constants';
