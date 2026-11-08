# Testing Guide

**Hướng dẫn kiểm thử / Testing Guide**

Comprehensive testing strategy for L-ERP including unit, integration, and end-to-end tests.

## Testing Stack / Công nghệ kiểm thử

- **Unit Tests**: Vitest
- **E2E Tests**: Playwright
- **Integration Tests**: Vitest + Docker containers
- **Test Data**: Fixtures & factories
- **Coverage**: Minimum 70% for all modules

## Unit Tests / Kiểm thử đơn vị

### Setup / Thiết lập

Create `vitest.config.ts` in your app:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'tests/',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Writing Unit Tests / Viết kiểm thử đơn vị

```typescript
// tests/unit/services/customer.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as customerService from '@/services/customer.service';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('CustomerService', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create customer with valid input', async () => {
      const input = {
        name: 'Công ty ABC',
        email: 'contact@abc.vn',
        taxCode: '0123456789',
      };

      const mockCustomer = {
        id: 'cust-1',
        ...input,
        tenantId: mockTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        status: 'active',
      };

      vi.mocked(prisma.customer.create).mockResolvedValueOnce(mockCustomer);

      const result = await customerService.createCustomer(
        mockTenantId,
        mockUserId,
        input
      );

      expect(result).toEqual(mockCustomer);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining(input),
      });
    });

    it('should throw error for invalid email', async () => {
      const input = {
        name: 'Công ty ABC',
        email: 'invalid-email',
        taxCode: '0123456789',
      };

      await expect(
        customerService.createCustomer(mockTenantId, mockUserId, input)
      ).rejects.toThrow('Invalid email');
    });

    it('should throw error for duplicate taxCode', async () => {
      const input = {
        name: 'Công ty ABC',
        email: 'contact@abc.vn',
        taxCode: '0123456789',
      };

      vi.mocked(prisma.customer.create).mockRejectedValueOnce(
        new Error('Unique constraint failed')
      );

      await expect(
        customerService.createCustomer(mockTenantId, mockUserId, input)
      ).rejects.toThrow();
    });
  });

  describe('getCustomer', () => {
    it('should retrieve customer by id', async () => {
      const mockCustomer = {
        id: 'cust-1',
        name: 'Công ty ABC',
        tenantId: mockTenantId,
      };

      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(
        mockCustomer
      );

      const result = await customerService.getCustomer(mockTenantId, 'cust-1');

      expect(result).toEqual(mockCustomer);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
      });
    });

    it('should return null if customer not found', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);

      const result = await customerService.getCustomer(mockTenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listCustomers', () => {
    it('should list customers with pagination', async () => {
      const mockCustomers = [
        { id: 'cust-1', name: 'ABC' },
        { id: 'cust-2', name: 'XYZ' },
      ];

      vi.mocked(prisma.customer.findMany).mockResolvedValueOnce(mockCustomers);
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(2);

      const result = await customerService.listCustomers(mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(mockCustomers);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter customers by status', async () => {
      const mockCustomers = [{ id: 'cust-1', status: 'active' }];

      vi.mocked(prisma.customer.findMany).mockResolvedValueOnce(mockCustomers);

      await customerService.listCustomers(mockTenantId, {
        page: 1,
        limit: 20,
        filter: { status: 'active' },
      });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });
  });
});
```

### Testing API Routes / Kiểm thử tuyến API

```typescript
// tests/unit/api/customer.route.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/customer/route';

// Mock auth middleware
vi.mock('@linkk/auth', () => ({
  withAuth: (handler: any) => handler,
}));

// Mock service
vi.mock('@/services/customer.service', () => ({
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
}));

describe('Customer API Routes', () => {
  describe('GET /api/v1/customer', () => {
    it('should return paginated customers', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/v1/customer?page=1&limit=20',
      } as any;

      const response = await GET(mockRequest, {
        tenantId: 'tenant-1',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
    });

    it('should handle errors gracefully', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/v1/customer?page=invalid',
      } as any;

      const response = await GET(mockRequest, {
        tenantId: 'tenant-1',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/customer', () => {
    it('should create customer with valid input', async () => {
      const mockRequest = {
        json: async () => ({
          name: 'Công ty ABC',
          email: 'contact@abc.vn',
          taxCode: '0123456789',
        }),
      } as any;

      const response = await POST(mockRequest, {
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      expect(response.status).toBe(201);
    });
  });
});
```

## Integration Tests / Kiểm thử tích hợp

Integration tests use real database and services:

```typescript
// tests/integration/customer.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as customerService from '@/services/customer.service';

describe('Customer Integration Tests', () => {
  const mockTenantId = 'integration-test-tenant';
  const mockUserId = 'integration-test-user';

  beforeEach(async () => {
    // Setup: Create test tenant
    await prisma.tenant.create({
      data: { id: mockTenantId, name: 'Test Tenant' },
    });
  });

  afterEach(async () => {
    // Cleanup: Remove test data
    await prisma.customer.deleteMany({ where: { tenantId: mockTenantId } });
    await prisma.tenant.delete({ where: { id: mockTenantId } });
  });

  it('should create and retrieve customer end-to-end', async () => {
    // Create
    const created = await customerService.createCustomer(
      mockTenantId,
      mockUserId,
      {
        name: 'Công ty ABC',
        email: 'contact@abc.vn',
        taxCode: '0123456789',
      }
    );

    expect(created).toHaveProperty('id');

    // Retrieve
    const retrieved = await customerService.getCustomer(
      mockTenantId,
      created.id
    );

    expect(retrieved?.name).toBe('Công ty ABC');
    expect(retrieved?.email).toBe('contact@abc.vn');
  });

  it('should enforce tenant isolation', async () => {
    const anotherTenant = 'another-tenant';
    await prisma.tenant.create({
      data: { id: anotherTenant, name: 'Another Tenant' },
    });

    // Create customer in first tenant
    const customer = await customerService.createCustomer(
      mockTenantId,
      mockUserId,
      {
        name: 'Test Customer',
        email: 'test@example.com',
        taxCode: '0123456789',
      }
    );

    // Try to access from another tenant - should not find
    const result = await customerService.getCustomer(
      anotherTenant,
      customer.id
    );

    expect(result).toBeNull();

    // Cleanup
    await prisma.customer.deleteMany({ where: { tenantId: anotherTenant } });
    await prisma.tenant.delete({ where: { id: anotherTenant } });
  });
});
```

## End-to-End Tests / Kiểm thử E2E

### Playwright Configuration / Cấu hình Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

### Writing E2E Tests / Viết kiểm thử E2E

```typescript
// tests/e2e/customer-crud.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Customer CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@lerp.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('should create a new customer', async ({ page }) => {
    // Navigate to customers
    await page.goto('/customers');

    // Click add customer button
    await page.click('button:has-text("Add Customer")');

    // Fill form
    await page.fill('input[name="name"]', 'Công ty ABC');
    await page.fill('input[name="email"]', 'contact@abc.vn');
    await page.fill('input[name="taxCode"]', '0123456789');

    // Submit
    await page.click('button:has-text("Create")');

    // Verify success message
    await expect(page.locator('.toast-success')).toContainText(
      'Customer created successfully'
    );

    // Verify customer appears in list
    await expect(page.locator('text=Công ty ABC')).toBeVisible();
  });

  test('should edit an existing customer', async ({ page }) => {
    // Navigate to customers
    await page.goto('/customers');

    // Click edit on first customer
    await page.click('button[aria-label="Edit customer"]');

    // Update name
    await page.fill('input[name="name"]', 'Công ty ABC Updated');

    // Submit
    await page.click('button:has-text("Save")');

    // Verify success
    await expect(page.locator('.toast-success')).toContainText(
      'Customer updated successfully'
    );
  });

  test('should delete a customer', async ({ page }) => {
    // Navigate to customers
    await page.goto('/customers');

    // Click delete on first customer
    await page.click('button[aria-label="Delete customer"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")');

    // Verify success
    await expect(page.locator('.toast-success')).toContainText(
      'Customer deleted successfully'
    );
  });

  test('should search customers by name', async ({ page }) => {
    // Navigate to customers
    await page.goto('/customers');

    // Enter search term
    await page.fill('input[placeholder="Search customers..."]', 'ABC');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify results contain search term
    const results = await page.locator('table tbody tr');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to customers
    await page.goto('/customers');

    // Simulate network error
    await page.context().setOffline(true);

    // Try to create customer
    await page.click('button:has-text("Add Customer")');
    await page.fill('input[name="name"]', 'Test');
    await page.click('button:has-text("Create")');

    // Verify error message
    await expect(page.locator('.toast-error')).toContainText(
      'Connection failed'
    );

    // Re-enable network
    await page.context().setOffline(false);
  });
});
```

### Testing Authentication Flows / Kiểm thử luồng xác thực

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@lerp.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@lerp.local');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('.error-message')).toContainText(
      'Invalid credentials'
    );
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@lerp.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('button:has-text("Logout")');

    // Verify redirected to login
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });
});
```

## Running Tests / Chạy kiểm thử

### Unit & Integration Tests / Kiểm thử đơn vị & tích hợp

```bash
# Run all tests
npm run test

# Watch mode (re-run on change)
npm run test -- --watch

# Specific test file
npm run test -- tests/unit/services/customer.service.test.ts

# Coverage report
npm run test -- --coverage

# UI mode (visual test runner)
npm run test -- --ui
```

### E2E Tests / Kiểm thử E2E

```bash
# Run all E2E tests
npm run test:e2e

# Headed mode (see browser window)
npm run test:e2e -- --headed

# Debug mode (pause on failure)
npm run test:e2e -- --debug

# Specific test file
npm run test:e2e -- tests/e2e/customer-crud.spec.ts

# Generate HTML report
npm run test:e2e
```

## Test Fixtures & Factories / Đạo cụ kiểm thử & Nhà máy

Create reusable test data:

```typescript
// tests/fixtures/customer.fixture.ts
import { prisma } from '@/lib/prisma';

export async function createTestCustomer(
  tenantId: string,
  userId: string,
  overrides?: Partial<any>
) {
  return prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'test@example.com',
      taxCode: '0123456789',
      tenantId,
      createdBy: userId,
      ...overrides,
    },
  });
}

export async function createTestCustomers(
  tenantId: string,
  userId: string,
  count: number = 10
) {
  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      createTestCustomer(tenantId, userId, {
        name: `Test Customer ${i + 1}`,
        email: `test${i + 1}@example.com`,
      })
    )
  );
}
```

## CI/CD Integration / Tích hợp CI/CD

### GitHub Actions / GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: erp
          POSTGRES_PASSWORD: erp_dev_2026
          POSTGRES_DB: erp_dev
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: npm run db:push

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Coverage Requirements / Yêu cầu bao phủ

Minimum coverage per module:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

```bash
# Check coverage
npm run test -- --coverage
```

## Best Practices / Thực tiễn tốt nhất

1. **Test behavior, not implementation** - Focus on what, not how
2. **Use descriptive test names** - `should create customer with valid email`
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Mock external dependencies** - Database, API calls, etc.
5. **Test edge cases** - Null, empty, invalid inputs
6. **Keep tests isolated** - No dependencies between tests
7. **Use fixtures** - DRY principle for test data
8. **Test async code properly** - Use async/await
9. **Clean up resources** - Use beforeEach/afterEach
10. **Run tests locally before commit** - Catch issues early

## Next Steps / Bước tiếp theo

- Read **[Module Development Guide](./module-development.md)** for more patterns
- Explore **[Deployment Guide](./deployment.md)** for production testing
- Review **[Contributing Guide](./contributing.md)** for PR requirements
