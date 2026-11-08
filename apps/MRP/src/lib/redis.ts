// =============================================================================
// L-ERP MRP - REDIS CONNECTION
// Disabled - using in-memory alternatives for Render compatibility
// =============================================================================

// In-memory rate limiting store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Fake Redis client for compatibility
export const redis = {
  get: async () => null,
  set: async () => 'OK',
  setex: async () => 'OK',
  del: async () => 0,
  exists: async () => 0,
  expire: async () => true,
  ttl: async () => -1,
  incr: async (key: string) => {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
      return 1;
    }
    record.count++;
    return record.count;
  },
  keys: async () => [],
  pipeline: () => ({
    incr: function() { return this; },
    ttl: function() { return this; },
    expire: function() { return this; },
    zremrangebyscore: function() { return this; },
    zcard: function() { return this; },
    zadd: function() { return this; },
    exec: async () => [[null, 1], [null, -1]],
  }),
  multi: () => ({
    exec: async () => [],
  }),
  ping: async () => 'PONG',
  info: async () => 'In-memory mode (Redis disabled)',
  status: 'ready',
};

// Connection config (not used, but kept for compatibility)
export const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Cleanup old rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, record] of entries) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}

export default redis;
