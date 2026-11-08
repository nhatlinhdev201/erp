// =============================================================================
// L-ERP MRP - IN-MEMORY CACHE
// Drop-in replacement for Redis cache when Redis is not available
// =============================================================================

// Simple LRU Cache implementation
class LRUCache<T> {
  private cache: Map<string, { value: T; expireAt: number }>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deletePattern(pattern: string): number {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
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

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  ttl(key: string): number {
    const item = this.cache.get(key);
    if (!item) return -2; // Key doesn't exist
    const remaining = Math.floor((item.expireAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Cleanup expired entries
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now > item.expireAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

// =============================================================================
// CACHE INSTANCE
// =============================================================================

const memoryCache = new LRUCache<unknown>(5000);

// Periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000);
}

// =============================================================================
// CACHE KEY PATTERNS (Same as Redis version)
// =============================================================================

export const cacheKeys = {
  tenant: {
    info: (tenantId: string) => `tenant:${tenantId}:info`,
    features: (tenantId: string) => `tenant:${tenantId}:features`,
    limits: (tenantId: string) => `tenant:${tenantId}:limits`,
    parts: {
      list: (tenantId: string) => `tenant:${tenantId}:parts:list`,
      item: (tenantId: string, partId: string) => `tenant:${tenantId}:parts:${partId}`,
      byCategory: (tenantId: string, category: string) => `tenant:${tenantId}:parts:cat:${category}`,
      count: (tenantId: string) => `tenant:${tenantId}:parts:count`,
    },
    inventory: {
      list: (tenantId: string) => `tenant:${tenantId}:inventory:list`,
      item: (tenantId: string, partId: string) => `tenant:${tenantId}:inventory:${partId}`,
      lowStock: (tenantId: string) => `tenant:${tenantId}:inventory:lowstock`,
      value: (tenantId: string) => `tenant:${tenantId}:inventory:value`,
    },
    sales: {
      list: (tenantId: string) => `tenant:${tenantId}:sales:list`,
      item: (tenantId: string, orderId: string) => `tenant:${tenantId}:sales:${orderId}`,
      pending: (tenantId: string) => `tenant:${tenantId}:sales:pending`,
      monthly: (tenantId: string, month: string) => `tenant:${tenantId}:sales:monthly:${month}`,
    },
    production: {
      list: (tenantId: string) => `tenant:${tenantId}:production:list`,
      item: (tenantId: string, woId: string) => `tenant:${tenantId}:production:${woId}`,
      active: (tenantId: string) => `tenant:${tenantId}:production:active`,
      schedule: (tenantId: string, date: string) => `tenant:${tenantId}:production:schedule:${date}`,
    },
    dashboard: {
      kpis: (tenantId: string) => `tenant:${tenantId}:dashboard:kpis`,
      charts: (tenantId: string) => `tenant:${tenantId}:dashboard:charts`,
      alerts: (tenantId: string) => `tenant:${tenantId}:dashboard:alerts`,
    },
    mrp: {
      lastRun: (tenantId: string) => `tenant:${tenantId}:mrp:lastrun`,
      suggestions: (tenantId: string) => `tenant:${tenantId}:mrp:suggestions`,
    },
  },

  user: {
    session: (userId: string) => `user:${userId}:session`,
    preferences: (userId: string) => `user:${userId}:preferences`,
    notifications: (userId: string) => `user:${userId}:notifications`,
  },

  rateLimit: {
    api: (tenantId: string, endpoint: string) => `ratelimit:${tenantId}:api:${endpoint}`,
    user: (userId: string, action: string) => `ratelimit:user:${userId}:${action}`,
  },

  // Legacy keys
  dashboardStats: () => 'dashboard:stats',

  workOrders: (params: {
    status?: string | null;
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
    [key: string]: unknown;
  } = {}) =>
    `workorders:${params.status || 'all'}:page:${params.page || 1}:size:${params.pageSize || 20}:sort:${params.sortBy || 'date'}:${params.sortOrder || 'desc'}:q:${params.search || ''}`,

  salesOrders: (params: {
    status?: string | null;
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
    [key: string]: unknown;
  } = {}) =>
    `salesorders:${params.status || 'all'}:page:${params.page || 1}:size:${params.pageSize || 20}:sort:${params.sortBy || 'date'}:${params.sortOrder || 'desc'}:q:${params.search || ''}`,

  parts: (params: {
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
    category?: string | null;
    [key: string]: unknown;
  } = {}) =>
    `parts:page:${params.page || 1}:size:${params.pageSize || 20}:sort:${params.sortBy || 'partNumber'}:${params.sortOrder || 'asc'}:cat:${params.category || 'all'}:q:${params.search || ''}`,

  suppliers: (params: {
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
    [key: string]: unknown;
  } = {}) =>
    `suppliers:page:${params.page || 1}:size:${params.pageSize || 20}:sort:${params.sortBy || 'name'}:${params.sortOrder || 'asc'}:q:${params.search || ''}`,

  workOrder: (id: string) => `workorder:${id}`,
  salesOrder: (id: string) => `salesorder:${id}`,
  part: (id: string) => `part:${id}`,
};

// =============================================================================
// CACHE TTL SETTINGS
// =============================================================================

export const cacheTTL = {
  short: 60,
  medium: 300,
  long: 600,
  extended: 1800,
  hour: 3600,
  day: 86400,

  // Uppercase aliases
  SHORT: 60,
  MEDIUM: 300,
  LONG: 600,
  STANDARD: 300,
  HOUR: 3600,
  DAY: 86400,

  // Specific
  dashboard: 60,
  partsList: 300,
  inventory: 60,
  reports: 1800,
  userPrefs: 3600,
};

// =============================================================================
// CACHE PATTERNS
// =============================================================================

export const cachePatterns = {
  dashboard: (tenantId: string = '*') => `tenant:${tenantId}:dashboard:*`,
  parts: (tenantId: string = '*') => `tenant:${tenantId}:parts:*`,
  inventory: (tenantId: string = '*') => `tenant:${tenantId}:inventory:*`,
  sales: (tenantId: string = '*') => `tenant:${tenantId}:sales:*`,
  production: (tenantId: string = '*') => `tenant:${tenantId}:production:*`,
  mrp: (tenantId: string = '*') => `tenant:${tenantId}:mrp:*`,
  all: (tenantId: string = '*') => `tenant:${tenantId}:*`,
  // Legacy
  ALL_WORK_ORDERS: 'workorders:*',
  ALL_DASHBOARD: 'dashboard:*',
  ALL_PARTS: 'parts:*',
  ALL_INVENTORY: 'inventory:*',
};

// =============================================================================
// CACHE OPERATIONS
// =============================================================================

export async function getCache<T>(key: string): Promise<T | null> {
  return memoryCache.get(key) as T | null;
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = cacheTTL.medium
): Promise<boolean> {
  memoryCache.set(key, data, ttlSeconds);
  return true;
}

export async function deleteCache(key: string): Promise<boolean> {
  return memoryCache.delete(key);
}

export async function deleteCachePattern(pattern: string): Promise<number> {
  return memoryCache.deletePattern(pattern);
}

export async function invalidateTenantCache(tenantId: string): Promise<number> {
  return deleteCachePattern(`tenant:${tenantId}:*`);
}

export async function hasCache(key: string): Promise<boolean> {
  return memoryCache.has(key);
}

export async function getCacheTTL(key: string): Promise<number> {
  return memoryCache.ttl(key);
}

// =============================================================================
// CACHE-ASIDE PATTERN
// =============================================================================

export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = cacheTTL.medium
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  await setCache(key, data, ttlSeconds);
  return data;
}

export async function refreshCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = cacheTTL.medium
): Promise<T> {
  const data = await fetchFn();
  await setCache(key, data, ttlSeconds);
  return data;
}

// =============================================================================
// RATE LIMITING (In-memory)
// =============================================================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowSeconds * 1000),
    };
  }

  record.count++;
  return {
    allowed: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    resetAt: new Date(record.resetAt),
  };
}

export async function incrementRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return checkRateLimit(key, limit, windowSeconds);
}

// Cleanup rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, record] of entries) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000);
}

// =============================================================================
// DISTRIBUTED LOCKING (In-memory - single instance only)
// =============================================================================

const locks = new Map<string, number>();

export async function acquireLock(
  lockKey: string,
  ttlSeconds: number = 30
): Promise<boolean> {
  const key = `lock:${lockKey}`;
  const now = Date.now();
  const existing = locks.get(key);

  if (existing && now < existing) {
    return false; // Lock held
  }

  locks.set(key, now + ttlSeconds * 1000);
  return true;
}

export async function releaseLock(lockKey: string): Promise<boolean> {
  locks.delete(`lock:${lockKey}`);
  return true;
}

export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 30
): Promise<T | null> {
  const acquired = await acquireLock(lockKey, ttlSeconds);
  if (!acquired) return null;

  try {
    return await fn();
  } finally {
    await releaseLock(lockKey);
  }
}

// =============================================================================
// STATS
// =============================================================================

let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

// =============================================================================
// REDIS COMPATIBILITY LAYER
// =============================================================================

// Fake redis object for compatibility
export const redis = {
  get: () => memoryCache,
  isConnected: () => true, // Always "connected" for in-memory
  ping: async () => 'PONG',
  info: async () => 'In-memory cache (Redis disabled)',
  multi: () => ({ exec: async () => [] }),
  pipeline: () => ({
    incr: () => ({ exec: async () => [[null, 1]] }),
    ttl: () => ({ exec: async () => [[null, -1]] }),
    zremrangebyscore: () => ({}),
    zcard: () => ({}),
    zadd: () => ({}),
    expire: () => ({}),
    exec: async () => [],
  }),
  keys: async () => [],
  del: async () => 0,
  exists: async () => 0,
  expire: async () => true,
  ttl: async (key: string) => memoryCache.ttl(key),
  zadd: async () => 0,
  zremrangebyscore: async () => 0,
  zcard: async () => 0,
  setex: async () => 'OK',
  incr: async () => 1,
};

// =============================================================================
// MAIN CACHE OBJECT
// =============================================================================

export const cache = {
  get: getCache,
  set: setCache,
  del: deleteCache,
  delPattern: deleteCachePattern,
  deletePattern: deleteCachePattern,
  has: hasCache,
  ttl: getCacheTTL,
  aside: cacheAside,
  refresh: refreshCache,
  invalidateTenant: invalidateTenantCache,
  keys: cacheKeys,
  patterns: cachePatterns,
  TTL: cacheTTL,
  getStats: () => ({ ...cacheStats, size: memoryCache.size(), type: 'memory' }),
  resetStats: () => {
    cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export function getRedis() {
  // Return fake redis for compatibility
  return redis;
}

export default getRedis;
