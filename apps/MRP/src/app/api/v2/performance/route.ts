// =============================================================================
// L-ERP MRP - PERFORMANCE MONITORING API
// /api/v2/performance/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePerformanceReport,
  queryProfiler,
  getMemoryUsage,
} from '@/lib/performance/profiler';
import { getCacheStats } from '@/lib/performance/cache';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-auth';
import { z } from 'zod';

import { checkReadEndpointLimit, checkWriteEndpointLimit } from '@/lib/rate-limit';
// =============================================================================
// GET /api/v2/performance
// Get performance metrics and report
// =============================================================================

export const GET = withAuth(async (request: NextRequest, context, session) => {
    // Rate limiting
    const rateLimitResult = await checkReadEndpointLimit(request);
    if (rateLimitResult) return rateLimitResult;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'summary';
  
  try {
    switch (type) {
      case 'full':
        // Full performance report
        const report = generatePerformanceReport();
        return NextResponse.json({
          success: true,
          data: report,
        });
      
      case 'metrics':
        // Just metrics
        const metrics = queryProfiler.getMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
        });
      
      case 'memory':
        // Memory usage
        const memory = getMemoryUsage();
        return NextResponse.json({
          success: true,
          data: memory,
        });
      
      case 'cache':
        // Cache statistics
        const cacheStats = getCacheStats();
        return NextResponse.json({
          success: true,
          data: cacheStats,
        });
      
      case 'slow-queries':
        // Slow queries
        const slowQueries = queryProfiler.getSlowQueries(
          parseInt(searchParams.get('limit') || '20')
        );
        return NextResponse.json({
          success: true,
          data: slowQueries,
        });
      
      case 'recent':
        // Recent queries
        const recentQueries = queryProfiler.getRecentQueries(
          parseInt(searchParams.get('limit') || '100')
        );
        return NextResponse.json({
          success: true,
          data: recentQueries,
        });
      
      default:
        // Summary
        const summaryMetrics = queryProfiler.getMetrics();
        const summaryMemory = getMemoryUsage();
        const summaryCacheStats = getCacheStats();
        
        return NextResponse.json({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            metrics: {
              avgResponseTime: `${summaryMetrics.avgResponseTime.toFixed(2)}ms`,
              p95ResponseTime: `${summaryMetrics.p95ResponseTime.toFixed(2)}ms`,
              totalRequests: summaryMetrics.totalRequests,
              slowQueries: summaryMetrics.slowQueries,
            },
            memory: {
              heapUsed: summaryMemory.heapUsed,
              percentUsed: `${summaryMemory.percentUsed}%`,
            },
            cache: {
              hitRate: `${(summaryCacheStats.hitRate * 100).toFixed(1)}%`,
              size: summaryCacheStats.size,
            },
          },
        });
    }
  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: '/api/v2/performance' });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
});

// =============================================================================
// POST /api/v2/performance
// Clear performance data
// =============================================================================

export const POST = withAuth(async (request: NextRequest, context, session) => {
    // Rate limiting
    const rateLimitResult = await checkWriteEndpointLimit(request);
    if (rateLimitResult) return rateLimitResult;

  const bodySchema = z.object({
    action: z.enum(['clear-profiler', 'gc']),
  });
  const rawBody = await request.json();
  const parseResult = bodySchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const body = parseResult.data;
  const { action } = body;
  
  try {
    switch (action) {
      case 'clear-profiler':
        queryProfiler.clear();
        return NextResponse.json({
          success: true,
          message: 'Profiler data cleared',
        });
      
      case 'gc':
        // Trigger garbage collection (if exposed)
        if (global.gc) {
          global.gc();
          return NextResponse.json({
            success: true,
            message: 'Garbage collection triggered',
            memory: getMemoryUsage(),
          });
        }
        return NextResponse.json({
          success: false,
          error: 'GC not exposed. Start Node with --expose-gc',
        });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: '/api/v2/performance' });
    return NextResponse.json(
      { success: false, error: 'Failed to process performance action' },
      { status: 500 }
    );
  }
});
