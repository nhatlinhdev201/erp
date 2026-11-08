// src/lib/cache/redis-client.ts

/**
 * LAC VIET HR - Redis Client
 * High-performance Redis client with connection pooling, cluster support, and failover
 */

// @ts-ignore - ioredis types installed optionally
import Redis, { RedisOptions, Cluster, ClusterOptions } from 'ioredis';

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface RedisConfig {
  mode: 'standalone' | 'sentinel' | 'cluster';
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;

  // Cluster config
  clusterNodes?: Array<{ host: string; port: number }>;

  // Sentinel config
  sentinels?: Array<{ host: string; port: number }>;
  sentinelName?: string;

  // Connection pool
  maxRetriesPerRequest?: number;
  retryDelayMs?: number;
  connectTimeoutMs?: number;
  commandTimeoutMs?: number;

  // Performance
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
  lazyConnect?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalCommands: number;
  connectedClients: number;
  usedMemory: string;
  uptime: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ════════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: Partial<RedisConfig> = {
  mode: 'standalone',
  host: 'localhost',
  port: 6379,
  db: 0,
  keyPrefix: 'lerp:',
  maxRetriesPerRequest: 3,
  retryDelayMs: 100,
  connectTimeoutMs: 10000,
  commandTimeoutMs: 5000,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,
};

// ════════════════════════════════════════════════════════════════════════════════
// REDIS CLIENT CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class RedisClient {
  private client: Redis | Cluster;
  private config: RedisConfig;
  private isConnected: boolean = false;
  private stats = {
    hits: 0,
    misses: 0,
    totalCommands: 0,
  };

  constructor(config: Partial<RedisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as RedisConfig;
    this.client = this.createClient();
    this.setupEventHandlers();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLIENT CREATION
  // ─────────────────────────────────────────────────────────────────────────────

  private createClient(): Redis | Cluster {
    const { mode } = this.config;

    switch (mode) {
      case 'cluster':
        return this.createClusterClient();
      case 'sentinel':
        return this.createSentinelClient();
      default:
        return this.createStandaloneClient();
    }
  }

  private createStandaloneClient(): Redis {
    const options: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      retryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * this.config.retryDelayMs!, 3000);
      },
      connectTimeout: this.config.connectTimeoutMs,
      commandTimeout: this.config.commandTimeoutMs,
      enableReadyCheck: this.config.enableReadyCheck,
      enableOfflineQueue: this.config.enableOfflineQueue,
      lazyConnect: this.config.lazyConnect,
    };

    // Support URL connection string
    if (this.config.url) {
      return new Redis(this.config.url, options);
    }

    return new Redis(options);
  }

  private createClusterClient(): Cluster {
    const nodes = this.config.clusterNodes || [
      { host: this.config.host!, port: this.config.port! },
    ];

    const options: ClusterOptions = {
      redisOptions: {
        password: this.config.password,
        keyPrefix: this.config.keyPrefix,
        commandTimeout: this.config.commandTimeoutMs,
      },
      clusterRetryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      scaleReads: 'slave', // Read from replicas for better distribution
    };

    return new Redis.Cluster(nodes, options);
  }

  private createSentinelClient(): Redis {
    const options: RedisOptions = {
      sentinels: this.config.sentinels,
      name: this.config.sentinelName || 'mymaster',
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      sentinelRetryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: this.config.enableReadyCheck,
    };

    return new Redis(options);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
    });

    this.client.on('ready', () => {
      this.isConnected = true;
    });

    this.client.on('error', (error: Error) => {
      console.error('[Redis] Error:', error.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
    });

    this.client.on('end', () => {
      this.isConnected = false;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BASIC OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    this.stats.totalCommands++;
    const value = await this.client.get(key);

    if (value === null) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.stats.totalCommands++;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async setex(key: string, ttlSeconds: number, value: unknown): Promise<void> {
    return this.set(key, value, ttlSeconds);
  }

  async del(key: string | string[]): Promise<number> {
    this.stats.totalCommands++;
    const keys = Array.isArray(key) ? key : [key];
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    this.stats.totalCommands++;
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    this.stats.totalCommands++;
    return this.client.ttl(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    this.stats.totalCommands++;
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    this.stats.totalCommands++;
    return this.client.incr(key);
  }

  async incrby(key: string, increment: number): Promise<number> {
    this.stats.totalCommands++;
    return this.client.incrby(key, increment);
  }

  async decr(key: string): Promise<number> {
    this.stats.totalCommands++;
    return this.client.decr(key);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HASH OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async hget<T>(key: string, field: string): Promise<T | null> {
    this.stats.totalCommands++;
    const value = await this.client.hget(key, field);

    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async hset(key: string, field: string, value: unknown): Promise<void> {
    this.stats.totalCommands++;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.hset(key, field, serialized);
  }

  async hmset(key: string, data: Record<string, unknown>): Promise<void> {
    this.stats.totalCommands++;
    const serialized: Record<string, string> = {};

    for (const [field, value] of Object.entries(data)) {
      serialized[field] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    await this.client.hmset(key, serialized);
  }

  async hgetall<T>(key: string): Promise<T | null> {
    this.stats.totalCommands++;
    const data = await this.client.hgetall(key);

    if (!data || Object.keys(data).length === 0) return null;

    const result: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value as string);
      } catch {
        result[field] = value;
      }
    }

    return result as T;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    this.stats.totalCommands++;
    return this.client.hdel(key, ...fields);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    this.stats.totalCommands++;
    return this.client.hincrby(key, field, increment);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIST OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async lpush(key: string, ...values: unknown[]): Promise<number> {
    this.stats.totalCommands++;
    const serialized = values.map((v: unknown) => typeof v === 'string' ? v : JSON.stringify(v));
    return this.client.lpush(key, ...serialized);
  }

  async rpush(key: string, ...values: unknown[]): Promise<number> {
    this.stats.totalCommands++;
    const serialized = values.map((v: unknown) => typeof v === 'string' ? v : JSON.stringify(v));
    return this.client.rpush(key, ...serialized);
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    this.stats.totalCommands++;
    const values = await this.client.lrange(key, start, stop);
    return values.map((v: string) => {
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as unknown as T;
      }
    });
  }

  async llen(key: string): Promise<number> {
    this.stats.totalCommands++;
    return this.client.llen(key);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SET OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async sadd(key: string, ...members: string[]): Promise<number> {
    this.stats.totalCommands++;
    return this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    this.stats.totalCommands++;
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    this.stats.totalCommands++;
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    this.stats.totalCommands++;
    return this.client.srem(key, ...members);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SORTED SET OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async zadd(key: string, score: number, member: string): Promise<number> {
    this.stats.totalCommands++;
    return this.client.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    this.stats.totalCommands++;
    return this.client.zrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    this.stats.totalCommands++;
    return this.client.zrangebyscore(key, min, max);
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    this.stats.totalCommands++;
    return this.client.zremrangebyscore(key, min, max);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    this.stats.totalCommands++;
    return this.client.zrem(key, ...members);
  }

  async zcard(key: string): Promise<number> {
    this.stats.totalCommands++;
    return this.client.zcard(key);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATTERN OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async keys(pattern: string): Promise<string[]> {
    this.stats.totalCommands++;
    return this.client.keys(pattern);
  }

  async scan(cursor: number, pattern: string, count: number = 100): Promise<[string, string[]]> {
    this.stats.totalCommands++;
    return this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
  }

  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0;
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.scan(parseInt(cursor), pattern, 100);
      cursor = newCursor;

      if (keys.length > 0) {
        deleted += await this.del(keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSACTION & PIPELINE
  // ─────────────────────────────────────────────────────────────────────────────

  pipeline() {
    return this.client.pipeline();
  }

  multi() {
    return this.client.multi();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async flushdb(): Promise<void> {
    await this.client.flushdb();
  }

  async info(): Promise<string> {
    return this.client.info();
  }

  async getStats(): Promise<CacheStats> {
    const info = await this.client.info();
    const lines = info.split('\r\n');

    let usedMemory = 'N/A';
    let connectedClients = 0;
    let uptime = 0;

    for (const line of lines) {
      if (line.startsWith('used_memory_human:')) {
        usedMemory = line.split(':')[1];
      } else if (line.startsWith('connected_clients:')) {
        connectedClients = parseInt(line.split(':')[1]);
      } else if (line.startsWith('uptime_in_seconds:')) {
        uptime = parseInt(line.split(':')[1]);
      }
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalCommands: this.stats.totalCommands,
      connectedClients,
      usedMemory,
      uptime,
    };
  }

  getClient(): Redis | Cluster {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ════════════════════════════════════════════════════════════════════════════════

let redisInstance: RedisClient | null = null;

export function getRedisClient(config?: Partial<RedisConfig>): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient(config || {
      url: process.env.REDIS_URL,
      keyPrefix: process.env.REDIS_PREFIX || 'lerp:',
    });
  }
  return redisInstance;
}

export function createRedisClient(config: Partial<RedisConfig>): RedisClient {
  return new RedisClient(config);
}

export default RedisClient;
