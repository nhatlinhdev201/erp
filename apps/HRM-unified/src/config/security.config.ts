// config/security.config.ts

/**
 * LAC VIET HR - Security Configuration
 * Centralized security settings for the application
 */

// ════════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT HELPERS
// ════════════════════════════════════════════════════════════════════════════════

const isProduction = process.env.NODE_ENV === 'production';

// ════════════════════════════════════════════════════════════════════════════════
// SECURITY CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

export const SecurityConfig = {
  // ─────────────────────────────────────────────────────────────────────────────
  // JWT SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  jwt: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256' as const,
    issuer: 'lerp-hrm',
    audience: 'lerp-hr-users',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD POLICY
  // ─────────────────────────────────────────────────────────────────────────────
  password: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    historyCount: 5, // Number of previous passwords to check
    expiryDays: 90, // Password expiry in days (0 to disable)
    bcryptRounds: 12,
    commonPasswordsCheck: true,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  session: {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    inactivityTimeout: 30 * 60, // 30 minutes in seconds
    maxConcurrent: 5, // Maximum concurrent sessions per user
    extendOnActivity: true,
    validateFingerprint: true,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCOUNT LOCKOUT
  // ─────────────────────────────────────────────────────────────────────────────
  lockout: {
    maxAttempts: 5,
    attemptWindowSeconds: 15 * 60, // 15 minutes
    lockoutDurations: [
      5 * 60,       // First: 5 minutes
      15 * 60,      // Second: 15 minutes
      30 * 60,      // Third: 30 minutes
      60 * 60,      // Fourth: 1 hour
      24 * 60 * 60, // Fifth+: 24 hours
    ],
    ipMaxAttempts: 20,
    ipAttemptWindowSeconds: 60 * 60, // 1 hour
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // RATE LIMITING
  // ─────────────────────────────────────────────────────────────────────────────
  rateLimit: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
    },
    auth: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 login attempts per 15 minutes
      },
      passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
      },
    },
    api: {
      read: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
      },
      write: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
      },
      upload: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
      },
      export: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20,
      },
    },
    ip: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY HEADERS
  // ─────────────────────────────────────────────────────────────────────────────
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL || ''].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProduction,
    },
    xFrameOptions: 'DENY' as const,
    xContentTypeOptions: 'nosniff' as const,
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: ['self'],
      payment: [],
      usb: [],
      accelerometer: [],
      gyroscope: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CORS
  // ─────────────────────────────────────────────────────────────────────────────
  cors: {
    origins: [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://lerp-hrm.com',
      'https://www.lerp-hrm.com',
    ].filter(Boolean) as string[],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-ID',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CSRF
  // ─────────────────────────────────────────────────────────────────────────────
  csrf: {
    tokenLength: 32,
    tokenExpiry: 24 * 60 * 60, // 24 hours
    cookieName: '__Host-csrf-token',
    headerName: 'x-csrf-token',
    excludePaths: ['/api/webhooks/', '/api/public/', '/api/health'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MFA
  // ─────────────────────────────────────────────────────────────────────────────
  mfa: {
    issuer: process.env.MFA_ISSUER || 'LAC VIET HR',
    backupCodesCount: 10,
    totpWindow: 1, // Allow 1 step before/after current time
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT
  // ─────────────────────────────────────────────────────────────────────────────
  audit: {
    enabled: true,
    retentionDays: 90,
    sensitiveFields: ['password', 'token', 'secret', 'creditCard', 'ssn'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────────────────────────────────────────
  upload: {
    maxSize: {
      avatar: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      default: 10 * 1024 * 1024, // 10MB
    },
    allowedTypes: {
      avatar: ['image/jpeg', 'image/png', 'image/webp'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
    },
  },
};

export default SecurityConfig;
