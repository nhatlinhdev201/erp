import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
    // Pre-compress assets for static hosting
    compression({ algorithm: 'gzip', exclude: [/\.(br|gz)$/] }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(br|gz)$/] }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },

  server: {
    port: 3019,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 3019,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Filter out large chunks from modulepreload — they load on demand via lazy routes
    modulePreload: {
      resolveDependencies: (_url, deps, { hostType }) => {
        if (hostType !== 'html') return deps;
        return deps.filter(
          (dep) => !dep.includes('charts') && !dep.includes('msw')
        );
      },
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Charts + visualization (large, lazy-loaded)
            if (/recharts|d3-|es-toolkit/.test(id)) return 'charts';
            // All Radix UI primitives
            if (/@radix-ui/.test(id)) return 'ui';
            // React core runtime
            if (/react-dom|react\/|scheduler/.test(id)) return 'vendor-react';
            // Router
            if (/react-router/.test(id)) return 'vendor-router';
            // Forms + validation
            if (/react-hook-form|@hookform|zod/.test(id)) return 'forms';
            // Data fetching
            if (/@tanstack\/react-query/.test(id)) return 'query';
            // Data table
            if (/@tanstack\/react-table/.test(id)) return 'datatable';
            // Date utilities
            if (/date-fns|react-day-picker/.test(id)) return 'dates';
            // Icons
            if (/lucide-react/.test(id)) return 'icons';
            // HTTP client
            if (/axios/.test(id)) return 'http';
            // MSW + its dependencies (loaded async, never blocks render)
            if (/msw|@mswjs|tough-cookie|tldts|statuses|cookie|headers-polyfill|outvariant|is-node-process/.test(id)) return 'msw';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Terser for better minification + dead code removal
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    target: 'es2022',
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios'],
  },
});
