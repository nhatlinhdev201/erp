/**
 * Next.js Security Configuration Template
 * Based on TIP-015: Security Hardening
 *
 * Copy this template into your app's next.config.js and customize the headers configuration
 *
 * Usage:
 * // next.config.js
 * import { securityHeaders } from '@erp/security';
 * import securityConfig from '../../next.config.security.js';
 *
 * export default securityConfig;
 */

import { securityHeaders, strictSecurityHeaders, devSecurityHeaders } from '@erp/security';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * CSP directives configuration
 * Customize these based on your app's needs
 */
const cspDirectives = isProduction
  ? {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'strict-dynamic'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'", 'https://api.lerp.com'],
      'frame-ancestors': ["'self'"],
      'upgrade-insecure-requests': [],
    }
  : {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https:', 'ws:', 'wss:'],
      'frame-ancestors': ["'self'"],
    };

/**
 * Generate Next.js headers configuration
 */
function getSecurityHeaders() {
  const config = {
    cspDirectives,
    frameAncestors: ["'self'"],
    hsts: isProduction,
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubdomains: true,
  };

  return isProduction
    ? strictSecurityHeaders(config)
    : devSecurityHeaders(config);
}

/**
 * Next.js configuration with security headers
 */
export default {
  reactStrictMode: true,
  swcMinify: true,

  /**
   * Apply security headers to all routes
   */
  async headers() {
    const securityHdrs = getSecurityHeaders();

    return [
      {
        source: '/:path*',
        headers: securityHdrs,
      },
      // Additional security headers for API routes
      {
        source: '/api/:path*',
        headers: [
          ...securityHdrs,
          {
            key: 'X-API-Version',
            value: '1',
          },
        ],
      },
      // Cache headers for static assets
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  /**
   * Redirect HTTP to HTTPS in production
   */
  async redirects() {
    if (!isProduction) {
      return [];
    }

    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: '(?!https)',
          },
        ],
        destination: 'https://:host/:path*',
        permanent: true,
      },
    ];
  },

  /**
   * Security environment variables
   */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },

  /**
   * Experimental security features (optional)
   */
  experimental: {
    // Enable instrumentation to monitor security events
    // instrumentationHook: true,
  },
};
