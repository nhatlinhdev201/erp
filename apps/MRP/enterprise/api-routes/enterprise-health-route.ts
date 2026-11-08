// =============================================================================
// L-ERP MRP ENTERPRISE HEALTH CHECK API
// Comprehensive system diagnostics
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  latency?: number;
  message?: string;
  details?: any;
}

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

async function getTableStats() {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        relname as table_name,
        n_live_tup::bigint as row_count,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 15
    `;
    return stats;
  } catch {
    return [];
  }
}

async function getConnectionStats() {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        count(*) FILTER (WHERE state = 'active')::int as active,
        count(*) FILTER (WHERE state = 'idle')::int as idle,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    return stats[0];
  } catch {
    return { active: 0, idle: 0, max_connections: 100 };
  }
}

async function getCacheHitRatio() {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        CASE WHEN sum(heap_blks_read + idx_blks_read) > 0
             THEN round(sum(heap_blks_hit + idx_blks_hit)::numeric / 
                  sum(heap_blks_read + idx_blks_read + heap_blks_hit + idx_blks_hit)::numeric * 100, 2)
             ELSE 100
        END as ratio
      FROM pg_statio_user_tables
    `;
    return parseFloat(stats[0]?.ratio || 100);
  } catch {
    return 100;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];
  const recommendations: string[] = [];

  // Database check
  const dbCheck = await checkDatabase();
  checks.push(dbCheck);

  // Get metrics
  const [tableStats, connectionStats, cacheHitRatio] = await Promise.all([
    getTableStats(),
    getConnectionStats(),
    getCacheHitRatio(),
  ]);

  // Memory check
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.push({
    name: 'memory',
    status: heapUsedPercent < 70 ? 'pass' : heapUsedPercent < 85 ? 'warn' : 'fail',
    message: `Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(0)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(0)}MB (${heapUsedPercent.toFixed(1)}%)`,
  });

  // Connection pool check
  const connUsagePercent = ((connectionStats.active + connectionStats.idle) / connectionStats.max_connections) * 100;
  checks.push({
    name: 'connection_pool',
    status: connUsagePercent < 70 ? 'pass' : connUsagePercent < 90 ? 'warn' : 'fail',
    message: `${connectionStats.active + connectionStats.idle}/${connectionStats.max_connections} connections (${connUsagePercent.toFixed(1)}%)`,
    details: connectionStats,
  });

  // Cache hit ratio check
  checks.push({
    name: 'cache_hit_ratio',
    status: cacheHitRatio > 99 ? 'pass' : cacheHitRatio > 95 ? 'warn' : 'fail',
    message: `Cache hit ratio: ${cacheHitRatio}%`,
  });

  // Generate recommendations
  if (heapUsedPercent > 70) {
    recommendations.push('Consider increasing Node.js memory limit');
  }
  if (connUsagePercent > 70) {
    recommendations.push('Consider using connection pooling (PgBouncer)');
  }
  if (cacheHitRatio < 95) {
    recommendations.push('Increase PostgreSQL shared_buffers');
  }

  // Calculate totals
  const totalRows = tableStats.reduce((sum: number, t: any) => sum + parseInt(t.row_count || 0), 0);
  if (totalRows > 1000000) {
    recommendations.push('Consider table partitioning for large tables');
    recommendations.push('Enable query result caching with Redis');
  }

  // Determine overall status
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warnChecks = checks.filter(c => c.status === 'warn');
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (failedChecks.length > 0) status = 'unhealthy';
  else if (warnChecks.length > 0) status = 'degraded';

  const response = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    checks,
    metrics: {
      database: {
        totalRows,
        tables: tableStats,
        cacheHitRatio,
      },
      connections: connectionStats,
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        usagePercent: heapUsedPercent,
      },
    },
    recommendations,
  };

  return NextResponse.json(response, {
    status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
    headers: { 'Cache-Control': 'no-cache' },
  });
}
