# 🏢 L-ERP MRP ENTERPRISE DEPLOYMENT GUIDE
## Hướng dẫn triển khai cho doanh nghiệp quy mô trung & lớn

---

## 📋 MỤC LỤC

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Migration dữ liệu](#migration-dữ-liệu)
4. [Capacity Testing](#capacity-testing)
5. [Performance Tuning](#performance-tuning)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Disaster Recovery](#disaster-recovery)
8. [Checklist triển khai](#checklist-triển-khai)

---

## 🖥️ YÊU CẦU HỆ THỐNG

### Phân loại quy mô

| Quy mô | Parts | Inventory | Work Orders | Users | Transactions/ngày |
|--------|-------|-----------|-------------|-------|-------------------|
| Nhỏ | < 10K | < 50K | < 1K | < 20 | < 1K |
| Trung bình | 10K - 100K | 50K - 500K | 1K - 10K | 20 - 100 | 1K - 10K |
| Lớn | 100K - 1M | 500K - 5M | 10K - 100K | 100 - 500 | 10K - 100K |
| Enterprise | > 1M | > 5M | > 100K | > 500 | > 100K |

### Yêu cầu phần cứng

#### Doanh nghiệp trung bình (100K - 1M records)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Application Server** | | |
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| **Database Server** | | |
| CPU | 4 cores | 8 cores |
| RAM | 16 GB | 32 GB |
| Storage | 200 GB SSD | 500 GB SSD (RAID) |
| **Redis Cache** | | |
| RAM | 2 GB | 4 GB |

#### Doanh nghiệp lớn (1M+ records)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Application Cluster** | | |
| Nodes | 2 | 4+ |
| CPU per node | 8 cores | 16 cores |
| RAM per node | 16 GB | 32 GB |
| **Database Cluster** | | |
| Primary | 16 cores / 64 GB | 32 cores / 128 GB |
| Replicas | 2 | 3+ |
| Storage | 1 TB NVMe | 2 TB+ NVMe (RAID 10) |
| **Redis Cluster** | | |
| Nodes | 3 | 6 |
| RAM per node | 4 GB | 8 GB |

### Yêu cầu phần mềm

```yaml
Runtime:
  - Node.js: 18.x LTS hoặc 20.x LTS
  - npm/yarn: Latest

Database:
  - PostgreSQL: 14.x hoặc 15.x
  - Extensions:
    - pg_stat_statements (query analysis)
    - pg_trgm (fuzzy search)
    
Cache:
  - Redis: 7.x

Load Balancer:
  - Nginx hoặc HAProxy
  
Container (Optional):
  - Docker: 24.x
  - Kubernetes: 1.28+
```

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Kiến trúc đề xuất cho Enterprise

```
                                    ┌─────────────────┐
                                    │   CloudFlare    │
                                    │   (CDN + WAF)   │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Load Balancer  │
                                    │  (Nginx/HAProxy)│
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
           ┌────────▼────────┐      ┌────────▼────────┐      ┌────────▼────────┐
           │   App Node 1    │      │   App Node 2    │      │   App Node N    │
           │   (Next.js)     │      │   (Next.js)     │      │   (Next.js)     │
           └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
                    │                        │                        │
                    └────────────────────────┼────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
           ┌────────▼────────┐      ┌────────▼────────┐      ┌────────▼────────┐
           │  Redis Master   │      │  Redis Replica  │      │  Redis Replica  │
           │   (Cache)       │      │                 │      │                 │
           └─────────────────┘      └─────────────────┘      └─────────────────┘
                    │
           ┌────────▼────────────────────────────────────────────────┐
           │                                                          │
           │                    PgBouncer                             │
           │              (Connection Pooler)                         │
           │                                                          │
           └────────┬─────────────────────────────────┬──────────────┘
                    │                                 │
           ┌────────▼────────┐               ┌────────▼────────┐
           │  PostgreSQL     │   Streaming   │  PostgreSQL     │
           │  Primary        │◄─────────────►│  Replica        │
           │                 │   Replication │                 │
           └────────┬────────┘               └─────────────────┘
                    │
           ┌────────▼────────┐
           │   Backup        │
           │   (S3/Minio)    │
           └─────────────────┘
```

### Database Configuration

```ini
# postgresql.conf - Optimized for 1M+ records

# Memory
shared_buffers = 8GB                    # 25% of total RAM
effective_cache_size = 24GB             # 75% of total RAM
work_mem = 256MB                        # Per-query memory
maintenance_work_mem = 2GB              # For VACUUM, INDEX

# Connections
max_connections = 200
superuser_reserved_connections = 5

# WAL
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planning
random_page_cost = 1.1                  # For SSD
effective_io_concurrency = 200          # For SSD
default_statistics_target = 200

# Logging
log_min_duration_statement = 500        # Log queries > 500ms
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Autovacuum
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.025
```

---

## 📦 MIGRATION DỮ LIỆU

### Quy trình migration

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Extract    │────►│   Transform  │────►│    Load      │────►│   Verify     │
│   (Export)   │     │   (Clean)    │     │   (Import)   │     │   (Check)    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Chuẩn bị dữ liệu

#### 1. Export từ hệ thống cũ

```bash
# Ví dụ export từ SQL Server
sqlcmd -S server -d database -Q "SELECT * FROM Parts" -o parts.csv -s"," -W

# Ví dụ export từ Excel
# Lưu file Excel thành CSV (UTF-8)
```

#### 2. Chuẩn hóa format CSV

**Parts (parts.csv)**
```csv
partNumber,name,description,category,partType,unit,unitCost,minStock,maxStock,leadTime,isActive
PART-001,Bolt M10x50,Stainless steel bolt,COMPONENT,STANDARD,PCS,5.50,100,1000,7,true
PART-002,Nut M10,Hex nut M10,COMPONENT,STANDARD,PCS,2.30,200,2000,5,true
```

**Customers (customers.csv)**
```csv
code,name,email,phone,address,taxCode,contactPerson,isActive
CUST-001,ABC Company,contact@abc.com,0901234567,123 Main St,0123456789,John Doe,true
```

**Suppliers (suppliers.csv)**
```csv
code,name,email,phone,address,taxCode,contactPerson,isActive
SUP-001,XYZ Materials,sales@xyz.com,0909876543,456 Industrial Ave,9876543210,Jane Smith,true
```

**Inventory (inventory.csv)**
```csv
partNumber,warehouseCode,quantity,locationCode,minQuantity,maxQuantity
PART-001,WH-MAIN,500,A-01-01,100,1000
PART-002,WH-MAIN,1200,A-01-02,200,2000
```

### Chạy migration

```bash
# 1. Dry run (validation only)
npx ts-node enterprise/migration/migrate.ts parts ./data/parts.csv --dry-run

# 2. Import với batch nhỏ (test)
npx ts-node enterprise/migration/migrate.ts parts ./data/parts.csv --batch-size=100

# 3. Import production (batch lớn)
npx ts-node enterprise/migration/migrate.ts parts ./data/parts.csv --batch-size=5000

# 4. Resume từ vị trí cụ thể (nếu bị ngắt)
npx ts-node enterprise/migration/migrate.ts parts ./data/parts.csv --resume-from=500000
```

### Thời gian migration ước tính

| Records | Batch Size | Est. Time | Notes |
|---------|------------|-----------|-------|
| 100K | 1000 | 5-10 min | |
| 500K | 2000 | 20-30 min | |
| 1M | 5000 | 45-60 min | |
| 5M | 5000 | 4-6 hours | Consider off-peak |
| 10M+ | 10000 | 10+ hours | Schedule overnight |

---

## 🧪 CAPACITY TESTING

### Chạy capacity test

```bash
# 1. Install K6
brew install k6  # macOS
# hoặc
sudo apt install k6  # Ubuntu

# 2. Chạy test cơ bản
k6 run enterprise/capacity-test/capacity-test.js

# 3. Chạy với config cụ thể
k6 run \
  --env BASE_URL=https://your-app.com \
  --env TOTAL_PARTS=1000000 \
  --env TOTAL_INVENTORY=500000 \
  enterprise/capacity-test/capacity-test.js

# 4. Chạy scenario cụ thể
k6 run --scenario database_capacity enterprise/capacity-test/capacity-test.js
```

### Test scenarios

| Scenario | Duration | Max VUs | Purpose |
|----------|----------|---------|---------|
| database_capacity | 15m | 200 | Test DB với millions records |
| concurrent_users | 10m | 200 | 200 users đồng thời |
| write_heavy | 10m | 300 | Concurrent writes |
| complex_operations | 5m | 20 | MRP, Reports |
| spike_test | 2.5m | 500 | Traffic spike |
| endurance | 30m | 100 | Long-running stability |

### Performance targets

| Metric | Target | Critical |
|--------|--------|----------|
| P95 Response (List) | < 500ms | < 1000ms |
| P95 Response (Search) | < 800ms | < 1500ms |
| P95 Response (Dashboard) | < 2000ms | < 3000ms |
| P95 Response (MRP) | < 30s | < 60s |
| Error Rate (Read) | < 5% | < 10% |
| Error Rate (Write) | < 2% | < 5% |
| Throughput | > 100 rps | > 50 rps |

---

## ⚡ PERFORMANCE TUNING

### Database Indexes

```bash
# Apply production indexes
psql $DATABASE_URL -f prisma/migrations/production_indexes.sql
```

**Critical indexes cho large datasets:**

```sql
-- Full-text search
CREATE INDEX CONCURRENTLY idx_part_fulltext ON "Part" 
  USING GIN (to_tsvector('english', coalesce("partNumber", '') || ' ' || coalesce("name", '')));

-- Composite filters
CREATE INDEX CONCURRENTLY idx_part_tenant_category_active 
  ON "Part" ("tenantId", "category", "isActive");

-- Partial indexes (chỉ index data quan trọng)
CREATE INDEX CONCURRENTLY idx_workorder_overdue 
  ON "WorkOrder" ("dueDate", "status") 
  WHERE "status" NOT IN ('COMPLETED', 'CANCELLED');

CREATE INDEX CONCURRENTLY idx_inventory_low_stock 
  ON "Inventory" ("quantity", "minQuantity") 
  WHERE "quantity" <= "minQuantity";
```

### Query Optimization

```typescript
// ❌ Không tốt - N+1 queries
const parts = await prisma.part.findMany();
for (const part of parts) {
  const inventory = await prisma.inventory.findMany({
    where: { partId: part.id }
  });
}

// ✅ Tốt - Single query với include
const parts = await prisma.part.findMany({
  include: { inventory: true }
});

// ✅ Tốt hơn - Select chỉ fields cần thiết
const parts = await prisma.part.findMany({
  select: {
    id: true,
    partNumber: true,
    name: true,
    inventory: {
      select: { quantity: true, warehouseId: true }
    }
  }
});
```

### Caching Strategy

```typescript
// Cache response data
import { CacheWithFallback } from '@/lib/optimization/resilience';

const cache = new CacheWithFallback<Part[]>(60000); // 1 min TTL

const parts = await cache.getOrFetch(
  `parts:${category}:${page}`,
  async () => prisma.part.findMany({ where: { category }, skip, take }),
  { ttl: 30000, fallback: [] }
);
```

---

## 📊 MONITORING & ALERTING

### Health Check Endpoints

```bash
# Basic health
curl https://your-app.com/api/health

# Enterprise diagnostics
curl https://your-app.com/api/enterprise/health

# Prometheus metrics
curl https://your-app.com/api/metrics
```

### Alert thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Response Time P95 | > 1000ms | > 2000ms | Scale up |
| Error Rate | > 1% | > 5% | Investigate |
| DB Connections | > 70% | > 90% | Add pooling |
| Memory Usage | > 80% | > 90% | Scale up |
| Disk Usage | > 70% | > 85% | Cleanup/expand |
| Dead Tuples | > 10% | > 20% | VACUUM |

### Monitoring Stack (Đề xuất)

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  alertmanager:
    image: prom/alertmanager
    ports:
      - "9093:9093"
```

---

## 🔄 DISASTER RECOVERY

### Backup Strategy

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Full Backup | Daily | 30 days | S3/GCS |
| Incremental | Hourly | 7 days | S3/GCS |
| WAL Archive | Continuous | 7 days | S3/GCS |
| Point-in-Time | - | 24 hours | Local |

### Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="s3://your-bucket/backups"

# Full backup
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/full_$DATE.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/full_$DATE.sql.gz" "$S3_BUCKET/"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +30 -delete
```

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| App Server Failure | 5 min | 0 |
| DB Primary Failure | 15 min | 1 min |
| Data Corruption | 1 hour | 1 hour |
| Full Disaster | 4 hours | 24 hours |

---

## ✅ CHECKLIST TRIỂN KHAI

### Pre-Deployment

```
□ Hardware provisioned và tested
□ PostgreSQL installed và configured
□ Redis cluster deployed
□ Network/firewall configured
□ SSL certificates installed
□ Backup system configured
□ Monitoring stack deployed
```

### Data Migration

```
□ Source data exported
□ Data validated và cleaned
□ Dry-run migration successful
□ Full migration completed
□ Data integrity verified
□ Indexes applied
□ VACUUM ANALYZE completed
```

### Performance Testing

```
□ Smoke test passed
□ Load test passed (100 VUs)
□ Stress test passed (200+ VUs)
□ Spike test passed (500 VUs)
□ Endurance test passed (30 min)
□ Performance targets met
```

### Go-Live

```
□ Final backup created
□ DNS configured
□ Load balancer configured
□ Alerts configured
□ On-call schedule established
□ Rollback plan documented
□ User training completed
```

### Post-Deployment

```
□ Monitor error rates (24h)
□ Monitor performance (48h)
□ User feedback collected
□ Issues documented
□ Runbooks updated
□ Team retrospective
```

---

## 📞 SUPPORT CONTACTS

| Role | Contact |
|------|---------|
| Technical Lead | tech-lead@company.com |
| DBA | dba@company.com |
| DevOps | devops@company.com |
| On-Call | +84-xxx-xxx-xxx |

---

*L-ERP MRP Enterprise Deployment Guide v1.0*
*Last Updated: 2026-01-05*
