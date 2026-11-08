// =============================================================================
// L-ERP MRP ENTERPRISE HEALTH CHECK & DIAGNOSTICS
// Comprehensive system health monitoring for production
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// TYPES
// =============================================================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  metrics: SystemMetrics;
  recommendations: string[];
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  latency?: number;
  message?: string;
  details?: any;
}

interface SystemMetrics {
  database: DatabaseMetrics;
  application: ApplicationMetrics;
  resources: ResourceMetrics;
}

interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
    max: number;
  };
  tables: {
    name: string;
    rowCount: number;
    size: string;
    indexSize: string;
  }[];
  slowQueries: number;
  deadTuples: number;
  cacheHitRatio: number;
}

interface ApplicationMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  activeUsers: number;
}

interface ResourceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

// =============================================================================
// HEALTH CHECKS
// =============================================================================

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      name: 'database',
      status: latency < 100 ? 'pass' : latency < 500 ? 'warn' : 'fail',
      latency,
      message: latency < 100 ? 'Database responding normally' : 'Database response slow',
    };
  } catch (error: any) {
    return {
      name: 'database',
      status: 'fail',
      latency: Date.now() - start,
      message: `Database connection failed: ${error.message}`,
    };
  }
}

async function checkDatabaseCapacity(): Promise<HealthCheck> {
  try {
    // Get table sizes and row counts
    const tableStats = await prisma.$queryRaw<any[]>`
      SELECT 
        relname as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 10
    `;

    // Check for high dead tuple ratio
    const highDeadTuples = tableStats.filter(t => 
      t.row_count > 0 && (t.dead_tuples / t.row_count) > 0.1
    );

    return {
      name: 'database_capacity',
      status: highDeadTuples.length === 0 ? 'pass' : 'warn',
      message: highDeadTuples.length > 0 
        ? `${highDeadTuples.length} tables need vacuuming`
        : 'Database capacity healthy',
      details: {
        tables: tableStats,
        needsVacuum: highDeadTuples.map(t => t.table_name),
      },
    };
  } catch (error: any) {
    return {
      name: 'database_capacity',
      status: 'fail',
      message: error.message,
    };
  }
}

async function checkConnectionPool(): Promise<HealthCheck> {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    const { active, idle, idle_in_transaction, max_connections } = stats[0];
    const total = Number(active) + Number(idle) + Number(idle_in_transaction);
    const usagePercent = (total / Number(max_connections)) * 100;

    return {
      name: 'connection_pool',
      status: usagePercent < 70 ? 'pass' : usagePercent < 90 ? 'warn' : 'fail',
      message: `${total}/${max_connections} connections (${usagePercent.toFixed(1)}%)`,
      details: {
        active: Number(active),
        idle: Number(idle),
        idleInTransaction: Number(idle_in_transaction),
        total,
        max: Number(max_connections),
        usagePercent,
      },
    };
  } catch (error: any) {
    return {
      name: 'connection_pool',
      status: 'fail',
      message: error.message,
    };
  }
}

async function checkIndexHealth(): Promise<HealthCheck> {
  try {
    // Check for missing indexes (sequential scans on large tables)
    const sequentialScans = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname || '.' || relname as table,
        seq_scan,
        seq_tup_read,
        idx_scan,
        CASE WHEN seq_scan > 0 
             THEN seq_tup_read / seq_scan 
             ELSE 0 
        END as avg_seq_tup
      FROM pg_stat_user_tables
      WHERE seq_scan > 100 
        AND seq_tup_read / GREATEST(seq_scan, 1) > 1000
      ORDER BY seq_tup_read DESC
      LIMIT 5
    `;

    // Check for unused indexes
    const unusedIndexes = await prisma.$queryRaw<any[]>`
      SELECT 
        indexrelname as index_name,
        relname as table_name,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
        AND pg_relation_size(indexrelid) > 1024 * 1024
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 5
    `;

    const issues = sequentialScans.length + unusedIndexes.length;

    return {
      name: 'index_health',
      status: issues === 0 ? 'pass' : issues < 5 ? 'warn' : 'fail',
      message: issues === 0 
        ? 'Indexes healthy' 
        : `${issues} index issues found`,
      details: {
        tablesNeedingIndexes: sequentialScans,
        unusedIndexes,
      },
    };
  } catch (error: any) {
    return {
      name: 'index_health',
      status: 'fail',
      message: error.message,
    };
  }
}

async function checkDataIntegrity(): Promise<HealthCheck> {
  try {
    const issues: string[] = [];

    // Check for negative inventory (quantity field per schema)
    const negativeInventory = await prisma.inventory.count({
      where: { quantity: { lt: 0 } },
    });
    if (negativeInventory > 0) {
      issues.push(`${negativeInventory} negative inventory records`);
    }

    return {
      name: 'data_integrity',
      status: issues.length === 0 ? 'pass' : 'warn',
      message: issues.length === 0 ? 'Data integrity OK' : issues.join(', '),
      details: { issues },
    };
  } catch (error: any) {
    return {
      name: 'data_integrity',
      status: 'fail',
      message: error.message,
    };
  }
}

async function checkCacheHitRatio(): Promise<HealthCheck> {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(idx_blks_read) as idx_read,
        sum(idx_blks_hit) as idx_hit
      FROM pg_statio_user_tables
    `;

    const { heap_read, heap_hit, idx_read, idx_hit } = stats[0];
    const totalRead = Number(heap_read) + Number(idx_read);
    const totalHit = Number(heap_hit) + Number(idx_hit);
    const hitRatio = totalHit / (totalRead + totalHit) * 100;

    return {
      name: 'cache_hit_ratio',
      status: hitRatio > 99 ? 'pass' : hitRatio > 95 ? 'warn' : 'fail',
      message: `Cache hit ratio: ${hitRatio.toFixed(2)}%`,
      details: {
        heapRead: Number(heap_read),
        heapHit: Number(heap_hit),
        indexRead: Number(idx_read),
        indexHit: Number(idx_hit),
        hitRatio,
      },
    };
  } catch (error: any) {
    return {
      name: 'cache_hit_ratio',
      status: 'fail',
      message: error.message,
    };
  }
}

function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;
  const rssMB = usage.rss / 1024 / 1024;
  const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

  return {
    name: 'memory',
    status: usagePercent < 70 ? 'pass' : usagePercent < 85 ? 'warn' : 'fail',
    message: `Heap: ${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB (${usagePercent.toFixed(1)}%)`,
    details: {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssMB,
      external: usage.external / 1024 / 1024,
      usagePercent,
    },
  };
}

// =============================================================================
// DIAGNOSTIC QUERIES
// =============================================================================

async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  // Table statistics
  const tableStats = await prisma.$queryRaw<any[]>`
    SELECT 
      relname as name,
      n_live_tup::bigint as row_count,
      pg_size_pretty(pg_total_relation_size(relid)) as size,
      pg_size_pretty(pg_indexes_size(relid)) as index_size
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
    LIMIT 20
  `;

  // Slow queries count
  const slowQueries = await prisma.$queryRaw<any[]>`
    SELECT count(*) as count
    FROM pg_stat_statements
    WHERE mean_exec_time > 1000
  `.catch(() => [{ count: 0 }]);

  // Dead tuples
  const deadTuples = await prisma.$queryRaw<any[]>`
    SELECT sum(n_dead_tup)::bigint as total
    FROM pg_stat_user_tables
  `;

  // Connection pool
  const poolStats = await prisma.$queryRaw<any[]>`
    SELECT 
      count(*) FILTER (WHERE state = 'active')::int as active,
      count(*) FILTER (WHERE state = 'idle')::int as idle,
      count(*) FILTER (WHERE wait_event IS NOT NULL)::int as waiting,
      (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max
    FROM pg_stat_activity
    WHERE datname = current_database()
  `;

  // Cache hit ratio
  const cacheStats = await prisma.$queryRaw<any[]>`
    SELECT 
      CASE WHEN sum(heap_blks_read + idx_blks_read) > 0
           THEN sum(heap_blks_hit + idx_blks_hit) / 
                sum(heap_blks_read + idx_blks_read + heap_blks_hit + idx_blks_hit) * 100
           ELSE 100
      END as ratio
    FROM pg_statio_user_tables
  `;

  return {
    connectionPool: {
      active: poolStats[0]?.active || 0,
      idle: poolStats[0]?.idle || 0,
      waiting: poolStats[0]?.waiting || 0,
      max: poolStats[0]?.max || 100,
    },
    tables: tableStats.map(t => ({
      name: t.name,
      rowCount: Number(t.row_count),
      size: t.size,
      indexSize: t.index_size,
    })),
    slowQueries: Number(slowQueries[0]?.count || 0),
    deadTuples: Number(deadTuples[0]?.total || 0),
    cacheHitRatio: Number(cacheStats[0]?.ratio || 100),
  };
}

// =============================================================================
// MAIN HEALTH CHECK FUNCTION
// =============================================================================

export async function runHealthCheck(): Promise<HealthStatus> {
  const startTime = process.uptime();
  const checks: HealthCheck[] = [];
  const recommendations: string[] = [];

  // Run all health checks
  checks.push(await checkDatabase());
  checks.push(await checkDatabaseCapacity());
  checks.push(await checkConnectionPool());
  checks.push(await checkIndexHealth());
  checks.push(await checkDataIntegrity());
  checks.push(await checkCacheHitRatio());
  checks.push(checkMemory());

  // Get metrics
  const dbMetrics = await getDatabaseMetrics();

  // Determine overall status
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warnChecks = checks.filter(c => c.status === 'warn');
  
  let status: HealthStatus['status'] = 'healthy';
  if (failedChecks.length > 0) {
    status = 'unhealthy';
  } else if (warnChecks.length > 0) {
    status = 'degraded';
  }

  // Generate recommendations
  for (const check of checks) {
    if (check.name === 'database_capacity' && check.status !== 'pass') {
      recommendations.push('Run VACUUM ANALYZE on tables with high dead tuple ratio');
    }
    if (check.name === 'connection_pool' && check.status !== 'pass') {
      recommendations.push('Consider increasing max_connections or using connection pooling (PgBouncer)');
    }
    if (check.name === 'index_health' && check.status !== 'pass') {
      recommendations.push('Review and add missing indexes, remove unused indexes');
    }
    if (check.name === 'cache_hit_ratio' && check.status !== 'pass') {
      recommendations.push('Increase shared_buffers PostgreSQL setting');
    }
    if (check.name === 'memory' && check.status !== 'pass') {
      recommendations.push('Consider increasing Node.js memory limit or scaling horizontally');
    }
  }

  // Large data recommendations
  const totalRows = dbMetrics.tables.reduce((sum, t) => sum + t.rowCount, 0);
  if (totalRows > 1000000) {
    recommendations.push('Consider implementing table partitioning for large tables');
    recommendations.push('Enable query result caching with Redis');
    recommendations.push('Review and optimize N+1 queries');
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: startTime,
    checks,
    metrics: {
      database: dbMetrics,
      application: {
        requestsPerMinute: 0, // Would be populated from actual metrics
        averageResponseTime: 0,
        errorRate: 0,
        activeUsers: 0,
      },
      resources: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        },
        cpu: { usage: 0 },
        disk: { used: 0, total: 0, percentage: 0 },
      },
    },
    recommendations,
  };
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

export async function GET(request: Request) {
  try {
    const health = await runHealthCheck();
    
    const statusCode = 
      health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 :
      503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export { runHealthCheck as default };
