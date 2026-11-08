// =============================================================================
// L-ERP MRP - MEMORY CACHE UNIT TESTS
// Tests for in-memory cache implementation
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  hasCache,
  getCacheTTL,
  cacheAside,
  refreshCache,
  checkRateLimit,
  incrementRateLimit,
  acquireLock,
  releaseLock,
  withLock,
  cache,
  cacheKeys,
  cacheTTL,
  cachePatterns,
} from '@/lib/cache/memory-cache';

// =============================================================================
// BASIC CACHE OPERATIONS TESTS
// =============================================================================

describe('Memory Cache - Basic Operations', () => {
  beforeEach(async () => {
    // Clear cache by deleting known test keys
    await deleteCache('test:key1');
    await deleteCache('test:key2');
    await deleteCache('test:json');
  });

  describe('setCache and getCache', () => {
    it('should set and get string values', async () => {
      await setCache('test:key1', 'value1', 60);
      const result = await getCache<string>('test:key1');
      expect(result).toBe('value1');
    });

    it('should set and get object values', async () => {
      const obj = { name: 'test', value: 123 };
      await setCache('test:json', obj, 60);
      const result = await getCache<typeof obj>('test:json');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent keys', async () => {
      const result = await getCache('nonexistent:key');
      expect(result).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      await setCache('test:key1', 'value1');
      const result = await getCache('test:key1');
      expect(result).toBe('value1');
    });
  });

  describe('deleteCache', () => {
    it('should delete existing keys', async () => {
      await setCache('test:key1', 'value1', 60);
      await deleteCache('test:key1');
      const result = await getCache('test:key1');
      expect(result).toBeNull();
    });

    it('should return true when deleting', async () => {
      await setCache('test:key1', 'value1', 60);
      const deleted = await deleteCache('test:key1');
      expect(deleted).toBe(true);
    });
  });

  describe('hasCache', () => {
    it('should return true for existing keys', async () => {
      await setCache('test:key1', 'value1', 60);
      const exists = await hasCache('test:key1');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await hasCache('nonexistent:key');
      expect(exists).toBe(false);
    });
  });

  describe('getCacheTTL', () => {
    it('should return TTL for existing keys', async () => {
      await setCache('test:key1', 'value1', 60);
      const ttl = await getCacheTTL('test:key1');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('should return -2 for non-existent keys', async () => {
      const ttl = await getCacheTTL('nonexistent:key');
      expect(ttl).toBe(-2);
    });
  });
});

// =============================================================================
// CACHE PATTERN DELETION TESTS
// =============================================================================

describe('Memory Cache - Pattern Operations', () => {
  beforeEach(async () => {
    await deleteCachePattern('pattern:*');
  });

  it('should delete keys by pattern', async () => {
    await setCache('pattern:user:1', 'a', 60);
    await setCache('pattern:user:2', 'b', 60);
    await setCache('other:key', 'c', 60);

    const deleted = await deleteCachePattern('pattern:user:*');
    expect(deleted).toBeGreaterThanOrEqual(0);

    const user1 = await getCache('pattern:user:1');
    const user2 = await getCache('pattern:user:2');
    expect(user1).toBeNull();
    expect(user2).toBeNull();
  });
});

// =============================================================================
// CACHE-ASIDE PATTERN TESTS
// =============================================================================

describe('Memory Cache - Cache-Aside Pattern', () => {
  beforeEach(async () => {
    await deleteCache('aside:test');
  });

  describe('cacheAside', () => {
    it('should fetch and cache data when not in cache', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { data: 'fetched' };
      };

      const result1 = await cacheAside('aside:test', fetchFn, 60);
      const result2 = await cacheAside('aside:test', fetchFn, 60);

      expect(result1).toEqual({ data: 'fetched' });
      expect(result2).toEqual({ data: 'fetched' });
      expect(fetchCount).toBe(1); // Should only fetch once
    });
  });

  describe('refreshCache', () => {
    it('should always fetch and update cache', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { count: fetchCount };
      };

      const result1 = await refreshCache('aside:test', fetchFn, 60);
      const result2 = await refreshCache('aside:test', fetchFn, 60);

      expect(result1).toEqual({ count: 1 });
      expect(result2).toEqual({ count: 2 });
      expect(fetchCount).toBe(2); // Should fetch twice
    });
  });
});

// =============================================================================
// RATE LIMITER TESTS
// =============================================================================

describe('Memory Cache - Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const key = `ratelimit:test:${Date.now()}`;

    const result1 = await checkRateLimit(key, 3, 60);
    const result2 = await checkRateLimit(key, 3, 60);
    const result3 = await checkRateLimit(key, 3, 60);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result3.allowed).toBe(true);
  });

  it('should block requests exceeding limit', async () => {
    const key = `ratelimit:block:${Date.now()}`;

    await checkRateLimit(key, 3, 60);
    await checkRateLimit(key, 3, 60);
    await checkRateLimit(key, 3, 60);
    const result = await checkRateLimit(key, 3, 60);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track remaining requests', async () => {
    const key = `ratelimit:remaining:${Date.now()}`;

    const result1 = await checkRateLimit(key, 3, 60);
    expect(result1.remaining).toBe(2);

    const result2 = await checkRateLimit(key, 3, 60);
    expect(result2.remaining).toBe(1);
  });

  it('should include resetAt timestamp', async () => {
    const key = `ratelimit:reset:${Date.now()}`;
    const result = await checkRateLimit(key, 3, 60);

    expect(result.resetAt).toBeInstanceOf(Date);
    expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('incrementRateLimit should work same as checkRateLimit', async () => {
    const key = `ratelimit:incr:${Date.now()}`;
    const result = await incrementRateLimit(key, 5, 60);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

// =============================================================================
// DISTRIBUTED LOCK TESTS
// =============================================================================

describe('Memory Cache - Distributed Lock', () => {
  it('should acquire lock', async () => {
    const key = `lock:test:${Date.now()}`;
    const acquired = await acquireLock(key, 30);
    expect(acquired).toBe(true);

    // Cleanup
    await releaseLock(key);
  });

  it('should prevent double acquisition', async () => {
    const key = `lock:double:${Date.now()}`;

    const first = await acquireLock(key, 30);
    const second = await acquireLock(key, 30);

    expect(first).toBe(true);
    expect(second).toBe(false);

    // Cleanup
    await releaseLock(key);
  });

  it('should release lock', async () => {
    const key = `lock:release:${Date.now()}`;

    await acquireLock(key, 30);
    await releaseLock(key);
    const acquired = await acquireLock(key, 30);

    expect(acquired).toBe(true);

    // Cleanup
    await releaseLock(key);
  });

  describe('withLock', () => {
    it('should execute function with lock', async () => {
      const key = `withlock:test:${Date.now()}`;

      const result = await withLock(key, async () => {
        return 'executed';
      }, 30);

      expect(result).toBe('executed');
    });

    it('should return null when unable to acquire lock', async () => {
      const key = `withlock:fail:${Date.now()}`;

      await acquireLock(key, 30);

      const result = await withLock(key, async () => 'test', 30);
      expect(result).toBeNull();

      // Cleanup
      await releaseLock(key);
    });

    it('should release lock after execution', async () => {
      const key = `withlock:release:${Date.now()}`;

      await withLock(key, async () => 'done', 30);

      // Should be able to acquire again
      const acquired = await acquireLock(key, 30);
      expect(acquired).toBe(true);

      // Cleanup
      await releaseLock(key);
    });
  });
});

// =============================================================================
// CACHE OBJECT TESTS
// =============================================================================

describe('Memory Cache - Cache Object', () => {
  it('should have all required methods', () => {
    expect(typeof cache.get).toBe('function');
    expect(typeof cache.set).toBe('function');
    expect(typeof cache.del).toBe('function');
    expect(typeof cache.delPattern).toBe('function');
    expect(typeof cache.has).toBe('function');
    expect(typeof cache.ttl).toBe('function');
    expect(typeof cache.aside).toBe('function');
    expect(typeof cache.refresh).toBe('function');
    expect(typeof cache.invalidateTenant).toBe('function');
  });

  it('should include cache keys', () => {
    expect(cache.keys).toBe(cacheKeys);
  });

  it('should include cache patterns', () => {
    expect(cache.patterns).toBe(cachePatterns);
  });

  it('should include TTL settings', () => {
    expect(cache.TTL).toBe(cacheTTL);
  });

  it('should provide stats', () => {
    const stats = cache.getStats();
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('sets');
    expect(stats).toHaveProperty('deletes');
    expect(stats).toHaveProperty('size');
    expect(stats.type).toBe('memory');
  });
});

// =============================================================================
// CACHE KEY PATTERNS TESTS
// =============================================================================

describe('Memory Cache - Cache Key Patterns', () => {
  it('should generate tenant info key', () => {
    const key = cacheKeys.tenant.info('tenant-123');
    expect(key).toBe('tenant:tenant-123:info');
  });

  it('should generate parts list key', () => {
    const key = cacheKeys.tenant.parts.list('tenant-123');
    expect(key).toBe('tenant:tenant-123:parts:list');
  });

  it('should generate user session key', () => {
    const key = cacheKeys.user.session('user-456');
    expect(key).toBe('user:user-456:session');
  });

  it('should generate rate limit key', () => {
    const key = cacheKeys.rateLimit.api('tenant-123', '/api/parts');
    expect(key).toBe('ratelimit:tenant-123:api:/api/parts');
  });

  it('should generate dashboard pattern', () => {
    const pattern = cachePatterns.dashboard('tenant-123');
    expect(pattern).toBe('tenant:tenant-123:dashboard:*');
  });
});

// =============================================================================
// CACHE TTL CONSTANTS TESTS
// =============================================================================

describe('Memory Cache - TTL Constants', () => {
  it('should have standard TTL values', () => {
    expect(cacheTTL.short).toBe(60);
    expect(cacheTTL.medium).toBe(300);
    expect(cacheTTL.long).toBe(600);
    expect(cacheTTL.hour).toBe(3600);
    expect(cacheTTL.day).toBe(86400);
  });

  it('should have uppercase aliases', () => {
    expect(cacheTTL.SHORT).toBe(60);
    expect(cacheTTL.MEDIUM).toBe(300);
    expect(cacheTTL.LONG).toBe(600);
    expect(cacheTTL.HOUR).toBe(3600);
    expect(cacheTTL.DAY).toBe(86400);
  });

  it('should have specific TTL values', () => {
    expect(cacheTTL.dashboard).toBe(60);
    expect(cacheTTL.partsList).toBe(300);
    expect(cacheTTL.inventory).toBe(60);
    expect(cacheTTL.reports).toBe(1800);
    expect(cacheTTL.userPrefs).toBe(3600);
  });
});
