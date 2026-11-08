# @linkk/rate-limit

Gói giới hạn tỷ lệ (Rate Limiting) cho L-ERP, được xây dựng với Redis và hỗ trợ nhiều chiến lược linh hoạt.

---

**Rate limiting package for L-ERP, built with Redis and supporting multiple flexible strategies.**

## Tính Năng / Features

### Tiếng Việt
- ✅ Ba chiến lược giới hạn tỷ lệ: Fixed Window, Sliding Window, Token Bucket
- ✅ Tích hợp sẵn với Redis và ioredis
- ✅ Hỗ trợ Next.js API routes và Express middleware
- ✅ Tự động phát hiện IP từ headers (x-forwarded-for, x-real-ip, socket)
- ✅ Hỗ trợ khóa tùy chỉnh (theo IP, user ID, API key)
- ✅ Những tier mặc định: PUBLIC, AUTHENTICATED, ADMIN, WEBHOOK
- ✅ TypeScript strict mode
- ✅ ESM và CJS tương thích

### English
- ✅ Three rate limiting strategies: Fixed Window, Sliding Window, Token Bucket
- ✅ Built-in Redis and ioredis integration
- ✅ Support for Next.js API routes and Express middleware
- ✅ Auto-detect IP from headers (x-forwarded-for, x-real-ip, socket)
- ✅ Custom key generator support (by IP, user ID, API key)
- ✅ Default tiers: PUBLIC, AUTHENTICATED, ADMIN, WEBHOOK
- ✅ TypeScript strict mode
- ✅ ESM and CJS compatible

## Cài Đặt / Installation

```bash
npm install @linkk/rate-limit ioredis rate-limiter-flexible
```

## Sử Dụng / Usage

### Khởi Tạo Cơ Bản / Basic Setup

```typescript
import Redis from 'ioredis';
import { createRateLimiter } from '@linkk/rate-limit';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

const limiter = createRateLimiter({
  redis,
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  blockDuration: 60, // block for 60 seconds if exceeded
});

// Sử dụng / Use
const result = await limiter.consume('user:123');
console.log(result.allowed); // true/false
console.log(result.pointsRemaining);
```

### Next.js API Routes

```typescript
// pages/api/users.ts
import { withRateLimit, AUTHENTICATED_TIER } from '@linkk/rate-limit';
import Redis from 'ioredis';

const redis = new Redis();

const handler = async (req, res) => {
  res.status(200).json({ message: 'Success' });
};

export default withRateLimit(handler, {
  ...AUTHENTICATED_TIER,
  redis,
});
```

### Express Middleware

```typescript
import express from 'express';
import { rateLimitMiddleware, PUBLIC_TIER } from '@linkk/rate-limit';
import Redis from 'ioredis';

const app = express();
const redis = new Redis();

// Global rate limiting
app.use(
  rateLimitMiddleware({
    ...PUBLIC_TIER,
    redis,
  })
);

app.get('/api/data', (req, res) => {
  res.json({ message: 'Success' });
});
```

### Chiến Lược Tùy Chỉnh / Custom Strategies

#### Fixed Window (Mặc định / Default)
Đơn giản, reset ở các khoảng thời gian cố định. Có thể có vấn đề ở ranh giới cửa sổ.

Simple, resets at fixed intervals. May have issues at window boundaries.

```typescript
import { RateLimitStrategy } from '@linkk/rate-limit';

const limiter = createRateLimiter({
  redis,
  points: 100,
  duration: 60,
  strategy: RateLimitStrategy.FIXED_WINDOW,
});
```

#### Sliding Window
Chính xác hơn, sử dụng cửa sổ trượt theo thời gian thực.

More accurate, uses a real-time sliding window.

```typescript
const limiter = createRateLimiter({
  redis,
  points: 100,
  duration: 60,
  strategy: RateLimitStrategy.SLIDING_WINDOW,
});
```

#### Token Bucket
Tốt nhất cho lưu lượng xung động, cho phép bạng nổ.

Best for bursty traffic, allows for burst capacity.

```typescript
const limiter = createRateLimiter({
  redis,
  points: 100,
  duration: 60,
  strategy: RateLimitStrategy.TOKEN_BUCKET,
});
```

### Khóa Tùy Chỉnh / Custom Key Generator

```typescript
const limiter = createRateLimiter({
  redis,
  points: 100,
  duration: 60,
  keyGenerator: (context) => {
    // Rate limit by user ID if authenticated
    if (context.userId) {
      return `user:${context.userId}`;
    }
    // Otherwise by IP
    return `ip:${context.ip}`;
  },
});

// Sử dụng / Use
const result = await limiter.consume('user:123', 1);
```

### Middleware Nâng Cao / Advanced Middleware

```typescript
import { createRateLimitMiddleware } from '@linkk/rate-limit';

const middleware = createRateLimitMiddleware({
  redis,
  points: 500,
  duration: 60,
  keyGenerator: (context) => {
    return `${context.apiKey || context.ip}`;
  },
  skip: (context) => {
    // Skip rate limiting for health checks
    return context.req.path === '/health';
  },
  onLimitExceeded: (result, context) => {
    console.log('Rate limit exceeded for:', context.req.ip);
  },
  includeRateLimitInfo: true,
});

app.use(middleware);
```

### Tier Mặc Định / Default Tiers

Gói cung cấp những tier cấu hình sẵn cho các trường hợp sử dụng khác nhau:

The package provides pre-configured tiers for different use cases:

```typescript
import {
  PUBLIC_TIER, // 100 requests/minute
  AUTHENTICATED_TIER, // 500 requests/minute
  ADMIN_TIER, // 1000 requests/minute
  WEBHOOK_TIER, // 50 requests/minute
} from '@linkk/rate-limit';

// Sử dụng / Use
export default withRateLimit(handler, {
  ...PUBLIC_TIER,
  redis,
});
```

## API Reference

### `createRateLimiter(config: RateLimitConfig): RateLimiter`

Tạo một instance RateLimiter mới.

Creates a new RateLimiter instance.

**Parameters:**
- `config.redis` - Redis instance
- `config.points` - Number of requests allowed
- `config.duration` - Duration in seconds
- `config.blockDuration` - Block duration when exceeded (optional, defaults to duration)
- `config.strategy` - Strategy to use (optional, defaults to FIXED_WINDOW)
- `config.keyPrefix` - Redis key prefix (optional)
- `config.keyGenerator` - Custom key generator function (optional)

**Returns:** `RateLimiter` instance

### `limiter.consume(key: string, points?: number): Promise<RateLimitResult>`

Tiêu thụ điểm từ giới hạn tỷ lệ.

Consume points from the rate limit.

**Returns:**
```typescript
{
  allowed: boolean; // Was the request allowed?
  points: number; // Current points used
  pointsRemaining: number; // Points remaining in window
  retryAfter: number; // Seconds to wait before retrying
  expireAt: number; // Unix timestamp when limit resets
  isBlocked: boolean; // Is the key blocked?
}
```

### `limiter.get(key: string): Promise<RateLimitResult>`

Lấy trạng thái hiện tại mà không tiêu thụ điểm.

Get current state without consuming points.

### `limiter.reset(key: string): Promise<void>`

Đặt lại giới hạn tỷ lệ cho một khóa.

Reset the rate limit for a key.

### `limiter.isBlocked(key: string): Promise<boolean>`

Kiểm tra xem khóa có bị chặn hay không.

Check if a key is currently blocked.

## Headers HTTP / HTTP Headers

Khi sử dụng middleware, các header sau sẽ được đặt tự động:

When using middleware, the following headers are set automatically:

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets
- `Retry-After` - Seconds to wait if rate limited (HTTP 429)

## Ví Dụ Hoàn Chỉnh / Complete Example

### Next.js API Route

```typescript
// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, AUTHENTICATED_TIER } from '@linkk/rate-limit';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { q } = req.query;

  // Your search logic here
  res.status(200).json({
    results: [],
  });
};

export default withRateLimit(handler, {
  ...AUTHENTICATED_TIER,
  redis,
  keyGenerator: (context) => {
    // Rate limit per user ID if available
    if (context.userId) {
      return `search:user:${context.userId}`;
    }
    return `search:ip:${context.ip}`;
  },
  skip: (context) => {
    // Allow unlimited access for admin users
    return context.req.user?.role === 'admin';
  },
});
```

### Express Application

```typescript
import express from 'express';
import {
  createRateLimitMiddleware,
  PUBLIC_TIER,
  AUTHENTICATED_TIER,
  ADMIN_TIER,
} from '@linkk/rate-limit';
import Redis from 'ioredis';

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Public endpoints
app.use(
  '/api/public',
  createRateLimitMiddleware({
    ...PUBLIC_TIER,
    redis,
  })
);

// Authenticated endpoints
app.use(
  '/api/auth',
  createRateLimitMiddleware({
    ...AUTHENTICATED_TIER,
    redis,
    keyGenerator: (context) => `user:${context.userId || context.ip}`,
  })
);

// Admin endpoints
app.use(
  '/api/admin',
  createRateLimitMiddleware({
    ...ADMIN_TIER,
    redis,
    keyGenerator: (context) => `admin:${context.userId}`,
  })
);

app.listen(3000);
```

## Lỗi Phổ Biến / Common Issues

### "Redis connection refused"
Đảm bảo Redis đang chạy và địa chỉ host/port là chính xác.

Make sure Redis is running and host/port are correct.

### "Points cannot exceed configured limit"
Bạn không thể tiêu thụ nhiều điểm hơn giới hạn được cấu hình.

You cannot consume more points than the configured limit.

### "Rate limiter fails silently"
Middleware sẽ cho phép yêu cầu tiếp tục nếu rate limiter gặp lỗi.

Middleware will allow requests to proceed if rate limiter fails.

## Trích Dẫn / License

Dự án này là một phần của L-ERP.

This project is part of L-ERP.
