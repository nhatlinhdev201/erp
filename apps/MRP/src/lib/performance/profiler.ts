// =============================================================================
// L-ERP MRP - PERFORMANCE MONITORING
// Query profiling, slow query detection, and performance metrics
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

import { logger } from '@/lib/logger';

export interface QueryProfile {
  query: string;
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
  params?: Record<string, unknown>;
  result?: {
    rowCount?: number;
    cached?: boolean;
  };
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalRequests: number;
  slowQueries: number;
  cacheHitRate: number;
}

export interface SlowQueryReport {
  query: string;
  avgDuration: number;
  maxDuration: number;
  count: number;
  lastOccurred: Date;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  slowQueryThreshold: 1000, // ms
  maxProfiledQueries: 10000,
  enableProfiling: process.env.NODE_ENV !== 'production' || process.env.ENABLE_PROFILING === 'true',
};

// =============================================================================
// QUERY PROFILER
// =============================================================================

class QueryProfiler {
  private profiles: QueryProfile[] = [];
  private slowQueries: Map<string, SlowQueryReport> = new Map();
  private responseTimings: number[] = [];

  /**
   * Record a query profile
   */
  record(profile: QueryProfile): void {
    if (!config.enableProfiling) return;

    // Keep limited history
    if (this.profiles.length >= config.maxProfiledQueries) {
      this.profiles.shift();
    }

    this.profiles.push(profile);
    this.responseTimings.push(profile.duration);

    // Track slow queries
    if (profile.duration > config.slowQueryThreshold) {
      this.trackSlowQuery(profile);
    }
  }

  /**
   * Track slow query
   */
  private trackSlowQuery(profile: QueryProfile): void {
    const key = `${profile.model}:${profile.operation}`;
    const existing = this.slowQueries.get(key);

    if (existing) {
      existing.count++;
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + profile.duration) / existing.count;
      existing.maxDuration = Math.max(existing.maxDuration, profile.duration);
      existing.lastOccurred = profile.timestamp;
    } else {
      this.slowQueries.set(key, {
        query: key,
        avgDuration: profile.duration,
        maxDuration: profile.duration,
        count: 1,
        lastOccurred: profile.timestamp,
      });
    }
  }

  /**
   * Get slow query report
   */
  getSlowQueries(limit: number = 20): SlowQueryReport[] {
    return Array.from(this.slowQueries.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  /**
   * Get recent queries
   */
  getRecentQueries(limit: number = 100): QueryProfile[] {
    return this.profiles.slice(-limit);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (this.responseTimings.length === 0) {
      return {
        avgResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        slowQueries: 0,
        cacheHitRate: 0,
      };
    }

    const sorted = [...this.responseTimings].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      avgResponseTime: sorted.reduce((a, b) => a + b, 0) / len,
      p50ResponseTime: sorted[Math.floor(len * 0.5)],
      p95ResponseTime: sorted[Math.floor(len * 0.95)],
      p99ResponseTime: sorted[Math.floor(len * 0.99)],
      totalRequests: len,
      slowQueries: this.slowQueries.size,
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const cached = this.profiles.filter(p => p.result?.cached).length;
    return this.profiles.length > 0 ? cached / this.profiles.length : 0;
  }

  /**
   * Clear profiles
   */
  clear(): void {
    this.profiles = [];
    this.slowQueries.clear();
    this.responseTimings = [];
  }
}

// Global profiler instance
export const queryProfiler = new QueryProfiler();

// =============================================================================
// TIMING UTILITIES
// =============================================================================

/**
 * Measure function execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Create a timer for manual timing
 */
export function createTimer(): { stop: () => number } {
  const start = performance.now();
  
  return {
    stop: () => performance.now() - start,
  };
}

/**
 * Decorator for timing methods
 */
export function Timed(label?: string) {
  return function (
    target: { constructor: { name: string } },
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const methodLabel = label || `${target.constructor.name}.${propertyKey}`;
      const { result } = await measureTime(
        () => originalMethod.apply(this, args),
        methodLabel
      );

      return result;
    };

    return descriptor;
  };
}

// =============================================================================
// PRISMA MIDDLEWARE FOR PROFILING
// =============================================================================

/**
 * Prisma middleware for query profiling
 */
interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args?: Record<string, unknown>;
}

export function prismaProfilingMiddleware() {
  return async (params: PrismaMiddlewareParams, next: (params: PrismaMiddlewareParams) => Promise<unknown>) => {
    const start = performance.now();
    const result = await next(params);
    const duration = performance.now() - start;

    queryProfiler.record({
      query: `${params.model}.${params.action}`,
      model: params.model || 'unknown',
      operation: params.action,
      duration,
      timestamp: new Date(),
      params: config.enableProfiling ? params.args : undefined,
      result: {
        rowCount: Array.isArray(result) ? result.length : 1,
      },
    });

    // Log slow queries
    if (duration > config.slowQueryThreshold) {
      logger.warn(`[SLOW QUERY] ${params.model}.${params.action}: ${duration.toFixed(2)}ms`, { context: 'profiler', args: config.enableProfiling ? params.args : undefined });
    }

    return result;
  };
}

// =============================================================================
// API MIDDLEWARE FOR RESPONSE TIMING
// =============================================================================

/**
 * Response timing header middleware
 */
export function responseTimingMiddleware() {
  return async (
    request: Request,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> => {
    const start = performance.now();
    const response = await handler(request);
    const duration = performance.now() - start;

    // Clone response to add header
    const headers = new Headers(response.headers);
    headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    headers.set('Server-Timing', `total;dur=${duration.toFixed(2)}`);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// =============================================================================
// MEMORY PROFILING
// =============================================================================

/**
 * Get memory usage statistics
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  
  return {
    heapUsed: formatBytes(usage.heapUsed),
    heapTotal: formatBytes(usage.heapTotal),
    external: formatBytes(usage.external),
    rss: formatBytes(usage.rss),
    heapUsedRaw: usage.heapUsed,
    heapTotalRaw: usage.heapTotal,
    percentUsed: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(1),
  };
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Detect memory leaks (simple heuristic)
 */
export function checkMemoryLeak(): { warning: boolean; message: string } {
  const usage = process.memoryUsage();
  const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  if (heapPercent > 90) {
    return {
      warning: true,
      message: `High memory usage: ${heapPercent.toFixed(1)}% of heap used`,
    };
  }
  
  return {
    warning: false,
    message: `Memory OK: ${heapPercent.toFixed(1)}% of heap used`,
  };
}

// =============================================================================
// PERFORMANCE REPORT
// =============================================================================

/**
 * Generate comprehensive performance report
 */
export function generatePerformanceReport() {
  const metrics = queryProfiler.getMetrics();
  const memory = getMemoryUsage();
  const slowQueries = queryProfiler.getSlowQueries(10);
  const memoryCheck = checkMemoryLeak();

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: metrics.totalRequests,
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      p95ResponseTime: `${metrics.p95ResponseTime.toFixed(2)}ms`,
      p99ResponseTime: `${metrics.p99ResponseTime.toFixed(2)}ms`,
      slowQueryCount: metrics.slowQueries,
      cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    },
    memory: {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      percentUsed: `${memory.percentUsed}%`,
      warning: memoryCheck.warning,
    },
    slowQueries: slowQueries.map(q => ({
      query: q.query,
      avgDuration: `${q.avgDuration.toFixed(2)}ms`,
      maxDuration: `${q.maxDuration.toFixed(2)}ms`,
      count: q.count,
    })),
    recommendations: generateRecommendations(metrics, memory, slowQueries),
  };
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(
  metrics: PerformanceMetrics,
  memory: ReturnType<typeof getMemoryUsage>,
  slowQueries: SlowQueryReport[]
): string[] {
  const recommendations: string[] = [];

  // Response time recommendations
  if (metrics.p95ResponseTime > 500) {
    recommendations.push('P95 response time is high. Consider adding caching or optimizing queries.');
  }

  // Cache recommendations
  if (metrics.cacheHitRate < 0.5) {
    recommendations.push('Cache hit rate is low. Review caching strategy for frequently accessed data.');
  }

  // Memory recommendations
  if (parseFloat(memory.percentUsed) > 80) {
    recommendations.push('Memory usage is high. Consider increasing heap size or optimizing memory usage.');
  }

  // Slow query recommendations
  if (slowQueries.length > 0) {
    const topSlow = slowQueries[0];
    recommendations.push(
      `Optimize slow query "${topSlow.query}" (avg ${topSlow.avgDuration.toFixed(0)}ms, ${topSlow.count} occurrences)`
    );
  }

  // Index recommendations - query field is formatted as "model:operation"
  if (slowQueries.some(q => q.query.includes('findMany'))) {
    recommendations.push('Consider adding database indexes for frequently filtered columns.');
  }

  return recommendations;
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  queryProfiler,
  measureTime,
  createTimer,
  Timed,
  prismaProfilingMiddleware,
  responseTimingMiddleware,
  getMemoryUsage,
  checkMemoryLeak,
  generatePerformanceReport,
};
