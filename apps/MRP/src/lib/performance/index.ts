// =============================================================================
// L-ERP MRP - PERFORMANCE MODULE
// Export all performance optimization utilities
// =============================================================================

// Query Optimization
export * from './query-optimizer';
export { default as queryOptimizer } from './query-optimizer';

// Caching
export * from './cache';
export { default as cache } from './cache';

// Response Optimization
export * from './response-optimizer';
export { default as responseOptimizer } from './response-optimizer';

// Profiling & Monitoring
export * from './profiler';
export { default as profiler } from './profiler';

// =============================================================================
// QUICK ACCESS EXPORTS
// =============================================================================

// Common cache operations
export {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheAside,
  invalidateTenantCache,
  CacheKeys,
  CACHE_TTL,
} from './cache';

// Common query helpers
export {
  getPaginationParams,
  createPaginatedResult,
  findManyWithCount,
  batchQueries,
  buildSearchConditions,
} from './query-optimizer';

// Common response helpers
export {
  optimizedResponse,
  paginatedResponse,
  CachePresets,
} from './response-optimizer';

// Profiling
export {
  queryProfiler,
  measureTime,
  generatePerformanceReport,
} from './profiler';
