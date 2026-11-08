// =============================================================================
// L-ERP MRP - HEALTH CHECK API ENDPOINTS
// /api/health/live, /api/health/ready, /api/health
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  checkLiveness,
  checkReadiness,
  checkHealth,
  getHealthHttpStatus
} from '@/lib/monitoring/health';
import { logger } from '@/lib/logger';

/**
 * GET /api/health/live
 * Liveness probe - is the application running?
 */
export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  try {
    // Route to appropriate health check
    if (pathname.endsWith('/live')) {
      const health = checkLiveness();
      return NextResponse.json(health, { status: 200 });
    }
    
    if (pathname.endsWith('/ready')) {
      const health = await checkReadiness();
      return NextResponse.json(health, { status: getHealthHttpStatus(health) });
    }
    
    // Full health check
    const health = await checkHealth();
    return NextResponse.json(health, { status: getHealthHttpStatus(health) });
    
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'GET /api/health/[check]' });
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
