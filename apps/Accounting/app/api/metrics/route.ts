import { NextResponse } from 'next/server';

// Prometheus metrics endpoint
// In production, import from @linkk/metrics
// For now, provide a basic text/plain response with metric stubs

export async function GET() {
  const metrics = [
    '# HELP lerp_http_requests_total Total HTTP requests',
    '# TYPE lerp_http_requests_total counter',
    'lerp_http_requests_total{app="accounting",method="GET",status="200"} 0',
    '',
    '# HELP lerp_http_request_duration_seconds HTTP request duration',
    '# TYPE lerp_http_request_duration_seconds histogram',
    'lerp_http_request_duration_seconds_bucket{app="accounting",le="0.1"} 0',
    '',
    '# HELP lerp_app_info Application information',
    '# TYPE lerp_app_info gauge',
    'lerp_app_info{app="accounting",version="1.0.0"} 1',
  ].join('\n');

  return new NextResponse(metrics, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
