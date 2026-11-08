// =============================================================================
// L-ERP MRP - PROMETHEUS METRICS
// Application metrics for monitoring
// NOTE: Install prom-client: npm install prom-client
// =============================================================================

import { Registry, Counter, Histogram, Gauge, Summary, collectDefaultMetrics } from 'prom-client';

// =============================================================================
// REGISTRY
// =============================================================================

// Create a new registry
export const metricsRegistry = new Registry();

// Set default labels
metricsRegistry.setDefaultLabels({
  app: 'lerp-mrp',
  env: process.env.NODE_ENV || 'development',
});

// Collect default Node.js metrics
collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'rtr_mrp_',
});

// =============================================================================
// HTTP METRICS
// =============================================================================

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'rtr_mrp_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status', 'tenant'],
  registers: [metricsRegistry],
});

// HTTP request duration
export const httpRequestDuration = new Histogram({
  name: 'rtr_mrp_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status', 'tenant'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

// HTTP request size
export const httpRequestSize = new Histogram({
  name: 'rtr_mrp_http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'path'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [metricsRegistry],
});

// Active HTTP connections
export const httpActiveConnections = new Gauge({
  name: 'rtr_mrp_http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [metricsRegistry],
});

// =============================================================================
// DATABASE METRICS
// =============================================================================

// Database query counter
export const dbQueryTotal = new Counter({
  name: 'rtr_mrp_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'success'],
  registers: [metricsRegistry],
});

// Database query duration
export const dbQueryDuration = new Histogram({
  name: 'rtr_mrp_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [metricsRegistry],
});

// Database connection pool
export const dbConnectionPool = new Gauge({
  name: 'rtr_mrp_db_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['state'],
  registers: [metricsRegistry],
});

// =============================================================================
// CACHE METRICS
// =============================================================================

// Cache operations
export const cacheOperations = new Counter({
  name: 'rtr_mrp_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'],
  registers: [metricsRegistry],
});

// Cache hit rate
export const cacheHitRate = new Gauge({
  name: 'rtr_mrp_cache_hit_rate',
  help: 'Cache hit rate percentage',
  registers: [metricsRegistry],
});

// =============================================================================
// BUSINESS METRICS
// =============================================================================

// Active tenants
export const activeTenants = new Gauge({
  name: 'rtr_mrp_active_tenants',
  help: 'Number of active tenants',
  registers: [metricsRegistry],
});

// Active users
export const activeUsers = new Gauge({
  name: 'rtr_mrp_active_users',
  help: 'Number of active users',
  labelNames: ['tenant'],
  registers: [metricsRegistry],
});

// MRP runs
export const mrpRunsTotal = new Counter({
  name: 'rtr_mrp_runs_total',
  help: 'Total number of MRP runs',
  labelNames: ['tenant', 'status'],
  registers: [metricsRegistry],
});

// MRP run duration
export const mrpRunDuration = new Histogram({
  name: 'rtr_mrp_run_duration_seconds',
  help: 'MRP run duration in seconds',
  labelNames: ['tenant'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [metricsRegistry],
});

// Work orders
export const workOrdersTotal = new Counter({
  name: 'rtr_mrp_work_orders_total',
  help: 'Total number of work orders created',
  labelNames: ['tenant', 'status'],
  registers: [metricsRegistry],
});

// Work order status gauge
export const workOrdersByStatus = new Gauge({
  name: 'rtr_mrp_work_orders_by_status',
  help: 'Number of work orders by status',
  labelNames: ['tenant', 'status'],
  registers: [metricsRegistry],
});

// Quality metrics
export const qualityRecordsTotal = new Counter({
  name: 'rtr_mrp_quality_records_total',
  help: 'Total number of quality records',
  labelNames: ['tenant', 'result'],
  registers: [metricsRegistry],
});

// Inventory value
export const inventoryValue = new Gauge({
  name: 'rtr_mrp_inventory_value',
  help: 'Total inventory value',
  labelNames: ['tenant'],
  registers: [metricsRegistry],
});

// Low stock alerts
export const lowStockAlerts = new Gauge({
  name: 'rtr_mrp_low_stock_alerts',
  help: 'Number of low stock alerts',
  labelNames: ['tenant'],
  registers: [metricsRegistry],
});

// =============================================================================
// JOB METRICS
// =============================================================================

// Background jobs
export const jobsTotal = new Counter({
  name: 'rtr_mrp_jobs_total',
  help: 'Total number of background jobs',
  labelNames: ['queue', 'status'],
  registers: [metricsRegistry],
});

// Job duration
export const jobDuration = new Histogram({
  name: 'rtr_mrp_job_duration_seconds',
  help: 'Background job duration in seconds',
  labelNames: ['queue', 'job'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
  registers: [metricsRegistry],
});

// Jobs in queue
export const jobsInQueue = new Gauge({
  name: 'rtr_mrp_jobs_in_queue',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue'],
  registers: [metricsRegistry],
});

// =============================================================================
// ERROR METRICS
// =============================================================================

// Application errors
export const errorsTotal = new Counter({
  name: 'rtr_mrp_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'code', 'tenant'],
  registers: [metricsRegistry],
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Measure HTTP request duration
 */
export function measureHttpRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  tenant?: string
): void {
  const labels = { method, path, status: String(status), tenant: tenant || 'system' };
  
  httpRequestsTotal.inc(labels);
  httpRequestDuration.observe(labels, durationMs / 1000);
}

/**
 * Measure database query
 */
export function measureDbQuery(
  operation: string,
  model: string,
  success: boolean,
  durationMs: number
): void {
  dbQueryTotal.inc({ operation, model, success: String(success) });
  dbQueryDuration.observe({ operation, model }, durationMs / 1000);
}

/**
 * Record cache operation
 */
export function recordCacheOperation(
  operation: 'get' | 'set' | 'delete',
  hit: boolean
): void {
  cacheOperations.inc({ operation, result: hit ? 'hit' : 'miss' });
}

/**
 * Record error
 */
export function recordError(type: string, code: string, tenant?: string): void {
  errorsTotal.inc({ type, code, tenant: tenant || 'system' });
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Get metrics as JSON
 */
export async function getMetricsJson(): Promise<object> {
  return metricsRegistry.getMetricsAsJSON();
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Express/Next.js middleware for metrics
 */
/** Express-style request/response types for middleware */
interface MiddlewareRequest {
  method: string;
  url: string;
  path?: string;
  route?: { path?: string };
  headers: Record<string, string | string[] | undefined>;
}

interface MiddlewareResponse {
  statusCode: number;
  on: (event: string, listener: () => void) => void;
}

export function metricsMiddleware() {
  return async (req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) => {
    const start = Date.now();

    httpActiveConnections.inc();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const path = req.route?.path || req.path || req.url;
      const tenant = (req.headers['x-tenant-id'] as string | undefined) || 'unknown';

      measureHttpRequest(req.method, path, res.statusCode, duration, tenant);
      httpActiveConnections.dec();
    });

    next();
  };
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  registry: metricsRegistry,
  http: {
    requestsTotal: httpRequestsTotal,
    requestDuration: httpRequestDuration,
    activeConnections: httpActiveConnections,
  },
  db: {
    queryTotal: dbQueryTotal,
    queryDuration: dbQueryDuration,
    connectionPool: dbConnectionPool,
  },
  cache: {
    operations: cacheOperations,
    hitRate: cacheHitRate,
  },
  business: {
    activeTenants,
    activeUsers,
    mrpRunsTotal,
    mrpRunDuration,
    workOrdersTotal,
    workOrdersByStatus,
    qualityRecordsTotal,
    inventoryValue,
    lowStockAlerts,
  },
  jobs: {
    total: jobsTotal,
    duration: jobDuration,
    inQueue: jobsInQueue,
  },
  errors: errorsTotal,
  getMetrics,
  getMetricsJson,
  measureHttpRequest,
  measureDbQuery,
  recordCacheOperation,
  recordError,
  metricsMiddleware,
};
