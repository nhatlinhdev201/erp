/**
 * @linkk/openapi — Next.js Integration Helpers
 *
 * Creates Next.js route handlers for OpenAPI documentation.
 */

import { swaggerUIHandler, specHandler } from './ui';

// ─── Types ───────────────────────────────────────────────────

interface NextJSResponse {
  status: number;
  headers?: Record<string, string>;
  body: string;
}

// ─── Spec Route Handler ──────────────────────────────────────

/**
 * Create a Next.js GET route handler for /api/docs that returns the OpenAPI JSON spec
 *
 * Usage in app/api/docs/route.ts:
 * ```
 * export const GET = createDocsRoute(myOpenAPISpec);
 * ```
 */
export function createDocsRoute(spec: Record<string, any>) {
  return function GET(): Response {
    const { status, headers, body } = specHandler(spec);

    return new Response(body, {
      status,
      headers: {
        'Content-Type': headers['Content-Type'],
        'Cache-Control': headers['Cache-Control'],
        'Access-Control-Allow-Origin': headers['Access-Control-Allow-Origin'],
        'Access-Control-Allow-Methods': headers['Access-Control-Allow-Methods'],
        'Access-Control-Allow-Headers': headers['Access-Control-Allow-Headers'],
      },
    });
  };
}

// ─── Swagger UI Route Handler ────────────────────────────────

/**
 * Create a Next.js GET route handler for /api/docs/ui that returns Swagger UI HTML
 *
 * Usage in app/api/docs/ui/route.ts:
 * ```
 * export const GET = createSwaggerRoute('/api/docs');
 * ```
 */
export function createSwaggerRoute(specUrl: string) {
  return function GET(): Response {
    const html = swaggerUIHandler(specUrl);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  };
}

// ─── Combined Handler ────────────────────────────────────────

/**
 * Create a combined handler that returns spec JSON on /api/docs
 * and Swagger UI HTML on /api/docs/ui
 *
 * Note: This requires manual routing setup in Next.js
 * Better to create separate route files.
 */
export function createDocsHandlers(spec: Record<string, any>, specUrl: string = '/api/docs') {
  return {
    docsSpec: createDocsRoute(spec),
    docsUI: createSwaggerRoute(specUrl),
  };
}
