import { defineConfig, devices } from '@playwright/test';

/**
 * L-ERP MRP Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Test Execution Commands:
 * - Smoke Tests (P0):     npx playwright test --grep @p0
 * - Regression (P0+P1):   npx playwright test --grep "@p0|@p1"
 * - Full Suite:           npx playwright test
 * - Quality Module:       npx playwright test --grep @quality
 * - Workflows:            npx playwright test --grep @workflow
 * - With Bug Reporter:    npx playwright test --reporter=html,json,./e2e/reporters/bug-reporter.ts
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,  // Sequential to avoid rate limiting issues
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // 1 retry locally for flaky tests
  workers: process.env.CI ? 1 : 2,  // Limited workers to avoid overloading
  timeout: 60000,

  // Enhanced reporter configuration for QA/QC workflow
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'e2e/reports/html', open: 'never' }],
        ['json', { outputFile: 'e2e/reports/json/results.json' }],
        ['./e2e/reporters/bug-reporter.ts', { outputFolder: 'e2e/reports/bugs' }],
        ['github'],
      ]
    : [
        ['html', { outputFolder: 'e2e/reports/html' }],
        ['json', { outputFile: 'e2e/reports/json/results.json' }],
        ['./e2e/reporters/bug-reporter.ts', { outputFolder: 'e2e/reports/bugs' }],
        ['list'],
      ],

  // Global test metadata for filtering
  grep: process.env.TEST_GREP ? new RegExp(process.env.TEST_GREP) : undefined,
  grepInvert: process.env.TEST_GREP_INVERT ? new RegExp(process.env.TEST_GREP_INVERT) : undefined,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3015',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Add custom header to identify test requests (bypass rate limiting)
    extraHTTPHeaders: {
      'x-test-request': 'true',
    },
  },

  projects: [
    // Setup project: authenticates once and saves session for dependent projects
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Auth spec tests run with empty state (they test login flow itself)
    {
      name: 'auth-tests',
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
      testMatch: ['**/auth/*.spec.ts'],
    },
    // Desktop browsers - depend on setup for authenticated storageState
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: './e2e/.auth/admin.json' },
      testIgnore: ['**/mobile/**', '**/auth/**'],
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: './e2e/.auth/admin.json' },
      testIgnore: ['**/mobile/**', '**/auth/**'],
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: './e2e/.auth/admin.json' },
      testIgnore: ['**/mobile/**', '**/auth/**'],
      dependencies: ['setup'],
    },

    // Mobile devices - only run mobile tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], storageState: './e2e/.auth/admin.json' },
      testMatch: ['**/mobile/**'],
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'], storageState: './e2e/.auth/admin.json' },
      testMatch: ['**/mobile/**'],
      dependencies: ['setup'],
    },

    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro 11'], storageState: './e2e/.auth/admin.json' },
      testIgnore: ['**/mobile/**', '**/auth/**'],
      dependencies: ['setup'],
    },
  ],

  // Run local dev server before tests on dedicated port
  webServer: {
    command: 'npx next dev --port 3010',
    url: 'http://localhost:3015',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      SKIP_RATE_LIMIT: 'true',
      PLAYWRIGHT_TEST: 'true',
    },
  },
});
