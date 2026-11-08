/**
 * @linkk/openapi — Swagger UI Handler
 *
 * Provides Swagger UI HTML and spec JSON response handlers.
 */

// ─── Swagger UI Handler ──────────────────────────────────────

/**
 * Generate HTML string for Swagger UI using CDN
 * Returns complete HTML page with Swagger UI initialized
 */
export function swaggerUIHandler(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>L-ERP API Documentation</title>
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='50' font-size='90' fill='%23e74c3c'>V</text></svg>">
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
        background-color: #f5f5f5;
      }

      .swagger-ui {
        max-width: 100%;
      }

      .topbar {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        padding: 0 20px;
        height: auto;
      }

      .topbar-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 0;
      }

      .topbar-title {
        font-size: 24px;
        font-weight: 600;
        color: white;
        letter-spacing: 0.5px;
      }

      .topbar-title small {
        display: block;
        font-size: 12px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 4px;
      }

      .swagger-ui .topbar {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .swagger-ui .topbar a.logo {
        color: white;
        font-weight: 600;
        text-decoration: none;
      }

      .swagger-ui .topbar a.logo:hover {
        opacity: 0.9;
      }

      .swagger-ui .scheme-container {
        background: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .swagger-ui .btn {
        background: #e74c3c;
        border-color: #c0392b;
      }

      .swagger-ui .btn:hover {
        background: #c0392b;
        border-color: #a93226;
      }

      .swagger-ui .btn-primary {
        background: #27ae60;
      }

      .swagger-ui .btn-primary:hover {
        background: #229954;
      }

      .swagger-ui .model-box {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
      }

      .swagger-ui section.models h4 {
        color: #333;
      }

      .swagger-ui .info .title {
        color: #333;
      }

      .swagger-ui .info .description {
        color: #666;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: 'StandaloneLayout',
          deepLinking: true,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          tryItOutEnabled: true,
          requestInterceptor: function(request) {
            // Add any default headers if needed
            return request;
          },
          responseInterceptor: function(response) {
            return response;
          }
        });
        window.ui = ui;
      };
    </script>
  </body>
</html>`;
}

// ─── Spec JSON Handler ───────────────────────────────────────

/**
 * Return the OpenAPI specification as JSON
 * Suitable for Next.js API route handlers
 */
export function specHandler(spec: Record<string, any>): {
  status: number;
  headers: Record<string, string>;
  body: string;
} {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(spec, null, 2),
  };
}
