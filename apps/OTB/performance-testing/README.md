# L-ERP OTB — Performance Testing Suite

Comprehensive performance testing toolkit for L-ERP OTB Platform.

## Prerequisites

```bash
# macOS
brew install k6 jq
npm install -g lighthouse
```

## Quick Start

```bash
cd performance-testing/scripts

# Run all tests (backend on port 4000, frontend on port 3000)
./run-all-tests.sh

# Custom URLs
./run-all-tests.sh --backend-url http://localhost:4000 --frontend-url http://localhost:3000
```

## Individual Tests

```bash
# 1. Build Metrics (build time, bundle size)
./scripts/build-metrics.sh all

# 2. API Load Test (k6 — 50 users, 5 minutes)
k6 run --env API_URL=http://localhost:4000 scripts/api-load-test.js

# 3. Frontend Performance (Lighthouse)
./scripts/frontend-perf.sh http://localhost:3000

# 4. Database Performance (run from backend/)
cd ../backend
npx ts-node ../performance-testing/scripts/db-perf-test.ts
```

## Test Descriptions

| Test | Tool | Measures |
|------|------|----------|
| **Build Metrics** | bash | Build time, bundle size, node_modules, TypeScript check |
| **API Load** | k6 | Response time (p50/p95/p99), throughput, error rate |
| **Frontend** | Lighthouse | FCP, LCP, TBT, CLS, Performance/A11y/BP/SEO scores |
| **Database** | Prisma | Query execution time, slow query detection |
| **Memory** | ps | RSS, Heap usage of running backend |

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| API Response (p95) | <500ms | <1000ms |
| API Error Rate | <1% | <5% |
| Lighthouse Performance | >80 | >60 |
| FCP | <1800ms | <3000ms |
| LCP | <2500ms | <4000ms |
| TBT | <200ms | <600ms |
| CLS | <0.1 | <0.25 |
| Build Time (Backend) | <30s | <60s |
| Build Time (Frontend) | <60s | <120s |

## Reports

Output saved to `reports/`:

```
reports/
├── build_metrics_YYYYMMDD_HHMMSS.json
├── k6_results_YYYYMMDD_HHMMSS.json
├── api_load_test.json
├── lighthouse/
│   ├── home_*.report.html
│   └── home_*.report.json
├── lighthouse_summary_YYYYMMDD_HHMMSS.json
├── db_perf_test.json
├── memory_snapshot_YYYYMMDD_HHMMSS.json
├── PERFORMANCE_SUMMARY_YYYYMMDD_HHMMSS.md
└── COMPARISON_TEMPLATE.md
```

## Before/After Comparison

Use `reports/COMPARISON_TEMPLATE.md` to document before/after metrics:

1. Run tests on original repo (with AI)
2. Save results
3. Run tests on OTBnonAI (without AI)
4. Fill in comparison template
5. Calculate improvements
