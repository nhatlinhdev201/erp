// =============================================================================
// L-ERP MRP - OPTIMIZATION MODULE INDEX
// Central export for all optimization utilities
// =============================================================================

// Database optimization
export * from './database';
export { default as dbOptimize } from './database';

// API optimization
export * from './api';
export { default as apiOptimize } from './api';

// Data processing
export * from './processing';
export { default as dataProcess } from './processing';

// Resilience patterns
export * from './resilience';
export { default as resilience } from './resilience';

// Monitoring
export * from './monitoring';
export { default as monitoring } from './monitoring';

// =============================================================================
// QUICK SETUP FUNCTION
// =============================================================================

import { startMonitoring, setupDefaultAlerts } from './monitoring';
import { performanceTracker } from './monitoring';

/**
 * Initialize all optimization modules for production
 */
export function initializeOptimizations(options: {
  monitoringInterval?: number;
  slowQueryThreshold?: number;
  enableAlerts?: boolean;
} = {}): void {
  const {
    monitoringInterval = 30000,
    slowQueryThreshold = 1000,
    enableAlerts = true,
  } = options;

  // Set slow query thresholds
  performanceTracker.setSlowThreshold('database_query', slowQueryThreshold);
  performanceTracker.setSlowThreshold('api_request', 500);
  performanceTracker.setSlowThreshold('external_api', 2000);

  // Start monitoring
  startMonitoring(monitoringInterval);

  // Setup alerts
  if (enableAlerts) {
    setupDefaultAlerts();
  }

}

// =============================================================================
// PRE-CONFIGURED INSTANCES
// =============================================================================

import { CircuitBreaker, Bulkhead, TokenBucket } from './resilience';

// Database circuit breaker
export const databaseCircuit = new CircuitBreaker('database', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
});

// External API circuit breaker
export const externalApiCircuit = new CircuitBreaker('external_api', {
  failureThreshold: 3,
  successThreshold: 1,
  timeout: 60000,
});

// Database concurrency limiter
export const databaseBulkhead = new Bulkhead(20, 100);

// API rate limiter (100 req/s capacity, 10 req/s refill)
export const apiRateLimiter = new TokenBucket(100, 10);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

import { metrics, exportPrometheusMetrics } from './monitoring';
import { checkDatabaseHealth } from './database';

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, { healthy: boolean; latency?: number; message?: string }>;
  metrics: Record<string, any>;
}> {
  const components: Record<string, any> = {};

  // Check database
  const dbHealth = await checkDatabaseHealth();
  components.database = {
    healthy: dbHealth.healthy,
    latency: dbHealth.latency,
    message: dbHealth.error,
  };

  // Check circuits
  components.databaseCircuit = {
    healthy: databaseCircuit.getState() !== 'OPEN',
    message: `State: ${databaseCircuit.getState()}`,
  };

  components.externalApiCircuit = {
    healthy: externalApiCircuit.getState() !== 'OPEN',
    message: `State: ${externalApiCircuit.getState()}`,
  };

  // Determine overall status
  const allHealthy = Object.values(components).every(c => c.healthy);
  const anyUnhealthy = Object.values(components).some(c => !c.healthy);
  
  const status = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';

  return {
    status,
    components,
    metrics: metrics.getSummary(),
  };
}

/**
 * Export all metrics for monitoring systems
 */
export function getMetricsExport(format: 'prometheus' | 'json' = 'json'): string {
  if (format === 'prometheus') {
    return exportPrometheusMetrics();
  }
  return JSON.stringify(metrics.getSummary(), null, 2);
}

/**
 * Reset all optimization state (for testing)
 */
export function resetOptimizations(): void {
  metrics.reset();
  performanceTracker.clear();
  databaseCircuit.reset();
  externalApiCircuit.reset();
}
