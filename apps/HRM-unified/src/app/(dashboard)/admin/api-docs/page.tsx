'use client'

// src/app/(dashboard)/admin/api-docs/page.tsx
// Swagger UI for API Documentation

import { useEffect, useRef } from 'react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'

export default function ApiDocsPage() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Dynamically load Swagger UI
        const loadSwaggerUI = async () => {
            // Load CSS
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'
            document.head.appendChild(link)

            // Load JS
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
            script.onload = () => {
                // @ts-expect-error SwaggerUIBundle is loaded dynamically
                window.SwaggerUIBundle({
                    url: '/api/docs',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        // @ts-expect-error SwaggerUIBundle is loaded dynamically
                        window.SwaggerUIBundle.presets.apis,
                        // @ts-expect-error SwaggerUIStandalonePreset is loaded dynamically
                        window.SwaggerUIStandalonePreset,
                    ],
                    plugins: [
                        // @ts-expect-error SwaggerUIBundle is loaded dynamically
                        window.SwaggerUIBundle.plugins.DownloadUrl,
                    ],
                    layout: 'StandaloneLayout',
                    defaultModelsExpandDepth: 2,
                    defaultModelExpandDepth: 2,
                    displayRequestDuration: true,
                    filter: true,
                    showExtensions: true,
                    showCommonExtensions: true,
                    tryItOutEnabled: true,
                })
            }
            document.body.appendChild(script)
        }

        loadSwaggerUI()

        return () => {
            // Cleanup
            const swaggerLinks = document.querySelectorAll('link[href*="swagger-ui"]')
            const swaggerScripts = document.querySelectorAll('script[src*="swagger-ui"]')
            swaggerLinks.forEach(link => link.remove())
            swaggerScripts.forEach(script => script.remove())
        }
    }, [])

    return (
        <PageContainer>
            <PageHeader
                title="API Documentation"
                description="OpenAPI 3.0 specification cho L-ERP HRM API"
            />

            <div className="mt-6 rounded-lg border bg-white dark:bg-card">
                <div
                    id="swagger-ui"
                    ref={containerRef}
                    className="min-h-[800px]"
                />
            </div>

            <style jsx global>{`
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui {
          font-family: var(--font-sans);
        }
        .swagger-ui .info .title {
          font-family: var(--font-sans);
        }
        .swagger-ui .btn {
          font-family: var(--font-sans);
        }
        .dark .swagger-ui {
          background: transparent;
        }
        .dark .swagger-ui .info .title,
        .dark .swagger-ui .info .description,
        .dark .swagger-ui .opblock-tag,
        .dark .swagger-ui .opblock-summary-description,
        .dark .swagger-ui .opblock-description-wrapper p,
        .dark .swagger-ui table thead tr th,
        .dark .swagger-ui table tbody tr td,
        .dark .swagger-ui .parameter__name,
        .dark .swagger-ui .parameter__type,
        .dark .swagger-ui .response-col_status,
        .dark .swagger-ui .response-col_description {
          color: #DDE1E8 !important;
        }
        .dark .swagger-ui .opblock {
          background: rgba(255, 255, 255, 0.03);
          border-color: #282835;
        }
        .dark .swagger-ui .opblock .opblock-summary {
          border-color: #282835;
        }
        .dark .swagger-ui .opblock-body pre {
          background: #1e1e2e;
        }
        .dark .swagger-ui section.models {
          border-color: #282835;
        }
        .dark .swagger-ui .model-box {
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>
        </PageContainer>
    )
}
