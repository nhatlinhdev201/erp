// =============================================================================
// L-ERP MRP - TESTING UTILITIES
// Test helpers, mocks, and sample test files
// =============================================================================

import React, { ReactElement } from 'react';

// Declare jest globals for type safety (only available in test environment)
declare const jest: {
  fn: <T extends (...args: any[]) => any>(implementation?: T) => MockFunction<T>;
  clearAllMocks: () => void;
};

type MockFunction<T extends (...args: any[]) => any> = T & {
  mockResolvedValueOnce: (value: ReturnType<T>) => MockFunction<T>;
  mockImplementation: (fn: T) => MockFunction<T>;
};

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Create a mock function with type safety
 */
export function createMock<T extends (...args: any[]) => any>(
  implementation?: T
): MockFunction<T> {
  if (typeof jest !== 'undefined') {
    return jest.fn(implementation) as MockFunction<T>;
  }
  // Fallback for non-test environments
  return (implementation || (() => {})) as MockFunction<T>;
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create test data with defaults
 */
export function createTestData<T>(defaults: T, overrides?: Partial<T>): T {
  return { ...defaults, ...overrides };
}

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

export const mockGenerators = {
  // Generate mock user
  user: (overrides?: Partial<any>) => ({
    id: `user-${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    role: 'operator',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Generate mock order
  order: (overrides?: Partial<any>) => ({
    id: `order-${Date.now()}`,
    orderNumber: `SO-2025-${Math.floor(Math.random() * 1000)}`,
    customerId: 'cust-1',
    status: 'PENDING',
    totalAmount: Math.floor(Math.random() * 10000000),
    items: [],
    createdAt: new Date(),
    ...overrides,
  }),

  // Generate mock part
  part: (overrides?: Partial<any>) => ({
    id: `part-${Date.now()}`,
    partNumber: `CMP-${Math.floor(Math.random() * 10000)}`,
    name: 'Test Part',
    category: 'COMPONENT',
    unit: 'PCS',
    unitCost: Math.floor(Math.random() * 100000),
    leadTime: 7,
    isActive: true,
    ...overrides,
  }),

  // Generate mock inventory
  inventory: (overrides?: Partial<any>) => ({
    id: `inv-${Date.now()}`,
    partId: 'part-1',
    onHand: Math.floor(Math.random() * 1000),
    onOrder: 0,
    allocated: 0,
    safetyStock: 50,
    reorderPoint: 100,
    warehouseLocation: 'WH-01-A1',
    ...overrides,
  }),

  // Generate mock notification
  notification: (overrides?: Partial<any>) => ({
    id: `notif-${Date.now()}`,
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification',
    timestamp: new Date().toISOString(),
    read: false,
    ...overrides,
  }),
};

// =============================================================================
// MOCK SERVICES
// =============================================================================

export const mockServices = {
  // Mock API responses
  api: {
    get: createMock(() => Promise.resolve({ data: {} })),
    post: createMock(() => Promise.resolve({ data: {} })),
    put: createMock(() => Promise.resolve({ data: {} })),
    delete: createMock(() => Promise.resolve({ data: {} })),
  },

  // Mock auth
  auth: {
    login: createMock(() => Promise.resolve({ success: true })),
    logout: createMock(() => Promise.resolve()),
    getUser: createMock(() => mockGenerators.user()),
  },

  // Mock notifications
  notifications: {
    show: createMock(),
    hide: createMock(),
    clear: createMock(),
  },
};

// =============================================================================
// RENDER HELPERS
// =============================================================================

interface RenderOptions {
  initialEntries?: string[];
  user?: any;
  theme?: 'light' | 'dark';
}

/**
 * Custom render function with providers
 * Note: This is a template - actual implementation needs testing library
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions = {}
) {
  const {
    initialEntries = ['/'],
    user = null,
    theme = 'light',
  } = options;

  // Wrapper component with all providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <>
        {/* Add providers here: AuthProvider, ThemeProvider, etc */}
        {children}
      </>
    );
  }

  // Would use @testing-library/react render here
  return {
    // ...render(ui, { wrapper: Wrapper }),
    user,
    theme,
  };
}

// =============================================================================
// CUSTOM MATCHERS
// =============================================================================

export const customMatchers = {
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
    };
  },

  toBeValidPhone(received: string) {
    const phoneRegex = /^[0-9]{10,11}$/;
    const pass = phoneRegex.test(received.replace(/\D/g, ''));
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid phone number`,
    };
  },

  toBeInRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be between ${min} and ${max}`,
    };
  },
};

// =============================================================================
// SAMPLE TEST CASES
// =============================================================================

/*
// Example test file: __tests__/auth.test.ts

import { renderWithProviders, mockGenerators, mockServices } from '@/lib/testing';

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      mockServices.auth.login.mockResolvedValueOnce({ success: true });

      const result = await mockServices.auth.login(credentials);

      expect(result.success).toBe(true);
      expect(mockServices.auth.login).toHaveBeenCalledWith(credentials);
    });

    it('should fail with invalid credentials', async () => {
      mockServices.auth.login.mockResolvedValueOnce({ 
        success: false, 
        error: 'Invalid credentials' 
      });

      const result = await mockServices.auth.login({ 
        email: 'wrong@example.com', 
        password: 'wrong' 
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });
});

// Example test file: __tests__/components/Button.test.tsx

describe('Button Component', () => {
  it('renders with correct text', () => {
    // render(<Button>Click me</Button>);
    // expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    // render(<Button onClick={handleClick}>Click me</Button>);
    // fireEvent.click(screen.getByText('Click me'));
    // expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    // render(<Button disabled>Disabled</Button>);
    // expect(screen.getByText('Disabled')).toBeDisabled();
  });
});

// Example test file: __tests__/hooks/useAuth.test.ts

describe('useAuth Hook', () => {
  it('returns user when authenticated', () => {
    const user = mockGenerators.user();
    // Mock the auth context
    // const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    // expect(result.current.user).toEqual(user);
  });

  it('returns null when not authenticated', () => {
    // const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    // expect(result.current.user).toBeNull();
  });
});
*/

// =============================================================================
// E2E TEST TEMPLATES
// =============================================================================

/*
// Example Playwright test: e2e/login.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'admin@rtr.vn');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/home');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email hoặc mật khẩu không đúng')).toBeVisible();
  });
});

// Example: e2e/orders.spec.ts

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@rtr.vn');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test('should create new order', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Fill order form
    await page.selectOption('select[name="customer"]', 'cust-1');
    await page.click('button:has-text("Thêm sản phẩm")');
    await page.selectOption('select[name="product"]', 'prod-1');
    await page.fill('input[name="quantity"]', '10');
    
    await page.click('button:has-text("Lưu đơn hàng")');
    
    await expect(page.locator('text=Đơn hàng đã được tạo')).toBeVisible();
  });
});
*/

// =============================================================================
// JEST CONFIG
// =============================================================================

export const jestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

// =============================================================================
// PLAYWRIGHT CONFIG
// =============================================================================

export const playwrightConfig = {
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
};

export default {
  createMock,
  waitFor,
  createTestData,
  mockGenerators,
  mockServices,
  renderWithProviders,
  customMatchers,
  jestConfig,
  playwrightConfig,
};
