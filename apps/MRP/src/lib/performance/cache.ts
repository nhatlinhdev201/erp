// =============================================================================
// L-ERP MRP - ADVANCED CACHING LAYER
// Multi-tier caching with Redis and in-memory cache
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

export interface CacheOptions {
  ttl?: number;          // Time to live in seconds
  tags?: string[];       // Cache tags for invalidation
  staleWhileRevalidate?: number; // Serve stale while refreshing
  compress?: boolean;    // Compress large values
}

export interface CacheEntry<T> {
  value: T;
  expires: number;
  tags: string[];
  staleUntil?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  keys: number;
}

// =============================================================================
// DEFAULT TTL VALUES
// =============================================================================

export const CACHE_TTL = {
  // Very short - frequently changing data
  REALTIME: 5,           // 5 seconds
  
  // Short - session data, user state
  SHORT: 60,             // 1 minute
  
  // Medium - lists, search results
  MEDIUM: 300,           // 5 minutes
  
  // Long - reference data
  LONG: 1800,            // 30 minutes
  
  // Extended - rarely changing data
  EXTENDED: 3600,        // 1 hour
  
  // Static - almost never changes
  STATIC: 86400,         // 24 hours
};

// =============================================================================
// IN-MEMORY CACHE (LRU)
// =============================================================================

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private stats = { hits: 0, misses: 0 };

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check expiration
    if (Date.now() > entry.expires) {
      // Check stale-while-revalidate
      if (entry.staleUntil && Date.now() < entry.staleUntil) {
        this.stats.hits++;
        return entry.value;
      }
      
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.stats.hits++;
    return entry.value;
  }

  set(key: string, value: T, options: CacheOptions = {}): void {
    const { ttl = CACHE_TTL.MEDIUM, tags = [], staleWhileRevalidate } = options;
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    const entry: CacheEntry<T> = {
      value,
      expires: Date.now() + (ttl * 1000),
      tags,
      staleUntil: staleWhileRevalidate 
        ? Date.now() + ((ttl + staleWhileRevalidate) * 1000)
        : undefined,
    };
    
    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deleteByTag(tag: string): number {
    let deleted = 0;
    const entries = Array.from(this.cache.entries());

    for (const [key, entry] of entries) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  deleteByPattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deleted = 0;
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
      keys: this.cache.size,
    };
  }
}

// =============================================================================
// GLOBAL MEMORY CACHE INSTANCE
// =============================================================================

const memoryCache = new LRUCache<unknown>(5000);

// =============================================================================
// CACHE KEY BUILDERS
// =============================================================================

export const CacheKeys = {
  // Parts
  part: (id: string) => `part:${id}`,
  partList: (tenantId: string, filters: string) => `tenant:${tenantId}:parts:${filters}`,
  partCount: (tenantId: string) => `tenant:${tenantId}:parts:count`,
  
  // Inventory
  inventory: (partId: string, warehouseId: string) => `inventory:${partId}:${warehouseId}`,
  inventoryList: (tenantId: string, filters: string) => `tenant:${tenantId}:inventory:${filters}`,
  lowStock: (tenantId: string) => `tenant:${tenantId}:inventory:lowstock`,
  
  // Work Orders
  workOrder: (id: string) => `workorder:${id}`,
  workOrderList: (tenantId: string, filters: string) => `tenant:${tenantId}:workorders:${filters}`,
  workOrdersByStatus: (tenantId: string) => `tenant:${tenantId}:workorders:bystatus`,
  
  // Sales
  salesOrder: (id: string) => `salesorder:${id}`,
  salesOrderList: (tenantId: string, filters: string) => `tenant:${tenantId}:sales:${filters}`,
  
  // Dashboard
  dashboardKPIs: (tenantId: string) => `tenant:${tenantId}:dashboard:kpis`,
  dashboardCharts: (tenantId: string, chartType: string) => `tenant:${tenantId}:dashboard:${chartType}`,
  
  // MRP
  mrpSuggestions: (tenantId: string, runId: string) => `tenant:${tenantId}:mrp:${runId}:suggestions`,
  mrpLatest: (tenantId: string) => `tenant:${tenantId}:mrp:latest`,
  
  // Reference Data
  categories: (tenantId: string) => `tenant:${tenantId}:ref:categories`,
  warehouses: (tenantId: string) => `tenant:${tenantId}:ref:warehouses`,
  workCenters: (tenantId: string) => `tenant:${tenantId}:ref:workcenters`,
  
  // User
  userPreferences: (userId: string) => `user:${userId}:preferences`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
};

/**
 * Generate cache key from filters
 */
export function filtersToKey(filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .map(k => `${k}:${filters[k]}`)
    .join('|');
  
  // Create short hash
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// =============================================================================
// CACHE FUNCTIONS
// =============================================================================

/**
 * Get from cache (memory-first, then Redis if configured)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try memory cache first
  const memValue = memoryCache.get(key);
  if (memValue !== null) {
    return memValue as T;
  }
  
  // Redis support disabled - would need ioredis installed
  // To enable: npm install ioredis
  // Then import from '@/lib/cache/redis'
  
  return null;
}

/**
 * Set cache value (both memory and Redis)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = CACHE_TTL.MEDIUM, tags = [] } = options;
  
  // Set in memory cache
  memoryCache.set(key, value, { ttl, tags });
  
  // Redis support disabled - would need ioredis installed
}

/**
 * Delete from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  memoryCache.delete(key);
  
  // Redis support disabled - would need ioredis installed
}

/**
 * Delete by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  memoryCache.deleteByPattern(pattern);
  
  // Redis support disabled - would need ioredis installed
}

/**
 * Invalidate tenant cache
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await cacheDeletePattern(`tenant:${tenantId}:*`);
}

/**
 * Invalidate by tag
 */
export function invalidateByTag(tag: string): number {
  return memoryCache.deleteByTag(tag);
}

// =============================================================================
// CACHE-ASIDE PATTERN
// =============================================================================

/**
 * Cache-aside pattern with automatic refresh
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch from source
  const value = await fetchFn();
  
  // Store in cache
  await cacheSet(key, value, options);
  
  return value;
}

/**
 * Memoize function result
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic function wrapper requires flexible signature
export function memoize<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args);
    return cacheAside(key, () => fn(...args), options);
  }) as unknown as T;
}

// =============================================================================
// CACHE DECORATORS
// =============================================================================

/**
 * Method decorator for caching
 */
export function Cached(options: CacheOptions & { keyPrefix: string }) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const key = `${options.keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;

      return cacheAside(
        key,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

/**
 * Invalidate cache on mutation
 */
export function InvalidatesCache(patterns: string[]) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      // Invalidate cache patterns
      await Promise.all(patterns.map(p => cacheDeletePattern(p)));

      return result;
    };

    return descriptor;
  };
}

// =============================================================================
// PRELOADING & WARMING
// =============================================================================

/**
 * Preload commonly accessed data
 */
export async function warmCache(tenantId: string): Promise<void> {
  // Note: This function would preload reference data
  // Implementation depends on your data structure
  // Example:
  // const categories = await prisma.part.groupBy({ by: ['category'] });
  // await cacheSet(CacheKeys.categories(tenantId), categories, { ttl: CACHE_TTL.EXTENDED });
}

// =============================================================================
// CACHE STATS
// =============================================================================

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return memoryCache.getStats();
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  memoryCache.clear();
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  CACHE_TTL,
  CacheKeys,
  filtersToKey,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  invalidateTenantCache,
  invalidateByTag,
  cacheAside,
  memoize,
  Cached,
  InvalidatesCache,
  warmCache,
  getCacheStats,
  clearAllCache,
};
