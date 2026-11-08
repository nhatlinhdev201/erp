// src/lib/security/security-headers.ts
// Security headers configuration for L-ERP MRP System

export const securityHeaders = [
  // Prevent clickjacking
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Enable XSS protection
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Control referrer information
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Permissions policy
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Content Security Policy
  // Next.js requires 'unsafe-inline' for script hydration and style injection
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.anthropic.com https://generativelanguage.googleapis.com wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

// HSTS header (only in production)
export const hstsHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
};

// For next.config.js
export function getSecurityHeadersConfig() {
  return {
    async headers() {
      const headers = [...securityHeaders];

      // Add HSTS in production
      if (process.env.NODE_ENV === "production") {
        headers.push(hstsHeader);
      }

      return [
        {
          source: "/:path*",
          headers,
        },
      ];
    },
  };
}

// Apply headers to NextResponse
export function applySecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);

  for (const header of securityHeaders) {
    newHeaders.set(header.key, header.value);
  }

  if (process.env.NODE_ENV === "production") {
    newHeaders.set(hstsHeader.key, hstsHeader.value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Security check utilities
export const securityUtils = {
  // Check for common injection patterns
  hasInjectionPattern(input: string): boolean {
    const patterns = [
      /<script\b/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /;\s*drop\s+/i,
      /--\s*$/,
      /\/\*.*\*\//,
    ];
    return patterns.some((pattern) => pattern.test(input));
  },

  // Sanitize filename
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".")
      .substring(0, 255);
  },

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check password strength
  checkPasswordStrength(password: string): {
    strong: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      issues.push("Password must contain an uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      issues.push("Password must contain a lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      issues.push("Password must contain a number");
    }

    return { strong: issues.length === 0, issues };
  },
};
