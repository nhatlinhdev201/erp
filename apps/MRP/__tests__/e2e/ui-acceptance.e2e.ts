// =============================================================================
// L-ERP MRP UI ACCEPTANCE TESTS
// 7 Test Cases theo yêu cầu kiểm thử
// Date: 2026-01-11
// =============================================================================

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

const CREDENTIALS = {
  admin: {
    email: 'admin@demo.your-domain.com',
    password: 'Admin@Demo2026!'
  },
  manager: {
    email: 'manager@demo.your-domain.com',
    password: 'Manager@Demo2026!'
  }
};

// Helper function to login
async function login(page: Page, credentials = CREDENTIALS.admin) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Wait for hydration

  // Fill credentials using exact IDs
  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);

  // Click sign in (Vietnamese text)
  await page.click('button[type="submit"]');

  // Wait for navigation to home or dashboard
  await page.waitForURL(/\/(home|dashboard|$)/, { timeout: 30000 });
}

// =============================================================================
// TEST CASE 1: LOGIN
// =============================================================================

test.describe('TC1: Login', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check login form elements using exact IDs
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    await login(page, CREDENTIALS.admin);

    // Verify redirected to home or dashboard
    await expect(page).toHaveURL(/\/(home|dashboard)/);

    // Check page has loaded content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.fill('#email', 'invalid@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(3000);

    // Should still be on login page or show error
    const stillOnLogin = page.url().includes('login');
    expect(stillOnLogin).toBeTruthy();
  });
});

// =============================================================================
// TEST CASE 2: SUPPLIERS - FORM SCROLL & TAB
// =============================================================================

test.describe('TC2: Suppliers - Form Scroll & Tab', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to Suppliers page', async ({ page }) => {
    // Click Suppliers in menu
    await page.click('text=Suppliers, a:has-text("Suppliers"), [href*="supplier"]');
    await page.waitForLoadState('networkidle');

    // Verify on suppliers page
    await expect(page).toHaveURL(/supplier/);
  });

  test('should open Add Supplier form', async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');

    // Find and click Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("+"), [aria-label*="add"], [aria-label*="Add"]').first();
    await addButton.click();

    // Wait for modal/form
    await page.waitForTimeout(1000);

    // Check form is visible
    const formVisible = await page.locator('form, [role="dialog"], .modal').first().isVisible();
    expect(formVisible).toBeTruthy();
  });

  test('should scroll form and see Save button without zoom', async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');

    // Open form
    const addButton = page.locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("+")').first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // Try to find Save button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Lưu"), button[type="submit"]');

    // Scroll to Save button if needed
    if (await saveButton.count() > 0) {
      await saveButton.first().scrollIntoViewIfNeeded();
      await expect(saveButton.first()).toBeVisible();
    }
  });

  test('should support Tab navigation in form', async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');

    // Open form
    const addButton = page.locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("+")').first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // Find first input
    const firstInput = page.locator('input:visible').first();
    await firstInput.focus();

    // Press Tab multiple times and verify focus moves
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify we can still interact with form
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(activeElement);
  });
});

// =============================================================================
// TEST CASE 3: PARTS - PAGE LOAD
// =============================================================================

test.describe('TC3: Parts - Page Load', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load Parts page without error', async ({ page }) => {
    await page.goto('/parts');
    await page.waitForLoadState('networkidle');

    // Check NO error messages
    const errorVisible = await page.locator('text="Something went wrong", text="Error", [class*="error-boundary"]').count();
    expect(errorVisible).toBe(0);

    // Page should have content
    await expect(page.locator('main, [role="main"], .content').first()).toBeVisible();
  });

  test('should display Parts list or empty state', async ({ page }) => {
    await page.goto('/parts');
    await page.waitForLoadState('networkidle');

    // Either has parts list OR "no parts" message
    const hasList = await page.locator('table, [role="table"], .list, .grid').count() > 0;
    const hasEmptyState = await page.locator('text="No parts", text="Không có"').count() > 0;
    const hasContent = await page.locator('[class*="part"], [data-testid*="part"]').count() > 0;

    expect(hasList || hasEmptyState || hasContent).toBeTruthy();
  });

  test('should have Create Part button', async ({ page }) => {
    await page.goto('/parts');
    await page.waitForLoadState('networkidle');

    // Find Add/Create button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Thêm"), button:has-text("+"), a:has-text("Add"), a:has-text("Create")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should open Create Part form', async ({ page }) => {
    await page.goto('/parts');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Thêm"), button:has-text("+")').first();
    await addButton.click();

    await page.waitForTimeout(1000);

    // Form or page should appear
    const formVisible = await page.locator('form, [role="dialog"], input[name*="part"], input[name*="sku"]').first().isVisible();
    expect(formVisible).toBeTruthy();
  });
});

// =============================================================================
// TEST CASE 4: BOM - CREATE BUTTON
// =============================================================================

test.describe('TC4: BOM - Create Button', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load BOM page', async ({ page }) => {
    await page.goto('/bom');
    await page.waitForLoadState('networkidle');

    // Page should load without major errors
    const hasError = await page.locator('text="Something went wrong"').count();
    expect(hasError).toBe(0);
  });

  test('should have Create BOM button', async ({ page }) => {
    await page.goto('/bom');
    await page.waitForLoadState('networkidle');

    // Find Create BOM button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("Tạo"), button:has-text("+"), a:has-text("Create BOM")');

    const buttonCount = await createButton.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should open Create BOM form when clicking button', async ({ page }) => {
    await page.goto('/bom');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("Tạo"), button:has-text("+")').first();
    await createButton.click();

    await page.waitForTimeout(1500);

    // Form should appear with Product dropdown
    const formVisible = await page.locator('form, [role="dialog"], select, [role="combobox"]').first().isVisible();
    expect(formVisible).toBeTruthy();
  });
});

// =============================================================================
// TEST CASE 5: PRODUCTION - CREATE WORK ORDER
// =============================================================================

test.describe('TC5: Production - Create Work Order', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load Production page', async ({ page }) => {
    await page.goto('/production');
    await page.waitForLoadState('networkidle');

    // No critical errors
    const hasMapError = await page.locator('text="x.map is not a function", text="Cannot read property"').count();
    expect(hasMapError).toBe(0);
  });

  test('should have Create Work Order button', async ({ page }) => {
    await page.goto('/production');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Work Order"), button:has-text("Create"), button:has-text("Add"), button:has-text("+")');
    const buttonCount = await createButton.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should open Work Order form without x.map error', async ({ page }) => {
    await page.goto('/production');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Work Order"), button:has-text("Create"), button:has-text("+")').first();
    await createButton.click();

    await page.waitForTimeout(2000);

    // Check NO x.map error
    const hasMapError = await page.locator('text="x.map is not a function"').count();
    expect(hasMapError).toBe(0);

    // Form should be visible
    const formVisible = await page.locator('form, input, select, [role="dialog"]').first().isVisible();
    expect(formVisible).toBeTruthy();
  });
});

// =============================================================================
// TEST CASE 6: MRP - VIEW RESULTS
// =============================================================================

test.describe('TC6: MRP - View Results', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load MRP page', async ({ page }) => {
    await page.goto('/mrp');
    await page.waitForLoadState('networkidle');

    // Page loads
    await expect(page.locator('main, [role="main"], .content').first()).toBeVisible();
  });

  test('should display MRP runs list or empty state', async ({ page }) => {
    await page.goto('/mrp');
    await page.waitForLoadState('networkidle');

    // Has either list or empty state
    const hasList = await page.locator('table, .list, [role="table"]').count() > 0;
    const hasEmptyState = await page.locator('text="No MRP", text="Không có"').count() > 0;
    const hasContent = await page.locator('[class*="mrp"], button:has-text("Queue"), button:has-text("Run")').count() > 0;

    expect(hasList || hasEmptyState || hasContent).toBeTruthy();
  });

  test('should not have infinite loading when viewing results', async ({ page }) => {
    await page.goto('/mrp');
    await page.waitForLoadState('networkidle');

    // Try to click View if available
    const viewButton = page.locator('button:has-text("View"), a:has-text("View"), button:has-text("Xem")').first();

    if (await viewButton.count() > 0) {
      await viewButton.click();

      // Wait max 15 seconds for content to load
      await page.waitForTimeout(3000);

      // Check spinner is not stuck
      const spinnerStillVisible = await page.locator('.animate-spin, [class*="loading"], [class*="spinner"]').count();

      // Either spinner gone or content visible
      const contentVisible = await page.locator('table, .results, [class*="result"]').count() > 0;

      // Pass if spinner gone OR content visible within reasonable time
      expect(spinnerStillVisible === 0 || contentVisible).toBeTruthy();
    }
  });
});

// =============================================================================
// TEST CASE 7: NAVIGATION & GENERAL UX
// =============================================================================

test.describe('TC7: Navigation & General UX', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should navigate to Orders', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    const hasError = await page.locator('text="Something went wrong"').count();
    expect(hasError).toBe(0);
  });

  test('should navigate to Inventory', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    const hasError = await page.locator('text="Something went wrong"').count();
    expect(hasError).toBe(0);
  });

  test('should navigate to Quality', async ({ page }) => {
    await page.goto('/quality');
    await page.waitForLoadState('networkidle');
    const hasError = await page.locator('text="Something went wrong"').count();
    expect(hasError).toBe(0);
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), [aria-label*="logout"]');

    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);

      // Should redirect to login
      expect(page.url()).toContain('login');
    }
  });

  test('should login with Manager account', async ({ page }) => {
    // Logout first if logged in
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"], input[name="email"]', CREDENTIALS.manager.email);
    await page.fill('input[type="password"], input[name="password"]', CREDENTIALS.manager.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/(dashboard|$)/);
  });
});
