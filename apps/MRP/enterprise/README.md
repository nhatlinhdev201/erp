# 🏢 L-ERP MRP ENTERPRISE TOOLS v1.1
## Công cụ kiểm tra năng lực cho doanh nghiệp quy mô lớn

---

## 📦 NỘI DUNG

```
enterprise-tools/
├── migration/
│   ├── migrate.ts              # Data migration tool (streaming)
│   └── generate-test-data.js   # Test data generator (100K-5M records)
├── capacity-test/
│   ├── capacity-test.js        # K6 test suite (6 scenarios)
│   └── results/                # Test results output
├── health-check/
│   └── enterprise-health.ts    # Comprehensive diagnostics
├── api-routes/
│   └── enterprise-health-route.ts  # Copy to app/api/enterprise/health/
├── docs/
│   ├── ENTERPRISE-DEPLOYMENT-GUIDE.md
│   └── TESTING-CHECKLIST.md
└── README.md
```

---

## 🔧 INSTALLATION

```bash
# 1. Copy enterprise tools to project
cp -r enterprise-tools/migration project/enterprise/
cp -r enterprise-tools/capacity-test project/enterprise/
cp -r enterprise-tools/health-check project/enterprise/

# 2. Copy API route for health endpoint
mkdir -p project/app/api/enterprise/health
cp enterprise-tools/api-routes/enterprise-health-route.ts project/app/api/enterprise/health/route.ts

# 3. Install dependencies
npm install csv-parse xlsx
brew install k6  # macOS
# hoặc: sudo apt install k6  # Ubuntu
```

---

## 🚀 QUICK START

### 1. Generate Test Data

```bash
# Generate 100K test records (parts, customers, suppliers, inventory)
node enterprise/migration/generate-test-data.js ./test-data 100000

# Generate 1M parts, 50K customers, 10K suppliers, 1M inventory
node enterprise/migration/generate-test-data.js ./test-data 1000000 50000 10000 1000000
```

### 2. Data Migration

```bash
# Dry run - validation only
npx ts-node enterprise/migration/migrate.ts parts ./test-data/parts.csv --dry-run

# Import with progress tracking
npx ts-node enterprise/migration/migrate.ts parts ./test-data/parts.csv --batch-size=1000

# Import order (important!):
# 1. Parts first (inventory depends on parts)
npx ts-node enterprise/migration/migrate.ts parts ./data/parts.csv
# 2. Customers & Suppliers
npx ts-node enterprise/migration/migrate.ts customers ./data/customers.csv
npx ts-node enterprise/migration/migrate.ts suppliers ./data/suppliers.csv
# 3. Inventory last
npx ts-node enterprise/migration/migrate.ts inventory ./data/inventory.csv

# Resume from specific line if interrupted
npx ts-node enterprise/migration/migrate.ts parts ./data/parts.csv --resume-from=500000
```

### 3. Capacity Testing

```bash
# Run full test suite
k6 run enterprise/capacity-test/capacity-test.js \
  --env BASE_URL=https://your-app.com

# Run specific scenarios
k6 run --scenario database_capacity enterprise/capacity-test/capacity-test.js
k6 run --scenario concurrent_users enterprise/capacity-test/capacity-test.js
k6 run --scenario spike_test enterprise/capacity-test/capacity-test.js
k6 run --scenario endurance enterprise/capacity-test/capacity-test.js
```

### 4. Health Check

```bash
# Via API (after copying route)
curl https://your-app.com/api/enterprise/health | jq

# Check specific metrics
curl https://your-app.com/api/enterprise/health | jq '.metrics.database'
```

---

## 📊 MIGRATION TOOL

### Supported Entities & CSV Headers

| Entity | Required Headers | Optional Headers |
|--------|------------------|------------------|
| **parts** | partNumber, partName OR name | category, unit, unitCost, sellingPrice, leadTime |
| **customers** | code, name | email, phone, address, city, taxCode, paymentTerms |
| **suppliers** | code, name | email, phone, address, taxCode |
| **inventory** | partNumber, onHand OR quantity | safetyStock, reorderPoint, warehouseLocation, binLocation |

### Options

| Option | Description |
|--------|-------------|
| `--batch-size=N` | Records per batch (default: 1000) |
| `--dry-run` | Validate only, no database changes |
| `--resume-from=N` | Resume from line N |

### Performance Estimates

| Records | Batch Size | Est. Time | Notes |
|---------|------------|-----------|-------|
| 100K | 1000 | 5-10 min | Quick test |
| 500K | 2000 | 20-30 min | Medium enterprise |
| 1M | 5000 | 45-60 min | Large enterprise |
| 5M | 5000 | 4-6 hours | Schedule off-peak |

---

## 🧪 CAPACITY TEST SCENARIOS

| Scenario | Max VUs | Duration | Purpose |
|----------|---------|----------|---------|
| **database_capacity** | 200 | 15m | Test DB performance với millions records |
| **concurrent_users** | 200 | 10m | Simulate 200 concurrent users |
| **write_heavy** | 300 | 10m | Heavy concurrent write operations |
| **complex_operations** | 20 | 5m | MRP runs, Reports, Exports |
| **spike_test** | 500 | 2.5m | Sudden traffic spike (10x) |
| **endurance** | 100 | 30m | Long-running stability |

### Performance Targets

| Metric | Target | Critical | Action if Failed |
|--------|--------|----------|------------------|
| P95 Response | < 500ms | < 1000ms | Add indexes, optimize queries |
| P99 Response | < 1000ms | < 2000ms | Scale up, add caching |
| Error Rate | < 1% | < 5% | Check logs, fix bugs |
| Throughput | > 100 rps | > 50 rps | Scale horizontally |

---

## 🏥 HEALTH CHECK API

### Response Structure

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2026-01-06T...",
  "checks": [
    { "name": "database", "status": "pass", "latency": 5 },
    { "name": "memory", "status": "pass", "message": "..." },
    { "name": "connection_pool", "status": "pass", "details": {...} },
    { "name": "cache_hit_ratio", "status": "pass", "message": "..." }
  ],
  "metrics": {
    "database": {
      "totalRows": 1250000,
      "tables": [...],
      "cacheHitRatio": 99.5
    },
    "connections": { "active": 5, "idle": 15, "max_connections": 100 },
    "memory": { "heapUsed": 256000000, "usagePercent": 45.2 }
  },
  "recommendations": [
    "Consider table partitioning for large tables",
    "Enable query result caching with Redis"
  ]
}
```

---

## 📋 ENTERPRISE SCALE REFERENCE

| Scale | Parts | Inventory | Users | Recommended Specs |
|-------|-------|-----------|-------|-------------------|
| **Medium** | 100K - 1M | 500K | 100 | 8 core / 16GB / 200GB SSD |
| **Large** | 1M - 5M | 5M | 500 | 16 core / 64GB / 500GB NVMe |
| **Enterprise** | 5M+ | 10M+ | 1000+ | Cluster (3+ nodes) |

---

## ✅ CHANGELOG v1.1

### Fixes
- ✅ Part schema: Uses `partName` field (accepts `name` as alias)
- ✅ Inventory schema: Uses `onHand` field (accepts `quantity` as alias)
- ✅ Inventory: Single inventory per part (partId unique)
- ✅ API endpoints: Match actual L-ERP MRP routes

### Additions
- ➕ Test data generator (100K - 5M records)
- ➕ Enterprise health API route
- ➕ Improved progress tracking with ETA
- ➕ Error rate threshold monitoring

---

## 📖 DOCUMENTATION

- [Enterprise Deployment Guide](docs/ENTERPRISE-DEPLOYMENT-GUIDE.md) - Full deployment instructions
- [Testing Checklist](docs/TESTING-CHECKLIST.md) - QA checklist for technicians

---

*L-ERP MRP Enterprise Tools v1.1 - Production Ready*
