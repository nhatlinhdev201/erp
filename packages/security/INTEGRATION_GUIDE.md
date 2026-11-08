# TIP-015 Integration Guide

Complete integration guide for implementing security headers, CORS, CSRF protection, and input sanitization across L-ERP applications.

## Table of Contents

- [Quick Setup](#quick-setup)
- [Next.js Apps](#nextjs-apps)
- [Express/NestJS Apps](#expressnestjs-apps)
- [API Security](#api-security)
- [Frontend Security](#frontend-security)
- [Common Patterns](#common-patterns)
- [Testing](#testing)

## Quick Setup

### 1. Install Package

The package is already available in the monorepo:

```bash
npm install @erp/security
```

### 2. Import What You Need

```typescript
// Headers
import { securityHeaders, strictSecurityHeaders, devSecurityHeaders } from '@erp/security';

// CORS
import { corsConfig, developmentCORS, productionCORS, internalServiceCORS } from '@erp/security';

// Middleware
import { withSecurityHeaders, securityMiddleware, applySecurityHeaders } from '@erp/security';

// CSRF
import { csrfProtection, generateCSRFToken, validateCSRFToken } from '@erp/security';

// Sanitization
import { sanitizeInput, sanitizeQuery, sanitizeEmail, validateVietnamesePhone } from '@erp/security';
```

## Next.js Apps

### 1. Configure next.config.js

**apps/CRM/next.config.js:**
```javascript
import { securityHeaders, devSecurityHeaders } from '@erp/security';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  reactStrictMode: true,

  async headers() {
    const headerConfig = isProduction
      ? {
          cspDirectives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'strict-dynamic'"],
            'style-src': ["'self'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'connect-src': ["'self'", 'https://api.lerp.com'],
          },
        }
      : {};

    const headers = isProduction
      ? securityHeaders(headerConfig)
      : devSecurityHeaders(headerConfig);

    return [
      {
        source: '/:path*',
        headers,
      },
    ];
  },
};
```

### 2. Secure API Routes

**apps/CRM/pages/api/contacts.ts:**
```typescript
import { withSecurityHeaders } from '@erp/security';

export default withSecurityHeaders(
  async (req, res) => {
    if (req.method === 'GET') {
      res.status(200).json({ contacts: [] });
    }
  },
  {
    environment: process.env.NODE_ENV as any,
    enableCors: true,
    enableHeaders: true,
  }
);
```

### 3. Add CSRF Protection to Forms

**apps/CRM/pages/api/contacts/create.ts:**
```typescript
import { csrfProtection } from '@erp/security';

export default csrfProtection(
  async (req, res) => {
    if (req.method === 'POST') {
      // Token already validated by middleware
      const contactData = req.body;
      res.status(201).json({ id: 1, ...contactData });
    }
  },
  { rotateToken: true }
);
```

**apps/CRM/components/ContactForm.tsx:**
```typescript
import { useEffect, useState } from 'react';

export default function ContactForm() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // Fetch CSRF token
    fetch('/api/contacts/create')
      .then(res => {
        // Extract token from Set-Cookie header
        setCsrfToken(res.headers.get('Set-Cookie') || '');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const response = await fetch('/api/contacts/create', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
      }),
    });

    if (response.ok) {
      console.log('Contact created');
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### 4. Sanitize User Input

**apps/CRM/pages/api/contacts/[id].ts:**
```typescript
import { withSecurityHeaders } from '@erp/security';
import { sanitizeInput, sanitizeEmail, sanitizeQuery } from '@erp/security';

export default withSecurityHeaders(
  async (req, res) => {
    if (req.method === 'PUT') {
      // Sanitize input
      const sanitized = {
        name: sanitizeInput(req.body.name),
        email: sanitizeEmail(req.body.email),
      };

      // Update contact
      res.status(200).json({ success: true, data: sanitized });
    }
  },
  { enableCors: true }
);
```

## Express/NestJS Apps

### 1. Apply Security Middleware

**apps/TPM-api-nestjs/main.ts:**
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { securityMiddleware } from '@erp/security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply security middleware
  app.use(securityMiddleware({
    environment: 'production',
    enableHeaders: true,
    enableCors: true,
    cors: {
      origin: [
        'https://app.lerp.com',
        'https://admin.lerp.com',
      ],
      credentials: true,
    },
  }));

  await app.listen(3001);
}

bootstrap();
```

### 2. Protect Individual Routes

**apps/TPM-api-nestjs/contacts/contacts.controller.ts:**
```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { sanitizeInput, sanitizeEmail } from '@erp/security';

@Controller('contacts')
export class ContactsController {
  @Get()
  async getContacts() {
    return { contacts: [] };
  }

  @Post()
  async createContact(@Body() body: any) {
    // Sanitize input
    const sanitized = {
      name: sanitizeInput(body.name),
      email: sanitizeEmail(body.email),
    };

    return { id: 1, ...sanitized };
  }
}
```

## API Security

### 1. CORS Configuration

**Production:**
```typescript
import { productionCORS } from '@erp/security';

const corsConfig = productionCORS([
  'https://app.lerp.com',
  'https://admin.lerp.com',
  'https://api.lerp.com',
]);
```

**Internal Services:**
```typescript
import { internalServiceCORS } from '@erp/security';

const corsConfig = internalServiceCORS([
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
]);
```

### 2. Environment Variables

**.env.production:**
```bash
ALLOWED_ORIGINS=https://app.lerp.com,https://admin.lerp.com
NODE_ENV=production
```

**.env.development:**
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
NODE_ENV=development
```

## Frontend Security

### 1. Prevent XSS in Templates

```typescript
// BAD - vulnerable to XSS
const html = `<div>${userInput}</div>`;

// GOOD - sanitized
import { sanitizeInput } from '@erp/security';
const safe = sanitizeInput(userInput);
const html = `<div>${safe}</div>`;
```

### 2. CSRF Token Handling

```typescript
// Get token on page load
async function initCSRFToken() {
  const response = await fetch('/api/csrf-token');
  const token = response.headers.get('X-CSRF-Token');

  // Store for use in POST/PUT/DELETE requests
  sessionStorage.setItem('csrf-token', token);
}

// Use in requests
async function submitForm(data: any) {
  const token = sessionStorage.getItem('csrf-token');

  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}
```

### 3. Validate User Input on Client

```typescript
import { validateVietnamesePhone, sanitizeEmail } from '@erp/security';

function validateContactForm(formData: any) {
  const errors: string[] = [];

  if (!sanitizeEmail(formData.email)) {
    errors.push('Invalid email');
  }

  if (!validateVietnamesePhone(formData.phone)) {
    errors.push('Invalid Vietnamese phone number');
  }

  return errors;
}
```

## Common Patterns

### 1. Protect API with Headers and CORS

```typescript
import { withSecurityHeaders } from '@erp/security';

export default withSecurityHeaders(
  async (req, res) => {
    // Your handler
  },
  {
    environment: 'production',
    enableHeaders: true,
    enableCors: true,
    cors: {
      origin: ['https://app.lerp.com'],
    },
  }
);
```

### 2. Custom CSP Directives

```typescript
import { securityHeaders } from '@erp/security';

const headers = securityHeaders({
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdn.example.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
  },
  reportUri: 'https://csp.example.com/report',
});
```

### 3. Validate Query Parameters

```typescript
import { sanitizeQuery } from '@erp/security';

export default async (req: any, res: any) => {
  const safeQuery = sanitizeQuery(req.query);

  // safeQuery is now safe to use
  const { page, limit, search } = safeQuery;

  res.json({ page, limit, search });
};
```

## Testing

### 1. Test Security Headers

```typescript
import { securityHeaders } from '@erp/security';

describe('Security Headers', () => {
  it('should include X-Content-Type-Options header', () => {
    const headers = securityHeaders();
    const header = headers.find(h => h.key === 'X-Content-Type-Options');

    expect(header).toBeDefined();
    expect(header?.value).toBe('nosniff');
  });

  it('should include CSP header', () => {
    const headers = securityHeaders();
    const header = headers.find(h => h.key === 'Content-Security-Policy');

    expect(header).toBeDefined();
    expect(header?.value).toContain('default-src');
  });
});
```

### 2. Test CSRF Protection

```typescript
import { generateCSRFToken, validateCSRFToken } from '@erp/security';

describe('CSRF Protection', () => {
  it('should generate and validate token', () => {
    const sessionId = 'test-session-123';
    const token = generateCSRFToken(sessionId);

    expect(token).toBeDefined();
    expect(validateCSRFToken(sessionId, token)).toBe(true);
  });

  it('should reject invalid token', () => {
    const sessionId = 'test-session-123';
    const valid = generateCSRFToken(sessionId);

    expect(validateCSRFToken(sessionId, 'invalid-token')).toBe(false);
  });
});
```

### 3. Test Input Sanitization

```typescript
import { sanitizeInput, sanitizeEmail } from '@erp/security';

describe('Input Sanitization', () => {
  it('should escape XSS attempts', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(input);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });

  it('should validate email addresses', () => {
    expect(sanitizeEmail('user@example.com')).toBeTruthy();
    expect(sanitizeEmail('invalid-email')).toBeNull();
  });
});
```

---

## Troubleshooting

### 1. CSP Violations

If you see CSP violations in the browser console:

1. Check the CSP directives in your `next.config.js`
2. Add trusted sources to `script-src`, `style-src`, etc.
3. Use `reportUri` to collect CSP violations

### 2. CORS Errors

If you see CORS errors:

1. Verify `ALLOWED_ORIGINS` environment variable
2. Check that your frontend origin is in the allowlist
3. Ensure credentials are enabled if needed

### 3. CSRF Token Expiry

If CSRF tokens expire unexpectedly:

1. Check token rotation settings
2. Verify max-age cookie setting
3. Ensure tokens are refreshed on page load

---

## Support

For issues or questions, refer to:

- Package README: `/packages/security/README.md`
- Type definitions: `/packages/security/src/*.ts`
- Example implementations: Look at existing apps in `/apps/`
