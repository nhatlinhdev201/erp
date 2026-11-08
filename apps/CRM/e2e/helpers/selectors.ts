/**
 * Common selectors for L-ERP CRM E2E tests.
 * Uses flexible selectors (multiple options) since app may lack data-testid.
 */
export const SELECTORS = {
  // Header
  header: 'header',
  searchButton: 'header button:has(.lucide-search)',
  userMenuTrigger: 'header button:has(span.truncate)',
  logoutButton: 'text=Đăng xuất',

  // Navigation (sidebar)
  sidebar: 'aside',
  sidebarLink: (text: string) => `aside a:has-text("${text}")`,

  // Common UI
  submitButton: 'button[type="submit"]',
  loadingSpinner: '.animate-spin',
  toast: '[data-sonner-toast], [role="status"]',
  dialog: '[role="dialog"]',
  commandPalette: '[cmdk-dialog], [role="dialog"]:has([cmdk-input])',

  // Tables & lists
  tableRow: 'tbody tr',
  searchInput: 'input[placeholder*="Tìm"], input[placeholder*="tìm"], input[type="search"]',

  // Forms
  fieldError: '.text-red-500, .text-destructive',

  // Dashboard
  kpiCard: '.kpi-card',
  chartContainer: '.chart-container',

  // Cards
  glassCard: '.glass-card-static',
} as const
