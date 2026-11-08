# 🚀 L-ERP MRP PRODUCTION OPTIMIZATION - QUICK START

## 1. Apply Database Indexes

```bash
psql -U postgres -d rtr_mrp -f production_indexes.sql
```

## 2. Initialize Optimizations

```typescript
import { initializeOptimizations } from '@/lib/optimization';

// In app startup
initializeOptimizations({
  monitoringInterval: 30000,
  slowQueryThreshold: 1000,
  enableAlerts: true,
});
```

## 3. Use Optimized APIs

```typescript
import { withOptimizations } from '@/lib/optimization/api';

export const GET = withOptimizations(handler, {
  rateLimit: 'standard',
  cache: 'public, max-age=60',
});
```

## 4. Batch Operations

```typescript
import { batchCreate, streamRecords } from '@/lib/optimization/database';

// Bulk import
await batchCreate(prisma.part, data, { batchSize: 100 });

// Stream export
for await (const batch of streamRecords(prisma.part)) {
  // Process batch
}
```

## 5. Resilience Patterns

```typescript
import { withRetry, databaseCircuit } from '@/lib/optimization';

// With retry
const data = await withRetry(() => fetchAPI(), { maxAttempts: 3 });

// With circuit breaker
const result = await databaseCircuit.execute(() => prisma.query());
```

## 6. Database Maintenance

```bash
# Full maintenance
./maintenance/db-maintenance.sh full

# Individual tasks
./maintenance/db-maintenance.sh analyze
./maintenance/db-maintenance.sh vacuum
./maintenance/db-maintenance.sh indexes
```

## Key Files

| File | Purpose |
|------|---------|
| `optimization/database/` | DB utilities, batch ops, streaming |
| `optimization/api/` | Rate limiting, validation, caching |
| `optimization/processing/` | CSV/Excel import/export |
| `optimization/resilience/` | Circuit breaker, retry, timeout |
| `optimization/monitoring/` | Metrics, alerts, performance |
| `production_indexes.sql` | 100+ optimized indexes |

## Expected Improvements

- Query response: **10-20x faster**
- Bulk import: **10-15x faster**
- Error recovery: Automatic with circuit breakers
- Rate limiting: Protect against abuse
- Monitoring: Real-time metrics & alerts
