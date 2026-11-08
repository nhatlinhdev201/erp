// =============================================================================
// L-ERP MRP - RESILIENCE MODULE
// Circuit breaker, retry logic, timeout, fallbacks
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

import { logger } from '@/lib/logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // Failures before opening
  successThreshold?: number;      // Successes to close from half-open
  timeout?: number;               // Time to wait before half-open (ms)
  resetTimeout?: number;          // Time before auto-reset (ms)
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onFailure?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface TimeoutOptions {
  timeout: number;
  fallback?: () => unknown;
  onTimeout?: () => void;
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000,
      ...options,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.options.timeout!) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new CircuitBreakerError(
          `Circuit ${this.name} is OPEN`,
          this.state,
          this.options.timeout! - (Date.now() - this.lastFailureTime)
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.options.onSuccess?.();

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.transitionTo('CLOSED');
      }
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.options.onFailure?.(error);

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold!) {
      this.transitionTo('OPEN');
    }

    // Set auto-reset timer
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      if (this.state === 'OPEN') {
        this.transitionTo('HALF_OPEN');
      }
    }, this.options.resetTimeout!);
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
    }

    this.options.onStateChange?.(oldState, newState);
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public state: CircuitState,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// =============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// =============================================================================

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = () => true,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts || !retryableErrors(lastError)) {
        throw lastError;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = delay * 0.1 * Math.random();
      const actualDelay = Math.floor(delay + jitter);

      onRetry?.(attempt, lastError, actualDelay);
      
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}

/**
 * Decorator for retry
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

// =============================================================================
// TIMEOUT
// =============================================================================

export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeout, fallback, onTimeout } = options;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      if (fallback) {
        resolve(fallback() as T);
      } else {
        reject(new TimeoutError(`Operation timed out after ${timeout}ms`));
      }
    }, timeout);

    operation()
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Decorator for timeout
 */
export function Timeout(ms: number) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return withTimeout(() => originalMethod.apply(this, args), { timeout: ms });
    };

    return descriptor;
  };
}

// =============================================================================
// FALLBACK
// =============================================================================

export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: T | (() => T | Promise<T>),
  options: { logError?: boolean } = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (options.logError) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'resilience', operation: 'withFallback' });
    }
    return typeof fallback === 'function' ? (fallback as () => T | Promise<T>)() : fallback;
  }
}

// =============================================================================
// BULKHEAD (Concurrency Limiter)
// =============================================================================

export class Bulkhead {
  private running = 0;
  private queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

  constructor(
    private maxConcurrent: number,
    private maxQueue: number = 100
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    
    try {
      return await operation();
    } finally {
      this.release();
    }
  }

  private async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }

    if (this.queue.length >= this.maxQueue) {
      throw new BulkheadError('Bulkhead queue is full');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  private release(): void {
    this.running--;
    
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next.resolve();
    }
  }

  getStats(): { running: number; queued: number; available: number } {
    return {
      running: this.running,
      queued: this.queue.length,
      available: Math.max(0, this.maxConcurrent - this.running),
    };
  }
}

export class BulkheadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkheadError';
  }
}

// =============================================================================
// RATE LIMITER (Token Bucket)
// =============================================================================

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(tokens = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  async acquireOrWait(tokens = 1): Promise<void> {
    while (!(await this.acquire(tokens))) {
      // Wait for token to be available
      const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.max(100, waitTime)));
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// =============================================================================
// CACHE WITH FALLBACK
// =============================================================================

export class CacheWithFallback<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  constructor(private defaultTTL: number = 60000) {}

  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; fallback?: T } = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, fallback } = options;
    
    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      // Fetch fresh data
      const value = await fetcher();
      this.cache.set(key, { value, expiry: Date.now() + ttl });
      return value;
    } catch (error) {
      // Return stale cache if available
      if (cached) {
        logger.warn(`Using stale cache for ${key} due to error`, { context: 'resilience', error: String(error) });
        return cached.value;
      }
      
      // Return fallback if provided
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw error;
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// =============================================================================
// GRACEFUL DEGRADATION
// =============================================================================

export interface DegradationLevel {
  name: string;
  condition: () => boolean;
  actions: () => void;
}

export class GracefulDegradation {
  private currentLevel = 0;
  private levels: DegradationLevel[] = [];

  addLevel(level: DegradationLevel): this {
    this.levels.push(level);
    return this;
  }

  check(): void {
    // Check if we need to degrade further
    for (let i = this.currentLevel; i < this.levels.length; i++) {
      if (this.levels[i].condition()) {
        this.degrade(i);
        return;
      }
    }

    // Check if we can recover
    for (let i = this.currentLevel - 1; i >= 0; i--) {
      if (!this.levels[i + 1]?.condition()) {
        this.recover(i);
      }
    }
  }

  private degrade(level: number): void {
    if (level > this.currentLevel) {
      this.currentLevel = level;
      this.levels[level].actions();
    }
  }

  private recover(level: number): void {
    if (level < this.currentLevel) {
      this.currentLevel = level;
    }
  }

  getCurrentLevel(): { level: number; name: string } {
    return {
      level: this.currentLevel,
      name: this.levels[this.currentLevel]?.name || 'Normal',
    };
  }
}

// =============================================================================
// HEALTH CHECK AGGREGATOR
// =============================================================================

export interface HealthCheck {
  name: string;
  check: () => Promise<{ healthy: boolean; message?: string; latency?: number }>;
  critical?: boolean;
  timeout?: number;
}

export class HealthCheckAggregator {
  private checks: HealthCheck[] = [];

  addCheck(check: HealthCheck): this {
    this.checks.push(check);
    return this;
  }

  async runAll(): Promise<{
    healthy: boolean;
    checks: Array<{
      name: string;
      healthy: boolean;
      message?: string;
      latency?: number;
    }>;
  }> {
    const results = await Promise.all(
      this.checks.map(async (check) => {
        const start = Date.now();
        try {
          const result = await withTimeout(check.check, {
            timeout: check.timeout || 5000,
          });
          return {
            name: check.name,
            ...result,
            latency: result.latency || Date.now() - start,
          };
        } catch (error) {
          return {
            name: check.name,
            healthy: false,
            message: (error as Error).message,
            latency: Date.now() - start,
          };
        }
      })
    );

    const healthy = results.every(
      (r, i) => r.healthy || !this.checks[i].critical
    );

    return { healthy, checks: results };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  CircuitBreaker,
  CircuitBreakerError,
  withRetry,
  Retry,
  withTimeout,
  Timeout,
  TimeoutError,
  withFallback,
  Bulkhead,
  BulkheadError,
  TokenBucket,
  CacheWithFallback,
  GracefulDegradation,
  HealthCheckAggregator,
};
