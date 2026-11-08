# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 TASK: Critical Path Testing — OTBnonAI
# Priority: 🔴 CRITICAL
# Estimated: 2-3 hours
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 TASK OVERVIEW

```
MỤC TIÊU: Setup testing infrastructure + 60% coverage on critical paths
─────────────────────────────────────────────────────────────────────────
MODULES TO TEST:
├── Auth      → Login, logout, token management, validation
├── Budget    → CRUD, calculations, filters, validation  
└── Planning  → Version management, details, calculations
```

---

## ⚡ STEP 1: Install Dependencies (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Install Vitest and testing libraries
npm install -D vitest @vitejs/plugin-react jsdom

# Install React Testing Library
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install types
npm install -D @types/react @types/node
```

---

## ⚡ STEP 2: Create Configuration Files (10 min)

### 2.1 Create `vitest.config.ts` in root:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'backend'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2.2 Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

---

## ⚡ STEP 3: Create Test Setup Directory Structure (5 min)

```bash
mkdir -p src/test
mkdir -p src/features/auth/__tests__
mkdir -p src/features/budget/__tests__
mkdir -p src/features/planning/__tests__
```

---

## ⚡ STEP 4: Create Test Setup File (5 min)

Create `src/test/setup.ts`:

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';

// Mock Next.js Router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Reset between tests
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
```

---

## ⚡ STEP 5: Create Test Utilities File (10 min)

Create `src/test/utils.tsx`:

```typescript
// src/test/utils.tsx
import { vi } from 'vitest';

// ─── Mock Data Factory ──────────────────────────────────────────

export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'admin@your-domain.com',
  name: 'Admin User',
  role: 'admin' as const,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const mockBudget = (overrides = {}) => ({
  id: 'budget-1',
  name: 'BUD-FER-SS-2025',
  code: 'BUD-FER-SS-2025',
  totalBudget: 1000000000,
  committedBudget: 650000000,
  status: 'draft' as const,
  brandId: 'brand-1',
  fiscalYear: 2025,
  seasonGroup: 'SS',
  season: 'Pre',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const mockGroupBrand = (overrides = {}) => ({
  id: 'brand-1',
  name: 'Ferragamo',
  code: 'FER',
  sortOrder: 1,
  isActive: true,
  ...overrides,
});

export const mockPlanningVersion = (overrides = {}) => ({
  id: 'version-1',
  budgetId: 'budget-1',
  version: 'V1' as const,
  isFinal: false,
  totalPlanned: 800000000,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const mockPlanningDetail = (overrides = {}) => ({
  id: 'detail-1',
  planningVersionId: 'version-1',
  collectionId: 'collection-1',
  genderId: 'gender-1',
  categoryId: 'category-1',
  percentage: 60,
  amount: 480000000,
  ...overrides,
});

export const mockAuthResponse = (overrides = {}) => ({
  accessToken: 'mock-jwt-token-12345',
  refreshToken: 'mock-refresh-token-12345',
  user: mockUser(),
  ...overrides,
});

// ─── API Response Mocks ─────────────────────────────────────────

export const mockPaginatedResponse = <T>(data: T[], total?: number) => ({
  data,
  meta: {
    total: total ?? data.length,
    page: 1,
    pageSize: 20,
    totalPages: Math.ceil((total ?? data.length) / 20),
  },
});

export const mockApiError = (message: string, statusCode = 400) => ({
  message,
  statusCode,
  error: 'Bad Request',
});

// ─── Fetch Mock Helpers ─────────────────────────────────────────

export const mockFetchSuccess = <T>(data: T) => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
};

export const mockFetchError = (message: string, status = 400) => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => mockApiError(message, status),
  });
};

export const mockFetchNetworkError = () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
    new Error('Network error')
  );
};

export * from '@testing-library/react';
```

---

## ⚡ STEP 6: Create Test Files (Copy from provided files)

### 6.1 Auth Tests: `src/features/auth/__tests__/auth.test.ts`
(Copy from TESTING-SUITE files provided)

### 6.2 Budget Tests: `src/features/budget/__tests__/budget.test.ts`
(Copy from TESTING-SUITE files provided)

### 6.3 Planning Tests: `src/features/planning/__tests__/planning.test.ts`
(Copy from TESTING-SUITE files provided)

---

## ⚡ STEP 7: Run Tests (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

**Expected Output:**
```
 ✓ src/features/auth/__tests__/auth.test.ts (24 tests)
 ✓ src/features/budget/__tests__/budget.test.ts (35 tests)
 ✓ src/features/planning/__tests__/planning.test.ts (28 tests)

 Test Files  3 passed (3)
      Tests  87 passed (87)
   Start at  10:30:00
   Duration  2.5s
```

---

## ⚡ STEP 8: Fix Any Failing Tests (if needed)

Common issues and fixes:

### Issue 1: Import alias not working
```bash
# Check tsconfig.json has:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 2: Cannot find module
```bash
# Make sure setup.ts path is correct in vitest.config.ts
setupFiles: ['./src/test/setup.ts'],
```

### Issue 3: Types not found
```bash
# Install missing types
npm install -D @types/react-dom
```

---

## ⚡ STEP 9: Verify Coverage (5 min)

```bash
npm run test:coverage
```

**Expected Coverage:**
```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   65.2  |   62.8   |   68.5  |   65.2  |
 auth/                 |   72.0  |   68.0   |   75.0  |   72.0  |
 budget/               |   68.0  |   64.0   |   70.0  |   68.0  |
 planning/             |   62.0  |   58.0   |   65.0  |   62.0  |
-----------------------|---------|----------|---------|---------|
```

---

## ⚡ STEP 10: Commit (5 min)

```bash
git add -A

git commit -m "test: add critical path testing infrastructure

Testing Setup:
- Add Vitest configuration with coverage thresholds
- Add test setup with mocks (Router, localStorage, fetch)
- Add test utilities and mock data factory

Test Coverage:
- Auth: 24 tests (login, logout, token, validation)
- Budget: 35 tests (CRUD, calculations, filters)
- Planning: 28 tests (versions, details, calculations)

Total: 87 tests, ~65% coverage on critical paths

Run: npm run test:coverage"

git push origin main
```

---

## 📋 CHECKLIST

```
[ ] Step 1: Dependencies installed (vitest, testing-library)
[ ] Step 2: vitest.config.ts created
[ ] Step 3: Directory structure created
[ ] Step 4: src/test/setup.ts created
[ ] Step 5: src/test/utils.tsx created
[ ] Step 6: Test files created (auth, budget, planning)
[ ] Step 7: Tests run successfully
[ ] Step 8: All tests passing
[ ] Step 9: Coverage >= 60%
[ ] Step 10: Committed and pushed
```

---

## 📊 REPORT TEMPLATE

```
TESTING SETUP REPORT
═══════════════════════════════════════
Date: ___________
Repo: OTBnonAI

TEST RESULTS:
- Auth tests: ___/24 passed
- Budget tests: ___/35 passed
- Planning tests: ___/28 passed
- Total: ___/87 passed

COVERAGE:
- Statements: ___%
- Branches: ___%
- Functions: ___%
- Lines: ___%

STATUS: [ ] PASS (>60%) / [ ] FAIL (<60%)

COMMIT: ___________
```

---

## 📁 FILES PROVIDED

Copy these files from Claude output:

| File | Location | Lines |
|------|----------|-------|
| `vitest.config.ts` | Root | 45 |
| `setup.ts` | src/test/ | 80 |
| `utils.tsx` | src/test/ | 150 |
| `auth.test.ts` | src/features/auth/__tests__/ | 280 |
| `budget.test.ts` | src/features/budget/__tests__/ | 450 |
| `planning.test.ts` | src/features/planning/__tests__/ | 400 |

---

**Priority:** 🔴 CRITICAL
**Deadline:** Hoàn thành trong ngày
**Contact:** Báo cáo khi tests pass
