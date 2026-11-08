# LAC VIET HR - Testing Suite

Comprehensive E2E (Playwright) and Stress Testing (K6) suite for LAC VIET HR system.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Stress Tests (K6)](#stress-tests-k6)
- [Test Structure](#test-structure)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm test

# Run stress tests
npm run stress:smoke
```

## 🎭 E2E Tests (Playwright)

### Running Tests

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug

# Run specific module
npm run test:auth
npm run test:employees
npm run test:leave
npm run test:recruitment
npm run test:performance

# Run on specific browser
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# Run by tag
npm run test:smoke        # Quick sanity tests
npm run test:critical     # Critical path tests
npm run test:regression   # Full regression
```

### Test Reports

```bash
# View HTML report
npm run report

# Open report in browser
npm run report:open
```

### Code Generation

```bash
# Generate test code by recording actions
npm run codegen

# Generate for mobile
npm run codegen:mobile
```

### Test Categories

| Module | Tests | Description |
|--------|-------|-------------|
| Auth | 25+ | Login, logout, MFA, SSO, session management |
| Employees | 30+ | CRUD, search, filter, bulk actions, import/export |
| Leave | 25+ | Requests, approvals, calendar, policies |
| Attendance | 35+ | Check-in/out, timesheet, overtime, shifts, reports |
| Payroll | 40+ | Periods, calculation, payslips, bank transfer, reports |
| Workflow | 25+ | Approvals, delegation, escalation, bulk actions |
| Recruitment | 20+ | Jobs, candidates, pipeline, interviews |
| Performance | 20+ | Goals, reviews, 360 feedback, competencies |
| Dashboard | 15+ | Stats, charts, widgets, navigation |
| LMS | 15+ | Courses, enrollments, progress tracking |

## 📊 Stress Tests (K6)

### Test Scenarios

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| **Smoke** | Basic functionality | 3 | 1m |
| **Load** | Normal expected load | 50-100 | 16m |
| **Stress** | Beyond normal capacity | 100-400 | 30m |
| **Spike** | Sudden traffic surge | 10-500 | 7m |
| **Soak** | Long duration stability | 100 | 30m |
| **Breakpoint** | Find system limits | 50-600 req/s | 12m |

### Running Stress Tests

```bash
# Smoke test (quick check)
npm run stress:smoke

# Load test
npm run stress:load

# Stress test
npm run stress

# Spike test
npm run stress:spike

# Soak test
npm run stress:soak

# Breakpoint test
npm run stress:breakpoint
```

### Module-Specific Stress Tests

```bash
# Test individual modules
npm run stress:employee
npm run stress:leave
npm run stress:recruitment
npm run stress:attendance
npm run stress:payroll

# Test all modules sequentially
npm run stress:all-modules
```

### Write Operations Stress Tests

```bash
# Run all write operation tests
npm run stress:write

# Test specific scenarios
npm run stress:write:creates      # Concurrent create operations
npm run stress:write:updates      # Concurrent update operations
npm run stress:write:mixed        # Mixed read/write workload
npm run stress:write:transactions # Transaction-heavy operations
```

### Write Operations Metrics

| Metric | Target |
|--------|--------|
| Create Success Rate | > 95% |
| Update Success Rate | > 98% |
| Transaction Success Rate | > 90% |
| Data Integrity Errors | < 10 |
| Deadlocks | 0 |

### Performance Thresholds

| Metric | Target |
|--------|--------|
| Response Time P95 | < 500ms |
| Response Time P99 | < 1000ms |
| Error Rate | < 1% |
| Throughput | 100+ req/s |

## 📁 Test Structure

```
lerp-hrm-testing/
├── tests/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── auth.spec.ts
│   │   │   └── login.spec.ts
│   │   ├── attendance/
│   │   │   └── attendance.spec.ts
│   │   ├── dashboard/
│   │   │   └── dashboard.spec.ts
│   │   ├── employees/
│   │   │   └── employee.spec.ts
│   │   ├── leave/
│   │   │   ├── leave-management.spec.ts
│   │   │   └── leave-management-full.spec.ts
│   │   ├── lms/
│   │   │   └── learning.spec.ts
│   │   ├── payroll/
│   │   │   ├── payroll.spec.ts
│   │   │   └── payroll-full.spec.ts
│   │   ├── performance/
│   │   │   ├── performance.spec.ts
│   │   │   └── performance-review.spec.ts
│   │   ├── recruitment/
│   │   │   ├── recruitment.spec.ts
│   │   │   └── recruitment-ats.spec.ts
│   │   └── workflow/
│   │       └── workflow-approval.spec.ts
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── EmployeePage.ts
│   │   ├── LeavePage.ts
│   │   ├── AttendancePage.ts
│   │   ├── PayrollPage.ts
│   │   └── index.ts
│   ├── fixtures/
│   │   ├── test-data.ts
│   │   ├── test-fixtures.ts
│   │   ├── global-setup.ts
│   │   └── global-teardown.ts
│   └── stress/
│       ├── k6-comprehensive-stress.js
│       ├── k6-module-stress.js
│       ├── k6-stress-test.js
│       └── k6-write-operations.js
├── reports/
├── .github/
│   └── workflows/
│       └── e2e-tests.yml
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## ⚙️ Configuration

### Environment Variables

```bash
# Base URL for tests
BASE_URL=http://localhost:3000

# Test secret for seeding data
TEST_SECRET=your-test-secret

# Skip web server (if running separately)
SKIP_WEB_SERVER=true

# Enable test data cleanup
CLEANUP_TEST_DATA=true
```

### Playwright Config

Key settings in `playwright.config.ts`:

- **Timeout**: 60s per test
- **Retries**: 2 in CI, 0 locally
- **Parallel**: Full parallel execution
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Locale**: vi-VN (Vietnamese)
- **Timezone**: Asia/Ho_Chi_Minh

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run ci
        
      - name: Upload reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: reports/
```

### GitLab CI

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.41.0
  script:
    - npm ci
    - npm run ci
  artifacts:
    when: always
    paths:
      - reports/
```

## 📝 Writing Tests

### Page Object Pattern

```typescript
import { EmployeePage } from '../pages/EmployeePage';

test('should create employee', async ({ page }) => {
  const employeePage = new EmployeePage(page);
  
  await employeePage.createEmployee({
    firstName: 'Nguyen',
    lastName: 'Van A',
    email: 'a@company.com',
    departmentId: 'Engineering',
    positionId: 'Developer',
    hireDate: '2025-01-01',
  });
  
  await employeePage.expectCreateSuccess();
});
```

### Test Data Generation

```typescript
import { generateEmployeeData } from '../fixtures/test-data';

test('should create random employee', async ({ page }) => {
  const employeeData = generateEmployeeData();
  await employeePage.createEmployee(employeeData);
});
```

### Tags

```typescript
test('@smoke should login', async ({ page }) => { ... });
test('@critical should create employee', async ({ page }) => { ... });
test('@regression should filter by all fields', async ({ page }) => { ... });
```

## 🔍 Debugging

```bash
# Debug with Playwright Inspector
npm run test:debug

# Run single test file
npx playwright test tests/e2e/auth/auth.spec.ts

# Run single test
npx playwright test -g "should login successfully"

# Show trace viewer for failures
npx playwright show-trace test-results/trace.zip
```

## 📈 Metrics & Monitoring

### K6 Output

Reports are generated in:
- `reports/stress-test-results.json`
- `reports/module-stress-results.json`

### Prometheus Export

```bash
# Run with Prometheus output
k6 run --out prometheus=namespace=k6 tests/stress/k6-comprehensive-stress.js
```

## 📞 Support

For issues or questions about the testing suite, contact the QA team.
