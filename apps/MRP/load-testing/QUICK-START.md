# 🚀 L-ERP MRP LOAD TESTING - QUICK START

## Installation

```bash
# Install K6
brew install k6          # macOS
# or
sudo apt install k6      # Linux

# Install Artillery
npm install -g artillery
```

## Run Tests

```bash
# Make executable
chmod +x scripts/run-tests.sh

# Check dependencies
./scripts/run-tests.sh check

# Run smoke test (quick)
./scripts/run-tests.sh smoke

# Run full load test
./scripts/run-tests.sh load

# Run stress test
./scripts/run-tests.sh stress

# Run all tests
./scripts/run-tests.sh all
```

## Custom Target

```bash
BASE_URL=https://your-app.com ./scripts/run-tests.sh load
```

## Test Scenarios

| Test | Duration | Max VUs | Purpose |
|------|----------|---------|---------|
| Smoke | 30s | 3 | Quick validation |
| Load | 16m | 100 | Normal traffic |
| Stress | 19m | 400 | Find limits |
| Spike | 3m | 500 | Traffic burst |

## Performance Targets

| Metric | Target |
|--------|--------|
| P95 Response Time | < 500ms |
| Error Rate | < 1% |
| Throughput | > 100 rps |

## Results

Results saved to `results/` directory with:
- JSON reports
- HTML reports
- Summary metrics

See `README.md` for full documentation.
