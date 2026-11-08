// =============================================================================
// L-ERP MRP - CACHE LAYER
// Uses in-memory cache (Redis disabled for Render compatibility)
// =============================================================================

// Re-export everything from memory-cache
export * from './memory-cache';
export { default } from './memory-cache';

// Log that we're using memory cache
import { logger } from '@/lib/logger';
if (process.env.NODE_ENV !== 'test') {
  logger.info('[CACHE] Using in-memory cache (Redis disabled)');
}
