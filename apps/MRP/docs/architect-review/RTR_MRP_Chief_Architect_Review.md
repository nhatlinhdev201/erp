# 🏗️ BÁO CÁO ĐÁNH GIÁ KỸ THUẬT & KẾ HOẠCH HÀNH ĐỘNG

**Từ:** Kiến Trúc Sư Trưởng & Tổng Thầu
**Ngày:** 01/01/2026
**Dự án:** L-ERP MRP Performance Enhancement
**Phiên bản:** 1.0 - FINAL REVIEW

---

## 📋 MỤC LỤC

1. [Đánh giá Đề xuất Hiện tại](#1-đánh-giá-đề-xuất-hiện-tại)
2. [Phân tích Kiến trúc Hệ thống](#2-phân-tích-kiến-trúc-hệ-thống)
3. [Khuyến nghị Bổ sung](#3-khuyến-nghị-bổ-sung)
4. [Kế hoạch Triển khai Chi tiết](#4-kế-hoạch-triển-khai-chi-tiết)
5. [Sprint Breakdown](#5-sprint-breakdown)
6. [Risk Assessment](#6-risk-assessment)
7. [Quyết định & Ký duyệt](#7-quyết-định--ký-duyệt)

---

## 1. ĐÁNH GIÁ ĐỀ XUẤT HIỆN TẠI

### 1.1 Tổng quan Đánh giá

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| **Phân tích vấn đề** | 9/10 | Xác định chính xác bottlenecks |
| **Giải pháp kỹ thuật** | 8/10 | Phù hợp, cần bổ sung một số điểm |
| **Kế hoạch thời gian** | 7/10 | Realistic nhưng cần buffer |
| **Ước tính nguồn lực** | 8/10 | Hợp lý cho quy mô dự án |
| **Risk Assessment** | 6/10 | Cần chi tiết hơn |
| **TỔNG ĐIỂM** | **38/50** | **CHẤP THUẬN CÓ ĐIỀU KIỆN** |

### 1.2 Điểm Mạnh của Đề xuất ✅

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ ĐIỂM MẠNH                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Xác định đúng 3 layer cần tối ưu:                          │
│     • Database Layer (indexes, N+1, full scans)                 │
│     • API Layer (caching, pagination)                           │
│     • Frontend Layer (virtualization, re-renders)               │
│                                                                 │
│  2. Phân chia Phase hợp lý:                                     │
│     • Quick Wins trước → Thấy kết quả nhanh                    │
│     • Foundation → Caching infrastructure                       │
│     • Advanced → Background processing                          │
│                                                                 │
│  3. Metrics rõ ràng, đo lường được:                            │
│     • Response time targets cụ thể                              │
│     • Memory usage goals                                        │
│     • Performance improvement percentages                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Điểm Cần Bổ sung ⚠️

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ CẦN BỔ SUNG                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. THIẾU: Database connection pooling configuration            │
│  2. THIẾU: API rate limiting để protect backend                 │
│  3. THIẾU: CDN configuration cho static assets                  │
│  4. THIẾU: Database query timeout settings                      │
│  5. THIẾU: Graceful degradation strategy                        │
│  6. THIẾU: Rollback plan cho mỗi phase                         │
│  7. THIẾU: A/B testing strategy cho performance changes         │
│  8. CẦN CHI TIẾT: Cache warming strategy                        │
│  9. CẦN CHI TIẾT: Database migration zero-downtime              │
│  10. CẦN CHI TIẾT: Monitoring alerting thresholds               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. PHÂN TÍCH KIẾN TRÚC HỆ THỐNG

### 2.1 Current State Architecture

```
                            CURRENT STATE
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────┐                              ┌──────────────┐   │
│   │  Client  │◄────── HTTP/WS ─────────────►│   Next.js    │   │
│   │ (React)  │                              │   Server     │   │
│   └──────────┘                              └──────┬───────┘   │
│                                                    │            │
│                                                    │ Direct     │
│                                                    │ Queries    │
│                                                    ▼            │
│                                             ┌──────────────┐   │
│                                             │  PostgreSQL  │   │
│                                             │   Database   │   │
│                                             └──────────────┘   │
│                                                                 │
│   ISSUES:                                                       │
│   • No caching layer                                            │
│   • No connection pooling                                       │
│   • No rate limiting                                            │
│   • Synchronous processing only                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Target State Architecture

```
                            TARGET STATE
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────┐     ┌─────────┐     ┌───────────────────────┐   │
│   │  Client  │◄───►│   CDN   │◄───►│   Next.js + API       │   │
│   │ (React)  │     │         │     │   Rate Limited        │   │
│   └──────────┘     └─────────┘     └───────────┬───────────┘   │
│        │                                        │               │
│        │ WebSocket                              │               │
│        ▼                                        ▼               │
│   ┌──────────┐                           ┌───────────┐         │
│   │ Progress │                           │   Redis   │         │
│   │ Updates  │◄──────────────────────────│   Cache   │         │
│   └──────────┘                           └─────┬─────┘         │
│                                                │               │
│        ┌───────────────────────────────────────┤               │
│        │                                       │               │
│        ▼                                       ▼               │
│   ┌──────────┐     ┌──────────┐     ┌──────────────────┐       │
│   │  BullMQ  │────►│  Worker  │────►│  PostgreSQL      │       │
│   │  Queue   │     │  Process │     │  + Connection    │       │
│   └──────────┘     └──────────┘     │    Pool          │       │
│                                     └──────────────────┘       │
│                                                                 │
│   IMPROVEMENTS:                                                 │
│   ✅ CDN for static assets                                      │
│   ✅ Redis caching layer                                        │
│   ✅ Connection pooling                                         │
│   ✅ Background job processing                                  │
│   ✅ Rate limiting                                              │
│   ✅ WebSocket for real-time updates                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow Optimization

```
                    OPTIMIZED DATA FLOW
                    
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   REQUEST: GET /api/work-orders?page=1&limit=50                │
│                                                                 │
│   ┌─────────┐                                                   │
│   │ Request │                                                   │
│   └────┬────┘                                                   │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐  HIT   ┌─────────────────────────────────┐   │
│   │ Rate Limit  │───────►│ Return 429 Too Many Requests   │   │
│   │   Check     │ FAIL   └─────────────────────────────────┘   │
│   └──────┬──────┘                                               │
│          │ PASS                                                 │
│          ▼                                                      │
│   ┌─────────────┐  HIT   ┌─────────────────────────────────┐   │
│   │ Redis Cache │───────►│ Return cached data (< 10ms)    │   │
│   │   Lookup    │        └─────────────────────────────────┘   │
│   └──────┬──────┘                                               │
│          │ MISS                                                 │
│          ▼                                                      │
│   ┌─────────────┐        ┌─────────────────────────────────┐   │
│   │  Database   │───────►│ Query with indexes (< 50ms)    │   │
│   │   Query     │        │ SELECT only needed columns      │   │
│   └──────┬──────┘        │ Cursor-based pagination         │   │
│          │               └─────────────────────────────────┘   │
│          ▼                                                      │
│   ┌─────────────┐                                               │
│   │ Cache Result│───────► Store in Redis (TTL: 60s)            │
│   └──────┬──────┘                                               │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────┐                                               │
│   │  Response   │───────► Return to client (< 200ms total)     │
│   └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. KHUYẾN NGHỊ BỔ SUNG

### 3.1 Database Layer - BỔ SUNG

```sql
-- 1. Connection Pool Configuration (PgBouncer hoặc Prisma)
-- prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
  // pool_size = 10
  // pool_timeout = 10
}

-- 2. Query Timeout Configuration
SET statement_timeout = '30s';
SET lock_timeout = '10s';

-- 3. Partial Indexes cho hot data
CREATE INDEX idx_work_orders_active 
ON work_orders(status, created_at) 
WHERE status IN ('PLANNED', 'IN_PROGRESS', 'RELEASED');

CREATE INDEX idx_sales_orders_pending 
ON sales_orders(status, order_date) 
WHERE status NOT IN ('COMPLETED', 'CANCELLED');

-- 4. Materialized Views cho Dashboard
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as active_work_orders,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending_orders,
  SUM(total_amount) FILTER (WHERE status = 'COMPLETED') as total_revenue
FROM sales_orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';

-- Refresh every 5 minutes via cron
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
```

### 3.2 API Layer - BỔ SUNG

```typescript
// 1. Rate Limiting Configuration
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests/minute
  analytics: true,
  prefix: "lerp-mrp",
});

// 2. Graceful Degradation
// lib/api-wrapper.ts
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  try {
    return await Promise.race([
      primary(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  } catch (error) {
    console.warn('Primary failed, using fallback:', error);
    return fallback();
  }
}

// 3. Cache Warming Strategy
// lib/cache-warmer.ts
export const warmCaches = async () => {
  const criticalCaches = [
    { key: 'dashboard:stats', fetcher: fetchDashboardStats },
    { key: 'parts:active', fetcher: fetchActiveParts },
    { key: 'customers:top', fetcher: fetchTopCustomers },
  ];
  
  await Promise.all(
    criticalCaches.map(async ({ key, fetcher }) => {
      const data = await fetcher();
      await redis.set(key, JSON.stringify(data), 'EX', 300);
    })
  );
};

// Run on server start and every 5 minutes
```

### 3.3 Frontend Layer - BỔ SUNG

```typescript
// 1. Optimistic Updates
// hooks/useOptimisticUpdate.ts
export function useOptimisticUpdate<T>(
  queryKey: string[],
  mutationFn: (data: T) => Promise<T>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: T[]) => [...old, newData]);
      return { previous };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error('Operation failed, reverting...');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// 2. Skeleton Loading with Suspense
// components/table-skeleton.tsx
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded mb-2" />
      ))}
    </div>
  );
}

// 3. Error Boundary with Retry
// components/error-boundary-retry.tsx
export function ErrorBoundaryRetry({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-4 bg-red-50 rounded">
          <p>Something went wrong: {error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 3.4 Monitoring & Alerting - BỔ SUNG

```yaml
# monitoring/alerts.yml
alerts:
  - name: high_response_time
    condition: p95_latency > 2000ms
    duration: 5m
    severity: warning
    action: notify_slack
    
  - name: critical_response_time
    condition: p95_latency > 5000ms
    duration: 2m
    severity: critical
    action: [notify_slack, page_oncall]
    
  - name: high_error_rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    action: [notify_slack, page_oncall]
    
  - name: database_slow_queries
    condition: slow_query_count > 10
    duration: 5m
    severity: warning
    action: notify_slack
    
  - name: cache_hit_ratio_low
    condition: cache_hit_ratio < 70%
    duration: 10m
    severity: warning
    action: notify_slack
    
  - name: memory_high
    condition: memory_usage > 80%
    duration: 5m
    severity: warning
    action: notify_slack
```

---

## 4. KẾ HOẠCH TRIỂN KHAI CHI TIẾT

### 4.1 Timeline Tổng quan

```
                            IMPLEMENTATION TIMELINE
                            
     Week 1-2         Week 3-4         Week 5-6         Week 7-8         Week 9-10
        │                │                │                │                │
        ▼                ▼                ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   PHASE 1     │ │   PHASE 2A    │ │   PHASE 2B    │ │   PHASE 3     │ │   PHASE 4     │
│   QUICK WINS  │ │   CACHING     │ │   FRONTEND    │ │   BACKGROUND  │ │   POLISH      │
│               │ │               │ │               │ │               │ │               │
│ • DB Indexes  │ │ • Redis Setup │ │ • Virtual     │ │ • BullMQ      │ │ • Monitoring  │
│ • Pagination  │ │ • Cache Layer │ │   Tables      │ │ • Workers     │ │ • Load Test   │
│ • N+1 Fixes   │ │ • Invalidation│ │ • Skeleton    │ │ • WebSocket   │ │ • Docs        │
│ • Select Opt  │ │ • Rate Limit  │ │ • Optimistic  │ │ • Progress    │ │ • Handoff     │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
        │                │                │                │                │
        ▼                ▼                ▼                ▼                ▼
   ✓ 70% Query      ✓ 80% DB        ✓ Smooth         ✓ No UI         ✓ Production
     Improvement      Load ↓          Scrolling        Freeze          Ready
```

### 4.2 Resource Allocation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESOURCE ALLOCATION MATRIX                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ROLE                    Phase 1   Phase 2A  Phase 2B  Phase 3   Phase 4  │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   Senior Backend Dev      100%      100%      20%       100%      40%      │
│   (Database + API)                                                          │
│                                                                             │
│   Senior Frontend Dev     20%       30%       100%      60%       40%      │
│   (React + UI)                                                              │
│                                                                             │
│   DevOps Engineer         30%       80%       20%       60%       80%      │
│   (Infrastructure)                                                          │
│                                                                             │
│   QA Engineer             40%       60%       60%       80%       100%     │
│   (Testing)                                                                 │
│                                                                             │
│   Tech Lead / Architect   40%       40%       40%       40%       60%      │
│   (Review + Guidance)                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SPRINT BREAKDOWN

### Sprint 1 (Week 1): Database Optimization

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S1-01 | Analyze slow queries với pg_stat_statements | Backend | 4h | P0 |
| S1-02 | Create database indexes (6 indexes) | Backend | 4h | P0 |
| S1-03 | Implement eager loading cho relationships | Backend | 8h | P0 |
| S1-04 | Optimize SELECT queries (chỉ lấy cần thiết) | Backend | 6h | P0 |
| S1-05 | Setup connection pooling | DevOps | 4h | P1 |
| S1-06 | Configure query timeouts | Backend | 2h | P1 |
| S1-07 | Create partial indexes cho hot data | Backend | 4h | P1 |
| S1-08 | Performance testing baseline | QA | 8h | P0 |

**Deliverables:**
- [ ] 6 production indexes deployed
- [ ] Query performance report (before/after)
- [ ] Connection pool configured
- [ ] Baseline metrics documented

---

### Sprint 2 (Week 2): API Pagination

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S2-01 | Implement cursor-based pagination utility | Backend | 8h | P0 |
| S2-02 | Update /api/work-orders endpoint | Backend | 4h | P0 |
| S2-03 | Update /api/sales-orders endpoint | Backend | 4h | P0 |
| S2-04 | Update /api/purchase-orders endpoint | Backend | 4h | P0 |
| S2-05 | Update /api/parts endpoint | Backend | 4h | P0 |
| S2-06 | Update /api/inventory endpoint | Backend | 4h | P0 |
| S2-07 | Frontend pagination components | Frontend | 8h | P0 |
| S2-08 | Integration testing | QA | 8h | P0 |

**Deliverables:**
- [ ] All list APIs support pagination
- [ ] Pagination components deployed
- [ ] API response time < 500ms for all endpoints

---

### Sprint 3 (Week 3): Redis Cache Setup

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S3-01 | Setup Redis infrastructure | DevOps | 8h | P0 |
| S3-02 | Implement cache service layer | Backend | 8h | P0 |
| S3-03 | Add caching to dashboard endpoints | Backend | 4h | P0 |
| S3-04 | Add caching to list endpoints | Backend | 6h | P0 |
| S3-05 | Implement cache invalidation | Backend | 6h | P0 |
| S3-06 | Implement rate limiting | Backend | 4h | P1 |
| S3-07 | Cache warming strategy | Backend | 4h | P1 |
| S3-08 | Monitoring setup for Redis | DevOps | 4h | P1 |

**Deliverables:**
- [ ] Redis deployed and configured
- [ ] Cache layer implemented
- [ ] Cache hit ratio > 70%
- [ ] Rate limiting active

---

### Sprint 4 (Week 4): Cache Integration & Testing

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S4-01 | Cache integration for remaining endpoints | Backend | 8h | P0 |
| S4-02 | Stale-while-revalidate implementation | Backend | 6h | P1 |
| S4-03 | Cache key management utilities | Backend | 4h | P1 |
| S4-04 | Load testing với cache | QA | 8h | P0 |
| S4-05 | Cache fallback strategies | Backend | 4h | P1 |
| S4-06 | Documentation update | All | 4h | P2 |
| S4-07 | Performance comparison report | QA | 4h | P0 |

**Deliverables:**
- [ ] Full cache integration complete
- [ ] Load test report
- [ ] 80% reduction in DB load

---

### Sprint 5 (Week 5-6): Frontend Virtualization

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S5-01 | Setup @tanstack/react-virtual | Frontend | 4h | P0 |
| S5-02 | Implement virtual table component | Frontend | 12h | P0 |
| S5-03 | Apply to Work Orders table | Frontend | 8h | P0 |
| S5-04 | Apply to Sales Orders table | Frontend | 8h | P0 |
| S5-05 | Apply to Purchase Orders table | Frontend | 8h | P0 |
| S5-06 | Skeleton loading components | Frontend | 6h | P1 |
| S5-07 | Optimistic updates implementation | Frontend | 8h | P1 |
| S5-08 | React.memo optimization | Frontend | 6h | P1 |
| S5-09 | Bundle size optimization | Frontend | 8h | P2 |
| S5-10 | Cross-browser testing | QA | 8h | P0 |

**Deliverables:**
- [ ] Virtual tables for all large datasets
- [ ] Smooth scrolling with 100K+ rows
- [ ] Bundle size < 400KB

---

### Sprint 6 (Week 7-8): Background Processing

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S6-01 | Setup BullMQ infrastructure | DevOps | 8h | P0 |
| S6-02 | Implement job queue service | Backend | 8h | P0 |
| S6-03 | Migrate Excel import to background | Backend | 8h | P0 |
| S6-04 | Migrate Excel export to background | Backend | 8h | P0 |
| S6-05 | Migrate report generation to background | Backend | 6h | P0 |
| S6-06 | WebSocket progress notifications | Backend | 8h | P0 |
| S6-07 | Progress UI components | Frontend | 8h | P0 |
| S6-08 | Retry logic & error handling | Backend | 6h | P1 |
| S6-09 | Dead letter queue setup | DevOps | 4h | P1 |
| S6-10 | Integration testing | QA | 8h | P0 |

**Deliverables:**
- [ ] Background job system operational
- [ ] UI never freezes on heavy operations
- [ ] Progress tracking working

---

### Sprint 7 (Week 9-10): Polish & Production

| Task ID | Task | Owner | Effort | Priority |
|---------|------|-------|--------|----------|
| S7-01 | Full load testing | QA | 12h | P0 |
| S7-02 | Performance monitoring setup | DevOps | 8h | P0 |
| S7-03 | Alerting configuration | DevOps | 4h | P0 |
| S7-04 | Documentation finalization | All | 8h | P1 |
| S7-05 | Runbook creation | DevOps | 6h | P1 |
| S7-06 | Security review | All | 4h | P0 |
| S7-07 | Final bug fixes | All | 12h | P0 |
| S7-08 | Stakeholder demo | All | 4h | P0 |
| S7-09 | Production deployment | DevOps | 8h | P0 |
| S7-10 | Post-deployment monitoring | All | 8h | P0 |

**Deliverables:**
- [ ] All performance targets met
- [ ] Monitoring & alerting active
- [ ] Documentation complete
- [ ] Production deployment successful

---

## 6. RISK ASSESSMENT

### 6.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Database migration causes downtime** | Medium | High | Zero-downtime migration, blue-green deployment |
| **Cache inconsistency issues** | Medium | Medium | Comprehensive invalidation strategy, monitoring |
| **Redis failure** | Low | High | Graceful degradation, fallback to DB |
| **Performance regression** | Medium | High | Continuous testing, feature flags |
| **Timeline slippage** | Medium | Medium | Buffer time, prioritization |
| **Resource unavailability** | Low | High | Cross-training, documentation |

### 6.2 Rollback Plan

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROLLBACK STRATEGY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  For each phase, maintain:                                      │
│                                                                 │
│  1. DATABASE CHANGES                                            │
│     • Migration scripts with rollback                           │
│     • Index drop scripts ready                                  │
│     • Data backup before changes                                │
│                                                                 │
│  2. CODE CHANGES                                                │
│     • Feature flags for all new features                        │
│     • Previous version tagged in Git                            │
│     • Automated rollback scripts                                │
│                                                                 │
│  3. INFRASTRUCTURE                                              │
│     • Blue-green deployment                                     │
│     • Instant traffic switch capability                         │
│     • Terraform state versioned                                 │
│                                                                 │
│  ROLLBACK TRIGGER CONDITIONS:                                   │
│     • Error rate > 10% for 5 minutes                           │
│     • P95 latency > 10s for 5 minutes                          │
│     • Critical alert triggered                                  │
│                                                                 │
│  ROLLBACK TIME TARGET: < 15 minutes                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. QUYẾT ĐỊNH & KÝ DUYỆT

### 7.1 Quyết định của Kiến Trúc Sư Trưởng

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📋 QUYẾT ĐỊNH: CHẤP THUẬN CÓ ĐIỀU KIỆN                       │
│                                                                 │
│   Đề xuất được CHẤP THUẬN với các điều kiện sau:               │
│                                                                 │
│   1. ✅ Bổ sung các khuyến nghị trong Section 3                 │
│   2. ✅ Thêm 1 tuần buffer vào timeline (10 → 11 tuần)          │
│   3. ✅ Triển khai monitoring TRƯỚC khi bắt đầu tối ưu          │
│   4. ✅ Rollback plan cho MỖI phase                             │
│   5. ✅ Load test baseline TRƯỚC Phase 1                        │
│   6. ✅ Weekly review meetings với stakeholders                 │
│                                                                 │
│   Ngân sách ước tính:                                           │
│   • Infrastructure: $50-100/tháng                               │
│   • Development: 11 tuần × team size                           │
│   • Contingency: +15%                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Kế hoạch Hành động Tiếp theo

| # | Action | Owner | Deadline |
|---|--------|-------|----------|
| 1 | Phê duyệt ngân sách | Stakeholder | Week 0 |
| 2 | Setup monitoring baseline | DevOps | Week 0 |
| 3 | Kick-off meeting | Team | Week 1 Day 1 |
| 4 | Begin Phase 1 implementation | Backend | Week 1 Day 2 |
| 5 | Weekly progress review | All | Every Friday |

### 7.3 Chữ ký

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Kiến Trúc Sư Trưởng: _____________________  Date: ________   │
│                                                                 │
│   Tổng Thầu:          _____________________  Date: ________   │
│                                                                 │
│   Product Owner:      _____________________  Date: ________   │
│                                                                 │
│   Technical Lead:     _____________________  Date: ________   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHỤ LỤC

### A. Checklist Triển khai Phase 1

- [ ] Backup database production
- [ ] Run pg_stat_statements analysis
- [ ] Create indexes trong maintenance window
- [ ] Verify index usage với EXPLAIN ANALYZE
- [ ] Update Prisma schema với pagination
- [ ] Deploy API changes với feature flag
- [ ] Enable pagination gradually (10% → 50% → 100%)
- [ ] Monitor error rates và latency
- [ ] Update frontend components
- [ ] Full regression testing

### B. Performance Testing Script

```bash
#!/bin/bash
# performance-test.sh

echo "=== L-ERP MRP Performance Test ==="

# Baseline
echo "Running baseline tests..."
k6 run --vus 50 --duration 60s tests/baseline.js

# After optimization
echo "Running optimized tests..."
k6 run --vus 100 --duration 120s tests/optimized.js

# Compare
echo "Generating comparison report..."
node scripts/compare-results.js
```

### C. Monitoring Dashboard Metrics

- P50, P95, P99 response times
- Requests per second
- Error rate (4xx, 5xx)
- Database query duration
- Cache hit/miss ratio
- Memory usage
- CPU utilization
- Active connections

---

**Document Version:** 1.0
**Last Updated:** 01/01/2026
**Classification:** Internal - Confidential
