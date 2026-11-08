// =============================================================================
// L-ERP MRP - HEALTH CHECK UTILITIES
// Liveness, Readiness, and Dependency Health Checks
// =============================================================================

import { prisma } from '@/lib/prisma';
import * as os from 'os';
import * as fs from 'fs';

// =============================================================================
// TYPES
// =============================================================================

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  details?: Record<string, unknown>;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  version: process.env.APP_VERSION || '1.0.0',
  startTime: Date.now(),
};

// =============================================================================
// INDIVIDUAL HEALTH CHECKS
// =============================================================================

/**
 * Check database connectivity
 */
export async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      name: 'database',
      status: 'pass',
      message: 'PostgreSQL is reachable',
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    return {
      name: 'database',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
      duration: Date.now() - start,
    };
  }
}

/**
 * Check Redis connectivity
 * Note: Redis disabled for Render compatibility - using in-memory cache
 */
export async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();

  // Redis intentionally disabled - using in-memory cache for Render compatibility
  return {
    name: 'redis',
    status: 'pass',
    message: 'Using in-memory cache (Redis disabled)',
    duration: Date.now() - start,
    details: {
      mode: 'in-memory',
      reason: 'Render free tier does not support Redis',
    },
  };
}

/**
 * Check S3/Storage connectivity
 */
export async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Check if S3 is configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET) {
      return {
        name: 'storage',
        status: 'warn',
        message: 'S3 not configured',
        duration: Date.now() - start,
      };
    }
    
    // S3 check disabled in build - would need @aws-sdk installed
    return {
      name: 'storage',
      status: 'warn',
      message: 'S3 check skipped (SDK not installed)',
      duration: Date.now() - start,
    };
  } catch (error: unknown) {
    return {
      name: 'storage',
      status: 'warn',
      message: error instanceof Error ? error.message : 'S3 connection failed',
      duration: Date.now() - start,
    };
  }
}

/**
 * Check memory usage
 */
export function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const rssMB = Math.round(used.rss / 1024 / 1024);
  
  // Warn if heap usage > 80%
  const heapPercentage = (used.heapUsed / used.heapTotal) * 100;
  const status = heapPercentage > 90 ? 'fail' : heapPercentage > 80 ? 'warn' : 'pass';
  
  return {
    name: 'memory',
    status,
    message: `Heap: ${heapUsedMB}/${heapTotalMB}MB (${heapPercentage.toFixed(1)}%), RSS: ${rssMB}MB`,
    details: {
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      rss: used.rss,
      external: used.external,
    },
  };
}

/**
 * Check CPU usage (simplified)
 */
export function checkCPU(): HealthCheck {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const numCPUs = cpus.length;
  
  // Normalize load average by number of CPUs
  const normalizedLoad = loadAvg[0] / numCPUs;
  const status = normalizedLoad > 0.9 ? 'fail' : normalizedLoad > 0.7 ? 'warn' : 'pass';
  
  return {
    name: 'cpu',
    status,
    message: `Load: ${loadAvg[0].toFixed(2)} (1m), ${loadAvg[1].toFixed(2)} (5m), ${loadAvg[2].toFixed(2)} (15m)`,
    details: {
      loadAverage: loadAvg,
      cpuCount: numCPUs,
      normalizedLoad,
    },
  };
}

/**
 * Check disk usage (if applicable)
 */
export function checkDisk(): HealthCheck {
  try {
    // Check temp directory
    const tempDir = process.env.TEMP || '/tmp';
    const stats = fs.statfsSync(tempDir);
    
    const totalGB = (stats.blocks * stats.bsize) / (1024 * 1024 * 1024);
    const freeGB = (stats.bfree * stats.bsize) / (1024 * 1024 * 1024);
    const usedPercentage = ((totalGB - freeGB) / totalGB) * 100;
    
    const status = usedPercentage > 95 ? 'fail' : usedPercentage > 85 ? 'warn' : 'pass';
    
    return {
      name: 'disk',
      status,
      message: `${freeGB.toFixed(1)}GB free of ${totalGB.toFixed(1)}GB (${usedPercentage.toFixed(1)}% used)`,
      details: {
        totalGB,
        freeGB,
        usedPercentage,
      },
    };
  } catch (error) {
    return {
      name: 'disk',
      status: 'warn',
      message: 'Unable to check disk usage',
    };
  }
}

// =============================================================================
// AGGREGATE HEALTH CHECKS
// =============================================================================

/**
 * Liveness check - is the application running?
 * Used by Kubernetes liveness probe
 */
export function checkLiveness(): HealthStatus {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.version,
    uptime: Math.floor((Date.now() - config.startTime) / 1000),
    checks: [],
  };
}

/**
 * Readiness check - is the application ready to serve traffic?
 * Used by Kubernetes readiness probe
 */
export async function checkReadiness(): Promise<HealthStatus> {
  const checks: HealthCheck[] = [];
  
  // Check critical dependencies
  checks.push(await checkDatabase());
  checks.push(await checkRedis());
  checks.push(checkMemory());
  
  // Determine overall status
  const hasFailure = checks.some(c => c.status === 'fail');
  const hasWarning = checks.some(c => c.status === 'warn');
  
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasFailure) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version: config.version,
    uptime: Math.floor((Date.now() - config.startTime) / 1000),
    checks,
  };
}

/**
 * Full health check - comprehensive status
 * Used for monitoring dashboards
 */
export async function checkHealth(): Promise<HealthStatus> {
  const checks: HealthCheck[] = [];
  
  // Run all checks in parallel
  const [database, redis, storage] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
  ]);
  
  checks.push(database);
  checks.push(redis);
  checks.push(storage);
  checks.push(checkMemory());
  checks.push(checkCPU());
  checks.push(checkDisk());
  
  // Determine overall status
  const hasFailure = checks.some(c => c.status === 'fail');
  const hasWarning = checks.some(c => c.status === 'warn');
  
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasFailure) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version: config.version,
    uptime: Math.floor((Date.now() - config.startTime) / 1000),
    checks,
  };
}

// =============================================================================
// API RESPONSE HELPERS
// =============================================================================

/**
 * Get HTTP status code based on health status
 */
export function getHealthHttpStatus(health: HealthStatus): number {
  switch (health.status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 200; // Still serving traffic
    case 'unhealthy':
      return 503;
    default:
      return 500;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  checkLiveness,
  checkReadiness,
  checkHealth,
  checkDatabase,
  checkRedis,
  checkStorage,
  checkMemory,
  checkCPU,
  checkDisk,
  getHealthHttpStatus,
};
