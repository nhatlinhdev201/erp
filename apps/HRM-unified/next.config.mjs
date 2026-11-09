/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // ═══════════════════════════════════════════════════════════════
  // BUILD SETTINGS - Ignore lint/type errors for faster builds
  // ═══════════════════════════════════════════════════════════════
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // IMAGE OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTION OPTIMIZATIONS
  // ═══════════════════════════════════════════════════════════════
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression

  // ═══════════════════════════════════════════════════════════════
  // EXPERIMENTAL FEATURES
  // ═══════════════════════════════════════════════════════════════
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      'sonner',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECURITY HEADERS - HARDENED
  // ═══════════════════════════════════════════════════════════════
  async headers() {
    // Dev: cho phép trang gọi cross-origin tới các module L-ERP (3010–3022) + Kong (18000)
    // Production: khai báo thêm qua CSP_CONNECT_EXTRA (comma-separated), VÍ DỤ: https://api.linkk-erp.com
    const extraConnect = (
      process.env.CSP_CONNECT_EXTRA ||
      (process.env.NODE_ENV === 'production'
        ? ''
        : [18000, ...Array.from({ length: 13 }, (_, i) => 3010 + i)]
            .map((p) => `http://localhost:${p}`)
            .join(' '))
    )
      .split(/[ ,]+/)
      .filter(Boolean)
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              `connect-src 'self' wss:${extraConnect.length ? ' ' + extraConnect.join(' ') : ''}`,
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          ...(process.env.NODE_ENV === 'production'
            ? [{
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains',
              }]
            : []),
        ],
      },
      // API routes - no caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // WEBPACK OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════
  webpack: (config, { dev, isServer }) => {
    // Production optimizations only
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Recharts + D3 (heavy visualization library)
            recharts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              name: 'recharts',
              chunks: 'async',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Date-fns
            dateFns: {
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              name: 'date-fns',
              chunks: 'async',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'async',
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI components
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui-components',
              chunks: 'all',
              priority: 15,
            },
            // Remaining vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'async',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },
}

export default nextConfig
