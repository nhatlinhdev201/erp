// tests/fixtures/test-fixtures.ts

/**
 * LAC VIET HR - Playwright Test Fixtures
 * Custom fixtures for E2E testing
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'hr_manager' | 'employee' | 'manager';
  name: string;
}

export interface TestEmployee {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  positionId: string;
}

export interface TestLeaveRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// TEST USERS
// ════════════════════════════════════════════════════════════════════════════════

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@lerp-hrm.com',
    password: 'AdminP@ss123!',
    role: 'admin',
    name: 'System Admin',
  },
  hrManager: {
    email: 'hr.manager@lerp-hrm.com',
    password: 'HRM@nagerP@ss123!',
    role: 'hr_manager',
    name: 'Nguyễn Văn HR',
  },
  employee: {
    email: 'employee@lerp-hrm.com',
    password: 'Empl0yeeP@ss123!',
    role: 'employee',
    name: 'Trần Văn A',
  },
  manager: {
    email: 'manager@lerp-hrm.com',
    password: 'M@nagerP@ss123!',
    role: 'manager',
    name: 'Lê Thị Manager',
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// PAGE OBJECT BASE CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getToastMessage(): Promise<string> {
    const toast = this.page.locator('[data-testid="toast"], .toast, [role="alert"]').first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    return toast.textContent() || '';
  }

  async expectToastSuccess(message?: string) {
    const toast = this.page.locator('.toast-success, [data-type="success"]').first();
    await expect(toast).toBeVisible();
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  async expectToastError(message?: string) {
    const toast = this.page.locator('.toast-error, [data-type="error"]').first();
    await expect(toast).toBeVisible();
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════════════════════════════

export class LoginPage extends BasePage {
  readonly emailInput = this.page.locator('input[name="email"], input[type="email"]');
  readonly passwordInput = this.page.locator('input[name="password"], input[type="password"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly errorMessage = this.page.locator('[data-testid="error-message"], .error-message');
  readonly rememberMeCheckbox = this.page.locator('input[name="rememberMe"]');

  async goto() {
    await super.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAs(userType: keyof typeof TEST_USERS) {
    const user = TEST_USERS[userType];
    await this.login(user.email, user.password);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/(dashboard|home)/);
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible();
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ════════════════════════════════════════════════════════════════════════════════

export class DashboardPage extends BasePage {
  readonly welcomeMessage = this.page.locator('[data-testid="welcome-message"]');
  readonly statsCards = this.page.locator('[data-testid="stats-card"]');
  readonly recentActivities = this.page.locator('[data-testid="recent-activities"]');
  readonly quickActions = this.page.locator('[data-testid="quick-actions"]');
  readonly notifications = this.page.locator('[data-testid="notifications"]');
  readonly pendingApprovals = this.page.locator('[data-testid="pending-approvals"]');

  async goto() {
    await super.goto('/dashboard');
  }

  async getEmployeeCount(): Promise<number> {
    const card = this.page.locator('[data-testid="employee-count"]');
    const text = await card.textContent();
    return parseInt(text?.replace(/\D/g, '') || '0');
  }

  async getPendingLeaveCount(): Promise<number> {
    const card = this.page.locator('[data-testid="pending-leave-count"]');
    const text = await card.textContent();
    return parseInt(text?.replace(/\D/g, '') || '0');
  }

  async clickQuickAction(action: string) {
    await this.quickActions.getByText(action).click();
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// EMPLOYEE LIST PAGE
// ════════════════════════════════════════════════════════════════════════════════

export class EmployeeListPage extends BasePage {
  readonly searchInput = this.page.locator('input[placeholder*="Tìm kiếm"], input[name="search"]');
  readonly filterButton = this.page.locator('[data-testid="filter-button"]');
  readonly addEmployeeButton = this.page.locator('[data-testid="add-employee"], button:has-text("Thêm nhân viên")');
  readonly employeeTable = this.page.locator('table, [data-testid="employee-table"]');
  readonly employeeRows = this.page.locator('tbody tr, [data-testid="employee-row"]');
  readonly pagination = this.page.locator('[data-testid="pagination"]');
  readonly exportButton = this.page.locator('[data-testid="export-button"]');

  async goto() {
    await super.goto('/employees');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  async getEmployeeCount(): Promise<number> {
    return this.employeeRows.count();
  }

  async clickEmployee(index: number = 0) {
    await this.employeeRows.nth(index).click();
  }

  async filterByDepartment(department: string) {
    await this.filterButton.click();
    await this.page.selectOption('[data-testid="department-filter"]', { label: department });
    await this.page.click('[data-testid="apply-filter"]');
  }

  async filterByStatus(status: string) {
    await this.filterButton.click();
    await this.page.click(`[data-testid="status-${status}"]`);
    await this.page.click('[data-testid="apply-filter"]');
  }

  async goToPage(page: number) {
    await this.pagination.getByText(page.toString()).click();
    await this.waitForLoad();
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// EMPLOYEE FORM PAGE
// ════════════════════════════════════════════════════════════════════════════════

export class EmployeeFormPage extends BasePage {
  readonly firstNameInput = this.page.locator('input[name="firstName"]');
  readonly lastNameInput = this.page.locator('input[name="lastName"]');
  readonly emailInput = this.page.locator('input[name="email"]');
  readonly phoneInput = this.page.locator('input[name="phone"]');
  readonly departmentSelect = this.page.locator('select[name="departmentId"], [data-testid="department-select"]');
  readonly positionSelect = this.page.locator('select[name="positionId"], [data-testid="position-select"]');
  readonly hireDateInput = this.page.locator('input[name="hireDate"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly cancelButton = this.page.locator('button:has-text("Hủy"), [data-testid="cancel-button"]');

  async goto(employeeId?: string) {
    if (employeeId) {
      await super.goto(`/employees/${employeeId}/edit`);
    } else {
      await super.goto('/employees/new');
    }
  }

  async fillForm(employee: Partial<TestEmployee>) {
    if (employee.firstName) await this.firstNameInput.fill(employee.firstName);
    if (employee.lastName) await this.lastNameInput.fill(employee.lastName);
    if (employee.email) await this.emailInput.fill(employee.email);
    if (employee.departmentId) await this.departmentSelect.selectOption(employee.departmentId);
    if (employee.positionId) await this.positionSelect.selectOption(employee.positionId);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectValidationError(field: string) {
    const error = this.page.locator(`[data-testid="error-${field}"], .error-${field}`);
    await expect(error).toBeVisible();
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// LEAVE REQUEST PAGE
// ════════════════════════════════════════════════════════════════════════════════

export class LeaveRequestPage extends BasePage {
  readonly leaveTypeSelect = this.page.locator('select[name="leaveType"]');
  readonly startDateInput = this.page.locator('input[name="startDate"]');
  readonly endDateInput = this.page.locator('input[name="endDate"]');
  readonly reasonInput = this.page.locator('textarea[name="reason"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly leaveBalance = this.page.locator('[data-testid="leave-balance"]');
  readonly requestList = this.page.locator('[data-testid="leave-request-list"]');

  async goto() {
    await super.goto('/leave');
  }

  async createRequest(request: Omit<TestLeaveRequest, 'employeeId'>) {
    await this.page.click('[data-testid="new-request-button"]');
    await this.leaveTypeSelect.selectOption(request.leaveType);
    await this.startDateInput.fill(request.startDate);
    await this.endDateInput.fill(request.endDate);
    await this.reasonInput.fill(request.reason);
    await this.submitButton.click();
  }

  async getLeaveBalance(type: string): Promise<number> {
    const balance = this.page.locator(`[data-testid="balance-${type}"]`);
    const text = await balance.textContent();
    return parseFloat(text?.replace(/\D/g, '') || '0');
  }

  async cancelRequest(requestId: string) {
    await this.page.click(`[data-testid="cancel-${requestId}"]`);
    await this.page.click('[data-testid="confirm-cancel"]');
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// CUSTOM FIXTURES
// ════════════════════════════════════════════════════════════════════════════════

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
  employeeFormPage: EmployeeFormPage;
  leaveRequestPage: LeaveRequestPage;
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  
  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },
  
  employeeFormPage: async ({ page }, use) => {
    await use(new EmployeeFormPage(page));
  },
  
  leaveRequestPage: async ({ page }, use) => {
    await use(new LeaveRequestPage(page));
  },
  
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
export default test;
