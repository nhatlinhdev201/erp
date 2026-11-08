// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * LAC VIET HR - Playwright E2E Test Configuration
 * Enterprise-grade testing for Vietnamese HR Management System
 */

// Load environment variables
const BASE_URL = process.env.BASE_URL || 'http://localhost:3011';
const CI = !!process.env.CI;

export default defineConfig({
  // Test directory
  testDir: './tests/e2e/specs',

  // Run tests in parallel
  fullyParallel: true,

  // Fail CI if test.only is left in code
  forbidOnly: CI,

  // Retry failed tests
  retries: CI ? 2 : 0,

  // Parallel workers
  workers: CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['list'],
  ],

  // Global timeout
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  // Shared settings for all projects
  use: {
    baseURL: BASE_URL,

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Locale for Vietnamese
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',

    // Geolocation (Ho Chi Minh City)
    geolocation: { longitude: 106.6297, latitude: 10.8231 },
    permissions: ['geolocation'],
  },

  // Test projects
  projects: [
    // ════════════════════════════════════════════════════════════════
    // SETUP & TEARDOWN
    // ════════════════════════════════════════════════════════════════
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /global-teardown\.ts/,
    },

    // ════════════════════════════════════════════════════════════════
    // DESKTOP BROWSERS
    // ════════════════════════════════════════════════════════════════
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },

    // ════════════════════════════════════════════════════════════════
    // MOBILE BROWSERS
    // ════════════════════════════════════════════════════════════════
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },

    // ════════════════════════════════════════════════════════════════
    // TABLET
    // ════════════════════════════════════════════════════════════════
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
      dependencies: ['setup'],
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output folder for test artifacts
  outputDir: 'test-results/e2e-artifacts',

  // Global setup/teardown
  globalSetup: path.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: path.resolve('./tests/e2e/global-teardown.ts'),
});
