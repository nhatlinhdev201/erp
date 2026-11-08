// =============================================================================
// L-ERP MRP - SANITIZATION UTILITIES
// XSS prevention and input sanitization
// =============================================================================

// =============================================================================
// HTML ENTITIES
// =============================================================================

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

const ENTITY_REGEX = /[&<>"'`=\/]/g;

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(ENTITY_REGEX, char => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
}

/**
 * Strip all HTML tags
 */
export function stripTags(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for safe output
 */
export function sanitize(str: string): string {
  return escapeHtml(stripTags(str));
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitize(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) :
        item
      );
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// =============================================================================
// URL SANITIZATION
// =============================================================================

/**
 * Sanitize URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const scheme of dangerousSchemes) {
    if (trimmed.startsWith(scheme)) {
      return '';
    }
  }

  // Only allow http, https, mailto, tel
  const allowedSchemes = ['http://', 'https://', 'mailto:', 'tel:', '/'];
  const hasAllowedScheme = allowedSchemes.some(scheme =>
    trimmed.startsWith(scheme) || trimmed.startsWith('/')
  );

  if (!hasAllowedScheme && trimmed.includes(':')) {
    return '';
  }

  return url;
}

// =============================================================================
// SQL INJECTION PREVENTION
// =============================================================================

/**
 * Escape SQL special characters (backup - Prisma already handles this)
 */
export function escapeSql(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string, maxLength = 200): string {
  if (typeof query !== 'string') {
    return '';
  }

  // Truncate
  let sanitized = query.slice(0, maxLength);

  // Remove SQL keywords (basic protection)
  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND|WHERE|FROM|INTO)\b/gi;
  sanitized = sanitized.replace(sqlKeywords, '');

  // Remove special characters that could be used in SQL injection
  sanitized = sanitized.replace(/[;'"\\]/g, '');

  return sanitized.trim();
}

// =============================================================================
// FILENAME SANITIZATION
// =============================================================================

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return '';
  }

  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\x00/g, '')
    .replace(/\.\./g, '_');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized || 'untitled';
}

// =============================================================================
// TEMPLATE SANITIZATION (for label-generator fix)
// =============================================================================

/**
 * Safe template literal function
 */
export function safeTemplate(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    const sanitizedValue = typeof value === 'string' ? escapeHtml(value) : value;
    return result + (sanitizedValue ?? '') + str;
  });
}

/**
 * Sanitize data for HTML template generation
 */
export function sanitizeForTemplate<T extends Record<string, any>>(data: T): T {
  return sanitizeObject(data);
}

/**
 * Create safe HTML content (alternative to document.write)
 */
export function createSafeHtml(template: string, data: Record<string, any>): string {
  // Sanitize all data values
  const sanitizedData = sanitizeObject(data);

  // Replace placeholders with sanitized values
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = sanitizedData[key];
    return value !== undefined ? String(value) : '';
  });
}

// =============================================================================
// INPUT VALIDATION HELPERS
// =============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{7,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate part number format
 */
export function isValidPartNumber(partNumber: string): boolean {
  const partNumberRegex = /^[A-Z0-9][A-Z0-9-]{2,48}[A-Z0-9]$/i;
  return partNumberRegex.test(partNumber);
}

/**
 * Sanitize and validate part number
 */
export function sanitizePartNumber(partNumber: string): string {
  return partNumber
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 50);
}

// =============================================================================
// RATE LIMITING HELPERS
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetTime - now
  };
}

// Clean up old entries periodically (only in non-edge environments)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }, 60000);
}
