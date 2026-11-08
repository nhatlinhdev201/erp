import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'L-ERP Thương mại điện tử / Ecommerce API',
    version: '1.0.0',
    description: 'API documentation for L-ERP Thương mại điện tử / Ecommerce module / Tài liệu API cho module Thương mại điện tử / Ecommerce của L-ERP',
  },
  servers: [
    { url: 'http://localhost:3008', description: 'Development / Phát triển' },
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
