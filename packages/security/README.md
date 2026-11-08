# @erp/security — Security Headers, CORS, CSRF, Sanitization

Comprehensive security package for L-ERP with native Next.js/Express integration. Implements TIP-015 security hardening across the monorepo.

**[English](#english) | [Tiếng Việt](#tiếng-việt)**

---

## English

### Features

- **Security Headers** — X-Content-Type-Options, X-Frame-Options, CSP, HSTS, Referrer-Policy
- **CORS** — Preset configurations (development, production, internal service)
- **CSRF Protection** — Double-submit cookie pattern with token rotation
- **Input Sanitization** — XSS prevention, SQL injection prevention, Vietnamese phone validation
- **Express Middleware** — Ready-to-use middleware for Express/NestJS
- **Next.js Integration** — API route wrapper and middleware compatibility
- **Zero Dependencies** — No helmet.js, implemented natively for compatibility

### Installation

```bash
npm install @erp/security
```

### Quick Start

#### Security Headers in Next.js

**next.config.js:**
```javascript
import { securityHeaders } from '@erp/security';

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          cspDirectives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", 'https://cdn.example.com'],
          },
          hsts: true,
          hstsMaxAge: 31536000,
        }),
      },
    ];
  },
};
```

#### API Route with Security Wrapper

**pages/api/users.ts:**
```typescript
import { withSecurityHeaders } from '@erp/security';

export default withSecurityHeaders(
  async (req, res) => {
    res.status(200).json({ message: 'Xin chào' });
  },
  {
    environment: 'production',
    enableCors: true,
    enableHeaders: true,
  }
);
```

#### Express Middleware

**app.ts:**
```typescript
import express from 'express';
import { securityMiddleware } from '@erp/security';

const app = express();

app.use(securityMiddleware({
  environment: 'production',
  enableHeaders: true,
  enableCors: true,
}));

app.get('/api/users', (req, res) => {
  res.json({ message: 'ok' });
});
```

#### CORS Configuration

**Development:**
```typescript
import { developmentCORS } from '@erp/security';

const corsConfig = developmentCORS(); // Allows all origins
```

**Production:**
```typescript
import { productionCORS } from '@erp/security';

const corsConfig = productionCORS([
  'https://app.lerp.com',
  'https://admin.lerp.com',
]);
```

**Internal Services:**
```typescript
import { internalServiceCORS } from '@erp/security';

const corsConfig = internalServiceCORS([
  'http://localhost:3001',
  'http://localhost:3002',
]);
```

#### CSRF Protection

**pages/api/submit.ts:**
```typescript
import { csrfProtection } from '@erp/security';

export default csrfProtection(
  async (req, res) => {
    if (req.method === 'POST') {
      res.status(200).json({ success: true });
    }
  },
  { rotateToken: true }
);
```

**Frontend:**
```typescript
// Get token on page load
const response = await fetch('/api/submit');
const csrfToken = response.headers.get('Set-Cookie');

// Include in POST requests
const result = await fetch('/api/submit', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ data: 'value' }),
});
```

#### Input Sanitization

```typescript
import {
  sanitizeInput,
  sanitizeQuery,
  sanitizeEmail,
  validateVietnamesePhone,
} from '@erp/security';

// XSS prevention
const clean = sanitizeInput(userInput);
// '<script>alert("xss")</script>' → '&lt;script&gt;...'

// Query parameter sanitization
const safParams = sanitizeQuery(req.query);

// Email validation
const email = sanitizeEmail('user@example.com');

// Vietnamese phone validation
if (validateVietnamesePhone('+84912345678')) {
  console.log('Valid Vietnamese phone');
}
```

### API Reference

#### Headers

```typescript
// Generate security headers
securityHeaders(config?: SecurityHeadersConfig)

// Get strict CSP config (production-ready)
strictSecurityHeaders(config?: SecurityHeadersConfig)

// Get development-friendly config
devSecurityHeaders(config?: SecurityHeadersConfig)
```

#### CORS

```typescript
// Create CORS configuration
corsConfig(options?: CORSOptions)

// Presets
developmentCORS()
productionCORS(allowedOrigins?: string[])
internalServiceCORS(serviceOrigins?: string[])

// Apply CORS headers to response
applyCORSHeaders(headers: Record<string, string>, options: CORSOptions)
```

#### Middleware

```typescript
// Next.js API route wrapper
withSecurityHeaders(handler: NextApiHandler, config?: SecurityMiddlewareConfig)

// Express middleware
securityMiddleware(config?: SecurityMiddlewareConfig)

// Apply headers to response object
applySecurityHeaders(responseOrHeaders?: any, config?: SecurityMiddlewareConfig)
```

#### CSRF

```typescript
// Generate token
generateCSRFToken(sessionId: string): string

// Validate token
validateCSRFToken(sessionId: string, token: string): boolean

// Rotate token (invalidate old, generate new)
rotateCSRFToken(sessionId: string): string

// Get token without rotation
getCSRFToken(sessionId: string): string | null

// Wrapper for Next.js API routes
csrfProtection(handler: NextApiHandler, options?: CSRFTokenOptions)
```

#### Sanitization

```typescript
// Basic XSS prevention
sanitizeInput(input: unknown): string

// Remove all HTML tags
sanitizeHTML(input: unknown): string

// Validate identifier (table names, column names)
validateIdentifier(identifier: string): boolean

// Validate and sanitize query parameter
validateQueryParam(value: unknown): boolean

// Sanitize query object
sanitizeQuery(params: Record<string, unknown>)

// Email validation
sanitizeEmail(email: unknown): string | null

// URL validation
sanitizeURL(url: unknown): string | null

// Number validation
sanitizeNumber(value: unknown, min?: number, max?: number): number | null

// Phone validation
sanitizePhoneNumber(phone: unknown): string | null

// Vietnamese phone validation
validateVietnamesePhone(phone: string): boolean
```

### Environment Variables

```bash
# Allowed origins for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://app.lerp.com

# Node environment
NODE_ENV=production
```

---

## Tiếng Việt

### Các Tính Năng

- **Security Headers** — X-Content-Type-Options, X-Frame-Options, CSP, HSTS, Referrer-Policy
- **CORS** — Các cấu hình sẵn (phát triển, sản xuất, dịch vụ nội bộ)
- **Bảo vệ CSRF** — Mẫu double-submit cookie với quay vòng token
- **Vệ sinh dữ liệu đầu vào** — Phòng chống XSS, phòng chống SQL injection, xác thực số điện thoại Việt Nam
- **Express Middleware** — Middleware sẵn dùng cho Express/NestJS
- **Tích hợp Next.js** — Wrapper API route và khả năng tương thích middleware
- **Không phụ thuộc bên ngoài** — Không helmet.js, tự xây dựng để tương thích

### Cài Đặt

```bash
npm install @erp/security
```

### Bắt Đầu Nhanh

#### Security Headers trong Next.js

**next.config.js:**
```javascript
import { securityHeaders } from '@erp/security';

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          cspDirectives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", 'https://cdn.example.com'],
          },
          hsts: true,
          hstsMaxAge: 31536000,
        }),
      },
    ];
  },
};
```

#### API Route với Wrapper Bảo Vệ

**pages/api/users.ts:**
```typescript
import { withSecurityHeaders } from '@erp/security';

export default withSecurityHeaders(
  async (req, res) => {
    res.status(200).json({ message: 'Xin chào' });
  },
  {
    environment: 'production',
    enableCors: true,
    enableHeaders: true,
  }
);
```

#### Express Middleware

**app.ts:**
```typescript
import express from 'express';
import { securityMiddleware } from '@erp/security';

const app = express();

app.use(securityMiddleware({
  environment: 'production',
  enableHeaders: true,
  enableCors: true,
}));

app.get('/api/users', (req, res) => {
  res.json({ message: 'ok' });
});
```

#### Cấu Hình CORS

**Phát triển:**
```typescript
import { developmentCORS } from '@erp/security';

const corsConfig = developmentCORS(); // Cho phép tất cả origins
```

**Sản xuất:**
```typescript
import { productionCORS } from '@erp/security';

const corsConfig = productionCORS([
  'https://app.lerp.com',
  'https://admin.lerp.com',
]);
```

**Dịch vụ nội bộ:**
```typescript
import { internalServiceCORS } from '@erp/security';

const corsConfig = internalServiceCORS([
  'http://localhost:3001',
  'http://localhost:3002',
]);
```

#### Bảo Vệ CSRF

**pages/api/submit.ts:**
```typescript
import { csrfProtection } from '@erp/security';

export default csrfProtection(
  async (req, res) => {
    if (req.method === 'POST') {
      res.status(200).json({ success: true });
    }
  },
  { rotateToken: true }
);
```

**Frontend:**
```typescript
// Lấy token khi tải trang
const response = await fetch('/api/submit');
const csrfToken = response.headers.get('Set-Cookie');

// Bao gồm trong các yêu cầu POST
const result = await fetch('/api/submit', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ data: 'value' }),
});
```

#### Vệ sinh dữ liệu đầu vào

```typescript
import {
  sanitizeInput,
  sanitizeQuery,
  sanitizeEmail,
  validateVietnamesePhone,
} from '@erp/security';

// Phòng chống XSS
const clean = sanitizeInput(userInput);
// '<script>alert("xss")</script>' → '&lt;script&gt;...'

// Vệ sinh tham số truy vấn
const safParams = sanitizeQuery(req.query);

// Xác thực email
const email = sanitizeEmail('user@example.com');

// Xác thực số điện thoại Việt Nam
if (validateVietnamesePhone('+84912345678')) {
  console.log('Số điện thoại Việt Nam hợp lệ');
}
```

### Tham Khảo API

#### Headers

```typescript
// Tạo security headers
securityHeaders(config?: SecurityHeadersConfig)

// Lấy cấu hình CSP nghiêm ngặt (sẵn sàng sản xuất)
strictSecurityHeaders(config?: SecurityHeadersConfig)

// Lấy cấu hình thân thiện phát triển
devSecurityHeaders(config?: SecurityHeadersConfig)
```

#### CORS

```typescript
// Tạo cấu hình CORS
corsConfig(options?: CORSOptions)

// Cấu hình sẵn
developmentCORS()
productionCORS(allowedOrigins?: string[])
internalServiceCORS(serviceOrigins?: string[])

// Áp dụng CORS headers cho response
applyCORSHeaders(headers: Record<string, string>, options: CORSOptions)
```

#### Middleware

```typescript
// Wrapper Next.js API route
withSecurityHeaders(handler: NextApiHandler, config?: SecurityMiddlewareConfig)

// Express middleware
securityMiddleware(config?: SecurityMiddlewareConfig)

// Áp dụng headers cho response object
applySecurityHeaders(responseOrHeaders?: any, config?: SecurityMiddlewareConfig)
```

#### CSRF

```typescript
// Tạo token
generateCSRFToken(sessionId: string): string

// Xác thực token
validateCSRFToken(sessionId: string, token: string): boolean

// Quay vòng token (vô hiệu hóa cũ, tạo cái mới)
rotateCSRFToken(sessionId: string): string

// Lấy token mà không quay vòng
getCSRFToken(sessionId: string): string | null

// Wrapper cho Next.js API routes
csrfProtection(handler: NextApiHandler, options?: CSRFTokenOptions)
```

#### Vệ sinh dữ liệu

```typescript
// Phòng chống XSS cơ bản
sanitizeInput(input: unknown): string

// Xóa tất cả các thẻ HTML
sanitizeHTML(input: unknown): string

// Xác thực identifier (tên bảng, tên cột)
validateIdentifier(identifier: string): boolean

// Xác thực và vệ sinh tham số truy vấn
validateQueryParam(value: unknown): boolean

// Vệ sinh đối tượng truy vấn
sanitizeQuery(params: Record<string, unknown>)

// Xác thực email
sanitizeEmail(email: unknown): string | null

// Xác thực URL
sanitizeURL(url: unknown): string | null

// Xác thực số
sanitizeNumber(value: unknown, min?: number, max?: number): number | null

// Xác thực số điện thoại
sanitizePhoneNumber(phone: unknown): string | null

// Xác thực số điện thoại Việt Nam
validateVietnamesePhone(phone: string): boolean
```

### Biến Môi Trường

```bash
# Các origins được phép cho CORS (phân tách bằng dấu phẩy)
ALLOWED_ORIGINS=http://localhost:3000,https://app.lerp.com

# Môi trường Node
NODE_ENV=production
```

---

## License

MIT — L-ERP Project
