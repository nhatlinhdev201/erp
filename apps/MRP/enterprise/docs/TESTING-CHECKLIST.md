# 📋 L-ERP MRP ENTERPRISE TESTING CHECKLIST
## Danh sách kiểm tra dành cho kỹ thuật viên

---

## 🎯 MỤC TIÊU KIỂM TRA

Xác nhận hệ thống L-ERP MRP có khả năng:
- [ ] Xử lý **1-5 triệu records** trong database
- [ ] Hỗ trợ **100-500 users** đồng thời
- [ ] Response time P95 **< 1 giây** cho operations thông thường
- [ ] Import dữ liệu **100K+ records** trong thời gian hợp lý
- [ ] Hoạt động ổn định **24/7** không downtime

---

## 📊 PHASE 1: KIỂM TRA CƠ SỞ HẠ TẦNG

### 1.1 Database Server

```bash
# Kiểm tra PostgreSQL version
psql -V
# Expected: PostgreSQL 14.x+

# Kiểm tra connections
psql -c "SELECT count(*) FROM pg_stat_activity"

# Kiểm tra disk space
df -h /var/lib/postgresql
# Expected: > 50% free

# Kiểm tra memory config
psql -c "SHOW shared_buffers"
psql -c "SHOW effective_cache_size"
```

**Checklist:**
- [ ] PostgreSQL 14+ installed
- [ ] shared_buffers = 25% RAM
- [ ] effective_cache_size = 75% RAM
- [ ] Disk space > 50% free
- [ ] Connection limit > 100

### 1.2 Application Server

```bash
# Kiểm tra Node.js version
node -v
# Expected: v18.x or v20.x

# Kiểm tra memory
free -h

# Kiểm tra CPU
nproc
```

**Checklist:**
- [ ] Node.js 18+ installed
- [ ] RAM >= 8GB
- [ ] CPU >= 4 cores
- [ ] PM2 hoặc similar process manager

### 1.3 Network

```bash
# Test database connection latency
time psql -c "SELECT 1" > /dev/null

# Test API health
curl -w "@curl-format.txt" https://app.domain.com/api/health
```

**Checklist:**
- [ ] DB latency < 10ms
- [ ] API health check < 100ms
- [ ] SSL configured
- [ ] Firewall rules correct

---

## 📦 PHASE 2: KIỂM TRA DATA MIGRATION

### 2.1 Chuẩn bị test data

```bash
# Tạo test data (100K parts)
cat > generate_test_data.py << 'EOF'
import csv
import random

with open('test_parts_100k.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['partNumber', 'name', 'category', 'unit', 'unitCost', 'minStock', 'maxStock'])
    
    categories = ['COMPONENT', 'ASSEMBLY', 'RAW_MATERIAL', 'FINISHED_GOOD']
    
    for i in range(100000):
        writer.writerow([
            f'PART-{i:06d}',
            f'Test Part {i}',
            random.choice(categories),
            'PCS',
            round(random.uniform(1, 1000), 2),
            random.randint(10, 100),
            random.randint(500, 5000)
        ])
EOF

python generate_test_data.py
```

### 2.2 Test migration

```bash
# Dry run
npx ts-node enterprise/migration/migrate.ts parts test_parts_100k.csv --dry-run

# Actual import
npx ts-node enterprise/migration/migrate.ts parts test_parts_100k.csv --batch-size=1000
```

**Record Results:**

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| 100K records import time | < 10 min | _____ min | [ ] |
| Error rate | < 1% | _____% | [ ] |
| Records/second | > 200 | _____ | [ ] |

### 2.3 Verify data

```bash
# Count records
psql -c "SELECT count(*) FROM \"Part\""

# Check for duplicates
psql -c "SELECT \"partNumber\", count(*) FROM \"Part\" GROUP BY \"partNumber\" HAVING count(*) > 1"

# Check indexes
psql -c "SELECT indexname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'Part' ORDER BY idx_scan DESC LIMIT 10"
```

**Checklist:**
- [ ] Record count matches source
- [ ] No duplicates
- [ ] Indexes created
- [ ] VACUUM ANALYZE run

---

## ⚡ PHASE 3: KIỂM TRA PERFORMANCE

### 3.1 Single User Performance

```bash
# Test API response times
curl -w "Time: %{time_total}s\n" "https://app.domain.com/api/v2/parts?page=1&pageSize=50"
curl -w "Time: %{time_total}s\n" "https://app.domain.com/api/v2/parts?search=test"
curl -w "Time: %{time_total}s\n" "https://app.domain.com/api/v2/dashboard"
```

**Record Results:**

| API | Target | Actual | Pass/Fail |
|-----|--------|--------|-----------|
| Parts list | < 500ms | _____ ms | [ ] |
| Parts search | < 800ms | _____ ms | [ ] |
| Dashboard | < 2000ms | _____ ms | [ ] |

### 3.2 Load Testing

```bash
# Install K6
brew install k6  # macOS
# hoặc
sudo apt install k6  # Ubuntu

# Run capacity test
k6 run enterprise/capacity-test/capacity-test.js \
  --env BASE_URL=https://app.domain.com
```

**Record Results:**

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Max concurrent users | 200 | _____ | [ ] |
| P95 response time | < 1000ms | _____ ms | [ ] |
| Error rate | < 5% | _____% | [ ] |
| Throughput | > 100 rps | _____ rps | [ ] |

### 3.3 Database Performance

```bash
# Check slow queries
psql -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"

# Check index usage
psql -c "SELECT relname, seq_scan, idx_scan FROM pg_stat_user_tables ORDER BY seq_scan DESC LIMIT 10"

# Check cache hit ratio
psql -c "SELECT sum(heap_blks_hit) / sum(heap_blks_hit + heap_blks_read) * 100 as ratio FROM pg_statio_user_tables"
```

**Checklist:**
- [ ] No queries > 1000ms mean time
- [ ] Index scans > Sequential scans
- [ ] Cache hit ratio > 95%

---

## 🛡️ PHASE 4: KIỂM TRA STABILITY

### 4.1 Endurance Test

```bash
# Run 30-minute endurance test
k6 run --scenario endurance enterprise/capacity-test/capacity-test.js
```

**Monitor during test:**
- [ ] Memory usage stable (no leak)
- [ ] CPU usage < 80%
- [ ] No connection exhaustion
- [ ] Error rate consistent

### 4.2 Spike Test

```bash
# Run spike test (sudden traffic surge)
k6 run --scenario spike_test enterprise/capacity-test/capacity-test.js
```

**Checklist:**
- [ ] System recovers from spike
- [ ] No crashes or restarts
- [ ] Error rate returns to normal

### 4.3 Failover Test (nếu có HA)

```bash
# Simulate database failover
# (Chỉ làm trong môi trường staging)

# 1. Kill primary database
sudo systemctl stop postgresql

# 2. Verify app handles gracefully
curl https://app.domain.com/api/health

# 3. Start database
sudo systemctl start postgresql

# 4. Verify recovery
curl https://app.domain.com/api/health
```

---

## 📋 PHASE 5: TỔNG HỢP KẾT QUẢ

### Summary Report

```
╔══════════════════════════════════════════════════════════════════╗
║           L-ERP MRP ENTERPRISE CAPACITY TEST REPORT                ║
╠══════════════════════════════════════════════════════════════════╣
║ Date:        _____________                                       ║
║ Tester:      _____________                                       ║
║ Environment: _____________                                       ║
╠══════════════════════════════════════════════════════════════════╣
║ DATABASE CAPACITY                                                ║
║   Total Parts:           ____________ records                    ║
║   Total Inventory:       ____________ records                    ║
║   Total Work Orders:     ____________ records                    ║
║   Database Size:         ____________ GB                         ║
╠══════════════════════════════════════════════════════════════════╣
║ PERFORMANCE                                                      ║
║   Max Concurrent Users:  ____________                            ║
║   P95 Response Time:     ____________ ms                         ║
║   P99 Response Time:     ____________ ms                         ║
║   Throughput:            ____________ req/sec                    ║
║   Error Rate:            ____________ %                          ║
╠══════════════════════════════════════════════════════════════════╣
║ MIGRATION                                                        ║
║   100K Parts Import:     ____________ minutes                    ║
║   Import Rate:           ____________ records/sec                ║
║   Success Rate:          ____________ %                          ║
╠══════════════════════════════════════════════════════════════════╣
║ STABILITY                                                        ║
║   Endurance (30min):     [ ] PASS  [ ] FAIL                     ║
║   Spike Recovery:        [ ] PASS  [ ] FAIL                     ║
║   Memory Stability:      [ ] PASS  [ ] FAIL                     ║
╠══════════════════════════════════════════════════════════════════╣
║ OVERALL RESULT:          [ ] APPROVED  [ ] NEEDS IMPROVEMENT    ║
╠══════════════════════════════════════════════════════════════════╣
║ NOTES:                                                           ║
║ ________________________________________________________________║
║ ________________________________________________________________║
║ ________________________________________________________________║
╚══════════════════════════════════════════════════════════════════╝

Signature: ___________________    Date: ___________________
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Slow queries | Missing indexes | Run production_indexes.sql |
| High error rate | Connection exhaustion | Increase pool size |
| Memory leak | Unclosed connections | Check for connection leaks |
| Import failures | Data validation | Review error logs |
| Timeout errors | Query too complex | Optimize query/add index |

### Quick Fixes

```bash
# Reset connection pool
sudo systemctl restart postgresql

# Clear application cache
redis-cli FLUSHALL

# Rebuild indexes
psql -c "REINDEX DATABASE rtr_mrp"

# Force vacuum
psql -c "VACUUM FULL ANALYZE"
```

---

## 📝 SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Engineer | | | |
| DBA | | | |
| DevOps | | | |
| Project Manager | | | |

---

*L-ERP MRP Enterprise Testing Checklist v1.0*
