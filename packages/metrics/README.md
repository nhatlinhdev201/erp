# @linkk/metrics

Prometheus metrics package for L-ERP applications. Provides out-of-the-box metrics collection for HTTP requests, database queries, NATS events, and cache operations.

---

## English

### Installation

No additional installation required. The package is part of the monorepo.

### Features

- **HTTP Request Metrics**: Track request duration and total requests with method, route, status code, and app labels
- **Database Query Metrics**: Monitor database query performance with operation, model, and app labels
- **NATS Event Metrics**: Count events processed with subject, type, and app labels
- **Cache Hit Metrics**: Track cache operations with operation and app labels
- **Default Metrics**: Automatic collection of Node.js runtime metrics

### Usage

#### Basic Metrics Access

```typescript
import {
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  natsEventTotal,
  cacheHitTotal,
  metricsHandler,
} from '@linkk/metrics';

// Export metrics from API endpoint
export async function GET(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  const metrics = await metricsHandler();
  res.send(metrics);
}
```

#### HTTP Middleware Integration

```typescript
import { withMetrics } from '@linkk/metrics/src/middleware';

async function myApiHandler(req, res) {
  res.status(200).json({ message: 'success' });
}

export default withMetrics(myApiHandler, 'my-app');
```

#### Prisma Metrics Integration

```typescript
import { withPrismaMetrics } from '@linkk/metrics/src/middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
withPrismaMetrics(prisma, 'my-app');

export default prisma;
```

#### Manual Metric Recording

```typescript
import {
  httpRequestDuration,
  natsEventTotal,
  cacheHitTotal,
} from '@linkk/metrics';

// Record HTTP request
httpRequestDuration
  .labels('GET', '/api/users', '200', 'user-service')
  .observe(0.123);

// Record NATS event
natsEventTotal.labels('orders.created', 'event', 'order-service').inc();

// Record cache hit
cacheHitTotal.labels('user_cache', 'redis-service').inc();
```

### Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_request_duration_seconds` | Histogram | method, route, status_code, app | HTTP request duration in seconds |
| `http_request_total` | Counter | method, route, status_code, app | Total HTTP requests |
| `db_query_duration_seconds` | Histogram | operation, model, app | Database query duration in seconds |
| `nats_event_total` | Counter | subject, type, app | Total NATS events processed |
| `cache_hit_total` | Counter | operation, app | Total cache hits |

---

## Tiếng Việt

### Cài đặt

Không cần cài đặt bổ sung. Gói được bao gồm trong monorepo.

### Tính năng

- **Metrics HTTP Request**: Theo dõi thời gian phản hồi và tổng số yêu cầu với nhãn method, route, status code và app
- **Metrics Database Query**: Giám sát hiệu suất truy vấn cơ sở dữ liệu với nhãn operation, model và app
- **Metrics NATS Event**: Đếm các sự kiện xử lý với nhãn subject, type và app
- **Metrics Cache Hit**: Theo dõi các hoạt động cache với nhãn operation và app
- **Default Metrics**: Tự động thu thập các metrics runtime của Node.js

### Cách sử dụng

#### Truy cập Metrics Cơ bản

```typescript
import {
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  natsEventTotal,
  cacheHitTotal,
  metricsHandler,
} from '@linkk/metrics';

// Xuất metrics từ API endpoint
export async function GET(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  const metrics = await metricsHandler();
  res.send(metrics);
}
```

#### Tích hợp HTTP Middleware

```typescript
import { withMetrics } from '@linkk/metrics/src/middleware';

async function myApiHandler(req, res) {
  res.status(200).json({ message: 'success' });
}

export default withMetrics(myApiHandler, 'my-app');
```

#### Tích hợp Prisma Metrics

```typescript
import { withPrismaMetrics } from '@linkk/metrics/src/middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
withPrismaMetrics(prisma, 'my-app');

export default prisma;
```

#### Ghi lại Metrics Thủ công

```typescript
import {
  httpRequestDuration,
  natsEventTotal,
  cacheHitTotal,
} from '@linkk/metrics';

// Ghi lại HTTP request
httpRequestDuration
  .labels('GET', '/api/users', '200', 'user-service')
  .observe(0.123);

// Ghi lại NATS event
natsEventTotal.labels('orders.created', 'event', 'order-service').inc();

// Ghi lại cache hit
cacheHitTotal.labels('user_cache', 'redis-service').inc();
```

### Danh sách Metrics

| Tên Metric | Loại | Nhãn | Mô tả |
|------------|------|------|-------|
| `http_request_duration_seconds` | Histogram | method, route, status_code, app | Thời gian phản hồi HTTP tính bằng giây |
| `http_request_total` | Counter | method, route, status_code, app | Tổng số HTTP requests |
| `db_query_duration_seconds` | Histogram | operation, model, app | Thời gian truy vấn cơ sở dữ liệu tính bằng giây |
| `nats_event_total` | Counter | subject, type, app | Tổng số sự kiện NATS đã xử lý |
| `cache_hit_total` | Counter | operation, app | Tổng số cache hits |
