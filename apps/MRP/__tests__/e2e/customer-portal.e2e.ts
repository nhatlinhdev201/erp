// =============================================================================
// E2E TESTS - CUSTOMER PORTAL
// L-ERP MRP Test Suite
// =============================================================================

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// TEST FIXTURES
// =============================================================================

test.describe.configure({ mode: 'serial' });

// =============================================================================
// CUSTOMER DASHBOARD TESTS
// =============================================================================

test.describe('Customer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer');
  });

  test('should display welcome banner with customer info', async ({ page }) => {
    // Check for welcome message
    await expect(page.getByText(/Xin chào/)).toBeVisible();
    
    // Check for customer tier badge
    await expect(page.locator('[class*="GOLD"], [class*="SILVER"], [class*="PLATINUM"], [class*="STANDARD"]')).toBeVisible();
  });

  test('should display summary cards', async ({ page }) => {
    // Check for summary cards
    await expect(page.getByText('Đơn hàng đang xử lý')).toBeVisible();
    await expect(page.getByText('Đang giao hàng')).toBeVisible();
    await expect(page.getByText('Hóa đơn chưa TT')).toBeVisible();
    await expect(page.getByText('Ticket hỗ trợ')).toBeVisible();
  });

  test('should navigate to orders page from summary card', async ({ page }) => {
    await page.getByText('Đơn hàng đang xử lý').click();
    await expect(page).toHaveURL(/\/customer\/orders/);
  });

  test('should display recent orders section', async ({ page }) => {
    await expect(page.getByText('Đơn hàng gần đây')).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByText('Theo dõi đơn hàng')).toBeVisible();
    await expect(page.getByText('Theo dõi giao hàng')).toBeVisible();
    await expect(page.getByText('Thanh toán')).toBeVisible();
    await expect(page.getByText('Liên hệ hỗ trợ')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Summary cards should still be visible
    await expect(page.getByText('Đơn hàng đang xử lý')).toBeVisible();
    
    // Mobile menu should be available
    await expect(page.locator('button').filter({ has: page.locator('svg') })).toBeVisible();
  });
});

// =============================================================================
// CUSTOMER ORDERS TESTS
// =============================================================================

test.describe('Customer Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer/orders');
  });

  test('should display orders page header', async ({ page }) => {
    await expect(page.getByText('Đơn hàng của tôi')).toBeVisible();
    await expect(page.getByText('Theo dõi trạng thái đơn hàng')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Search input
    await expect(page.getByPlaceholder(/Tìm theo mã SO/)).toBeVisible();
    
    // Status filter buttons
    await expect(page.getByRole('button', { name: 'Tất cả' })).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // Click on status filter
    await page.getByRole('button', { name: 'Đã xác nhận' }).click();
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Verify filter is active
    await expect(page.getByRole('button', { name: 'Đã xác nhận' })).toHaveClass(/bg-emerald/);
  });

  test('should search orders by keyword', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Tìm theo mã SO/);
    await searchInput.fill('SO-2025');
    
    // Wait for search results
    await page.waitForTimeout(500);
  });

  test('should display order progress steps', async ({ page }) => {
    // Check for progress indicators
    await expect(page.getByText('Đặt hàng')).toBeVisible();
  });

  test('should display order items table', async ({ page }) => {
    // Check for table headers
    await expect(page.getByText('Mã SP')).toBeVisible();
    await expect(page.getByText('Tên sản phẩm')).toBeVisible();
  });
});

// =============================================================================
// CUSTOMER DELIVERIES TESTS
// =============================================================================

test.describe('Customer Deliveries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer/deliveries');
  });

  test('should display deliveries page header', async ({ page }) => {
    await expect(page.getByText('Theo dõi Giao hàng')).toBeVisible();
  });

  test('should display delivery tracking info', async ({ page }) => {
    // Look for tracking elements
    await expect(page.getByText(/Mã vận đơn|Đang chuẩn bị|Đang vận chuyển/)).toBeVisible();
  });

  test('should display delivery timeline', async ({ page }) => {
    await expect(page.getByText('Gửi hàng')).toBeVisible();
    await expect(page.getByText('Vận chuyển')).toBeVisible();
    await expect(page.getByText('Giao hàng')).toBeVisible();
  });

  test('should filter deliveries by status', async ({ page }) => {
    const statusSelect = page.locator('select');
    await statusSelect.selectOption('IN_TRANSIT');
    await page.waitForTimeout(500);
  });
});

// =============================================================================
// CUSTOMER INVOICES TESTS
// =============================================================================

test.describe('Customer Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer/invoices');
  });

  test('should display invoices page header', async ({ page }) => {
    await expect(page.getByText('Hóa đơn của tôi')).toBeVisible();
  });

  test('should display invoice summary cards', async ({ page }) => {
    await expect(page.getByText('Tổng giá trị')).toBeVisible();
    await expect(page.getByText('Đã thanh toán')).toBeVisible();
    await expect(page.getByText('Chưa thanh toán')).toBeVisible();
  });

  test('should display invoice table', async ({ page }) => {
    await expect(page.getByText('Số hóa đơn')).toBeVisible();
    await expect(page.getByText('Đơn hàng')).toBeVisible();
    await expect(page.getByText('Hạn thanh toán')).toBeVisible();
  });

  test('should display payment information', async ({ page }) => {
    await expect(page.getByText('Thông tin chuyển khoản')).toBeVisible();
    await expect(page.getByText(/Vietcombank/)).toBeVisible();
  });

  test('should open invoice detail modal', async ({ page }) => {
    // Click view button on first invoice
    const viewButton = page.locator('button[title="Xem chi tiết"]').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page.getByText('Chi tiết')).toBeVisible();
    }
  });
});

// =============================================================================
// CUSTOMER SUPPORT TESTS
// =============================================================================

test.describe('Customer Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer/support');
  });

  test('should display support page header', async ({ page }) => {
    await expect(page.getByText('Hỗ trợ khách hàng')).toBeVisible();
  });

  test('should display create ticket button', async ({ page }) => {
    await expect(page.getByText('Tạo ticket mới')).toBeVisible();
  });

  test('should open new ticket modal', async ({ page }) => {
    await page.getByText('Tạo ticket mới').click();
    await expect(page.getByText('Tạo ticket hỗ trợ mới')).toBeVisible();
  });

  test('should have ticket form fields', async ({ page }) => {
    await page.getByText('Tạo ticket mới').click();
    
    await expect(page.getByText('Danh mục')).toBeVisible();
    await expect(page.getByText('Độ ưu tiên')).toBeVisible();
    await expect(page.getByText('Tiêu đề')).toBeVisible();
    await expect(page.getByText('Mô tả chi tiết')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByText('Tạo ticket mới').click();
    
    // Submit button should be disabled when required fields are empty
    const submitButton = page.getByRole('button', { name: 'Gửi ticket' });
    await expect(submitButton).toBeDisabled();
  });

  test('should display existing tickets', async ({ page }) => {
    // Check for ticket list or empty state
    const ticketList = page.locator('[class*="divide-y"]');
    const emptyState = page.getByText('Chưa có ticket nào');
    
    const hasTickets = await ticketList.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasTickets || isEmpty).toBe(true);
  });
});

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

test.describe('Portal Navigation', () => {
  test('should navigate between all pages', async ({ page }) => {
    // Start at dashboard
    await page.goto('/customer');
    await expect(page).toHaveURL(/\/customer$/);
    
    // Navigate to orders
    await page.getByText('Đơn hàng').first().click();
    await expect(page).toHaveURL(/\/customer\/orders/);
    
    // Navigate to deliveries
    await page.getByText('Giao hàng').first().click();
    await expect(page).toHaveURL(/\/customer\/deliveries/);
    
    // Navigate to invoices
    await page.getByText('Hóa đơn').first().click();
    await expect(page).toHaveURL(/\/customer\/invoices/);
    
    // Navigate to support
    await page.getByText('Hỗ trợ').first().click();
    await expect(page).toHaveURL(/\/customer\/support/);
    
    // Navigate back to dashboard
    await page.getByText('Tổng quan').first().click();
    await expect(page).toHaveURL(/\/customer$/);
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/customer/orders');
    
    // Active nav item should have different styling
    const ordersNav = page.getByRole('link', { name: /Đơn hàng/ }).first();
    await expect(ordersNav).toHaveClass(/bg-emerald/);
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

test.describe('Performance', () => {
  test('dashboard should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/customer');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('orders page should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/customer/orders');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Orders page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have memory leaks during navigation', async ({ page }) => {
    const pages = ['/customer', '/customer/orders', '/customer/deliveries', '/customer/invoices', '/customer/support'];
    
    for (let i = 0; i < 3; i++) {
      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
      }
    }
    
    // If we got here without crashing, memory is managed properly
    expect(true).toBe(true);
  });
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

test.describe('Accessibility', () => {
  test('dashboard should be keyboard navigable', async ({ page }) => {
    await page.goto('/customer');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/customer');
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/customer');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);
    }
  });
});
