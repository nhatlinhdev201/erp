# 🚀 L-ERP MRP LOAD TESTING GUIDE
## K6 & Artillery Performance Benchmarks

---

## 📋 OVERVIEW

Comprehensive load testing suite for L-ERP MRP using:
- **K6** - Modern load testing tool (JavaScript-based)
- **Artillery** - Cloud-native performance testing

---

## 📁 DIRECTORY STRUCTURE

```
load-tests/
├── k6/
│   ├── main.js           # Main K6 test suite
│   └── api-tests.js      # API endpoint tests
├── artillery/
│   ├── main.yml          # Main Artillery config
│   ├── smoke.yml         # Smoke test
│   └── stress.yml        # Stress test
├── scripts/
│   └── run-tests.sh      # Test runner script
├── results/              # Test results output
└── README.md             # This file
```

---

## 🔧 INSTALLATION

### K6
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Docker
docker pull grafana/k6
```

### Artillery
```bash
npm install -g artillery
npm install -g artillery-plugin-expect
npm install -g artillery-plugin-metrics-by-endpoint
```

---

## 🏃 RUNNING TESTS

### Quick Start

```bash
# Make script executable
chmod +x load-tests/scripts/run-tests.sh

# Check dependencies
./load-tests/scripts/run-tests.sh check

# Run smoke tests
./load-tests/scripts/run-tests.sh smoke

# Run load tests
./load-tests/scripts/run-tests.sh load

# Run stress tests
./load-tests/scripts/run-tests.sh stress

# Run all tests
./load-tests/scripts/run-tests.sh all
```

### Custom Target URL

```bash
BASE_URL=https://staging.lerp-mrp.com ./load-tests/scripts/run-tests.sh load
```

### Individual Test Commands

```bash
# K6 tests
k6 run load-tests/k6/main.js
k6 run load-tests/k6/api-tests.js

# K6 with specific scenario
k6 run --scenario smoke load-tests/k6/main.js
k6 run --scenario load load-tests/k6/main.js
k6 run --scenario stress load-tests/k6/main.js

# Artillery tests
artillery run load-tests/artillery/smoke.yml
artillery run load-tests/artillery/main.yml
artillery run load-tests/artillery/stress.yml
```

---

## 📊 TEST SCENARIOS

### 1. Smoke Test
**Purpose:** Quick validation that system works under minimal load

| Parameter | Value |
|-----------|-------|
| Duration | 30 seconds |
| VUs | 1-3 |
| Purpose | Basic functionality check |

```bash
./load-tests/scripts/run-tests.sh smoke
```

### 2. Load Test
**Purpose:** Normal traffic simulation

| Parameter | Value |
|-----------|-------|
| Duration | 16 minutes |
| VUs | Ramp 0 → 50 → 100 → 0 |
| Purpose | Typical user load |

```bash
./load-tests/scripts/run-tests.sh load
```

### 3. Stress Test
**Purpose:** Find system breaking point

| Parameter | Value |
|-----------|-------|
| Duration | 19 minutes |
| VUs | Ramp 0 → 100 → 200 → 300 → 400 → 0 |
| Purpose | Find limits |

```bash
./load-tests/scripts/run-tests.sh stress
```

### 4. Spike Test
**Purpose:** Sudden traffic burst

| Parameter | Value |
|-----------|-------|
| Duration | 3 minutes |
| VUs | 50 → 500 → 50 |
| Purpose | Handle traffic spikes |

```bash
k6 run --scenario spike load-tests/k6/main.js
```

### 5. API Endpoint Tests
**Purpose:** Per-endpoint performance

```bash
./load-tests/scripts/run-tests.sh api
```

---

## 🎯 PERFORMANCE THRESHOLDS

### Target SLAs

| Metric | Target | Critical |
|--------|--------|----------|
| P95 Response Time | < 500ms | < 1000ms |
| P99 Response Time | < 1000ms | < 2000ms |
| Error Rate | < 1% | < 5% |
| Throughput | > 100 rps | > 50 rps |
| Availability | > 99.9% | > 99% |

### Endpoint-Specific Thresholds

| Endpoint | P95 Target |
|----------|------------|
| Health Check | < 100ms |
| Dashboard | < 500ms |
| Parts List | < 300ms |
| Parts Search | < 500ms |
| Inventory | < 300ms |
| Production | < 500ms |
| MRP Run | < 5000ms |

---

## 📈 METRICS COLLECTED

### K6 Metrics
- `http_req_duration` - Total request duration
- `http_req_waiting` - Time waiting for response
- `http_req_connecting` - Time to connect
- `http_req_sending` - Time sending request
- `http_req_receiving` - Time receiving response
- `http_reqs` - Total requests
- `errors` - Error rate
- Custom endpoint trends

### Artillery Metrics
- `http.response_time` - Response time stats
- `http.codes` - HTTP status code distribution
- `http.requests` - Total requests
- `vusers.created` - Virtual users created
- `vusers.completed` - Virtual users completed

---

## 📊 VIEWING RESULTS

### K6 Results

```bash
# JSON output
cat load-tests/results/k6-load-*.json | jq .

# HTML report (if generated)
open load-tests/results/summary-*.html
```

### Artillery Results

```bash
# Generate HTML report
artillery report load-tests/results/artillery-load-*.json

# View HTML report
open load-tests/results/artillery-load-*.html
```

### Grafana Integration (K6)

```bash
# Run with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 load-tests/k6/main.js
```

---

## 🔄 CI/CD INTEGRATION

### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup K6
        uses: grafana/setup-k6-action@v1
      
      - name: Setup Artillery
        run: npm install -g artillery
      
      - name: Run Smoke Test
        run: |
          k6 run --env BASE_URL=${{ secrets.STAGING_URL }} load-tests/k6/main.js --scenario smoke
      
      - name: Run Load Test
        if: github.event_name == 'schedule'
        run: |
          k6 run --env BASE_URL=${{ secrets.STAGING_URL }} load-tests/k6/main.js --scenario load
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: load-tests/results/
```

### GitLab CI

```yaml
load-test:
  stage: test
  image: grafana/k6
  script:
    - k6 run --env BASE_URL=$STAGING_URL load-tests/k6/main.js --scenario smoke
  artifacts:
    paths:
      - load-tests/results/
    expire_in: 1 week
```

---

## 🛠️ CUSTOMIZATION

### Adding New Endpoints

**K6:**
```javascript
// In load-tests/k6/main.js
group('New Module', function() {
  apiGet('/new-endpoint', token, newEndpointTrend, 'new-endpoint');
  sleep(1);
});
```

**Artillery:**
```yaml
# In load-tests/artillery/main.yml
scenarios:
  - name: "New Flow"
    weight: 10
    flow:
      - get:
          url: "/api/v2/new-endpoint"
          expect:
            - statusCode: 200
```

### Custom Thresholds

```javascript
// In K6
thresholds: {
  'new_endpoint_duration': ['p(95)<300'],
}
```

---

## 🚨 TROUBLESHOOTING

### Common Issues

**1. Connection refused**
```bash
# Check server is running
curl http://localhost:3000/api/health
```

**2. Too many open files**
```bash
# Increase limit (macOS/Linux)
ulimit -n 10000
```

**3. Out of memory**
```bash
# Run K6 with limited memory
k6 run --no-vu-connection-reuse load-tests/k6/main.js
```

**4. High error rate**
- Check server logs
- Reduce VUs/arrival rate
- Check database connections

---

## 📋 CHECKLIST

### Pre-Test
- [ ] Server is running and healthy
- [ ] Database is seeded with test data
- [ ] K6 and Artillery installed
- [ ] Target URL configured

### Post-Test
- [ ] Review error rate
- [ ] Check P95/P99 response times
- [ ] Analyze slow endpoints
- [ ] Compare with baselines
- [ ] Document findings

---

## 📚 REFERENCES

- [K6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://artillery.io/docs/)
- [K6 Cloud](https://k6.io/cloud/)
- [Artillery Pro](https://artillery.io/pro/)

---

*L-ERP MRP Load Testing Suite v1.0*
