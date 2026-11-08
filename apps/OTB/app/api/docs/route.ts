import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'L-ERP Kế hoạch Mua hàng / OTB API',
    version: '1.0.0',
    description: 'API documentation for L-ERP Kế hoạch Mua hàng / OTB module / Tài liệu API cho module Kế hoạch Mua hàng / OTB của L-ERP',
  },
  servers: [
    { url: 'http://localhost:3009', description: 'Development / Phát triển' },
  ],
  paths: {},
  components: { schemas: {} },
  tags: [],
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
