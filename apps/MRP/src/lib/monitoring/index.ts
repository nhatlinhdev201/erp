// =============================================================================
// L-ERP MRP - MONITORING MODULE
// Export all monitoring utilities
// =============================================================================

// Note: Some modules require optional dependencies
// - prom-client for metrics (see lib/monitoring/metrics.ts)
// - winston for advanced logging (optional)

// Only export modules that don't require external dependencies
export * from './logger';
export * from './health';

// Default exports
export { default as logger } from './logger';
export { default as health } from './health';

// metrics.ts requires prom-client - import separately if needed:
// import metrics from '@/lib/monitoring/metrics'
