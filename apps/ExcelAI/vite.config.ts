import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'ExcelAI',
        short_name: 'ExcelAI',
        description: 'AI-Native Spreadsheet Platform - Works Offline',
        theme_color: '#217346',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\/workbooks\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor splits
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/recharts')) return 'vendor-charts';
          if (id.includes('node_modules/xlsx')) return 'vendor-xlsx';
          if (id.includes('node_modules/exceljs')) return 'vendor-exceljs';
          if (id.includes('node_modules/zustand')) return 'vendor-zustand';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules/@tanstack')) return 'vendor-virtual';
          if (id.includes('node_modules/hono')) return 'vendor-hono';

          // Application code splits — heavy feature modules
          if (id.includes('/src/engine/functions/')) return 'engine-functions';
          if (id.includes('/src/engine/')) return 'engine-core';
          if (id.includes('/src/ai/')) return 'ai-runtime';
          if (id.includes('/src/collaboration/')) return 'collab';
          if (id.includes('/src/datacleaner/')) return 'datacleaner';
          if (id.includes('/src/nlformula/')) return 'nlformula';
          if (id.includes('/src/autoviz/')) return 'autoviz';
          if (id.includes('/src/macros/')) return 'macros';
          if (id.includes('/src/proactive/')) return 'proactive';
          if (id.includes('/src/powerquery/')) return 'powerquery';
          if (id.includes('/src/utils/excelIO')) return 'excel-io';
          if (id.includes('/src/utils/xlsxFidelity')) return 'excel-io';
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3018,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 600000, // 10 minutes for large file uploads
        configure: (proxy) => {
          proxy.on('error', () => {
            // Proxy error handled silently
          });
        },
      },
    },
  },
})
