# HANDOVER - L-ERP OTB Platform (Full-Stack)

> **Khi quay lai, yeu cau Claude doc file nay de tiep tuc:**
> ```
> doc handover tiep tuc
> ```

---

## Cap nhat lan cuoi: 23/02/2026 (Session 29 - S25 CreatableSelect + Add SKU Modal + SKU UI)

---

## TONG QUAN DU AN

**L-ERP OTB Platform** - He thong quan ly Open-to-Buy cho nganh thoi trang cao cap

| Thong tin | Chi tiet |
|-----------|----------|
| **Frontend** | Next.js 16.1.6, App Router, React 19, **TypeScript 5.9** |
| **Styling** | Tailwind CSS v3, custom CSS variables |
| **Backend** | NestJS (rieng biet, port 4000) |
| **API Base** | `http://localhost:4000/api/v1` |
| **Dev Port** | `http://localhost:3006` |
| **Language** | Bilingual EN/VN with toggle |
| **Theme** | Dark/Light mode with CSS variables |
| **Testing** | Vitest 4.0, jsdom, @testing-library/react (201 tests, 9 suites) + Playwright E2E (4 specs) |
| **Mobile** | Responsive (useIsMobile hook + MobileBottomNav + Mobile UI 2.0 components) |
| **Animation** | framer-motion 12.34 (BottomSheet, SwipeAction) |

### Repositories

| Remote | URL | Note |
|--------|-----|------|
| **origin** | https://github.com/TCDevop/OTB.git | TCDevop (co lich su cu monorepo) |
| **lerp-otb** | https://github.com/linkk/lerp-otb.git | linkk - CLEAN (chi 95 files, 1 commit) |
| **lerp** | https://github.com/linkk/lerp.git | linkk mirror |
| **linkk** | https://github.com/linkk/L-ERP-OTB-TCDATA.git | Legacy, khong dung nua |

> **Luu y:** `lerp-otb` la repo sach nhat — chi chua code Next.js, khong co file cu tu monorepo (`apps/`, `packages/`, `docs/`...).

### Demo Accounts

```
admin@your-domain.com    / lerp@2026  (System Admin - full permissions)
buyer@your-domain.com    / lerp@2026  (Buyer)
merch@your-domain.com    / lerp@2026  (Merchandiser)
manager@your-domain.com  / lerp@2026  (Merch Manager - L1 Approver)
finance@your-domain.com  / lerp@2026  (Finance Director - L2 Approver)
```

---

## KIEN TRUC FRONTEND

```
OTBnonAI/
├── src/
│   ├── app/                              # Next.js App Router (all .tsx)
│   │   ├── layout.tsx                    # Root layout
│   │   ├── providers.tsx                 # AuthProvider > LanguageProvider > AppProvider
│   │   ├── globals.css                   # Theme CSS variables + component classes
│   │   ├── login/page.tsx                # Login route
│   │   └── (dashboard)/                  # Protected routes (AuthGuard)
│   │       ├── layout.tsx                # Sidebar + AppHeader + MobileBottomNav
│   │       ├── page.tsx                  # / → HomeScreen
│   │       ├── budget-management/        # /budget-management
│   │       ├── planning/                 # /planning → BudgetAllocateScreen
│   │       ├── otb-analysis/             # /otb-analysis
│   │       ├── proposal/                 # /proposal → SKUProposalScreen
│   │       ├── tickets/                  # /tickets
│   │       ├── approval-config/          # /approval-config
│   │       ├── approvals/                # /approvals
│   │       ├── order-confirmation/       # /order-confirmation
│   │       ├── receipt-confirmation/     # /receipt-confirmation
│   │       ├── import-data/              # /import-data (NEW Session 14)
│   │       ├── master-data/              # /master-data
│   │       ├── profile/                  # /profile
│   │       ├── settings/                 # /settings
│   │       └── dev-tickets/              # /dev-tickets
│   ├── features/                         # Feature-based architecture (NEW Session 14)
│   │   ├── otb/                          # Budget, Planning, Proposal, OTB Analysis
│   │   │   ├── components/               # BudgetManagement, BudgetAllocate, OTBAnalysis,
│   │   │   │                             # PlanningDetail, ProposalDetail, SKUProposal,
│   │   │   │                             # AllocationToolbar, AllocationSidePanel, AllocationProgressBar,
│   │   │   │                             # BulkActionsMenu, VersionCompareModal, ViewToggleBar,
│   │   │   │                             # UnsavedChangesBanner, AddSKUModal (NEW S25-29)
│   │   │   ├── hooks/                    # useBudget, usePlanning, useProposal,
│   │   │   │                             # useAllocationState, useSessionRecovery,
│   │   │   │                             # useClipboardPaste, useTableFilters (NEW S25)
│   │   │   ├── utils/                    # exportExcel (NEW S25)
│   │   │   └── index.ts
│   │   ├── tickets/                      # Ticket, TicketDetail, TicketKanbanBoard
│   │   ├── approvals/                    # ApprovalsScreen, ApprovalWorkflowScreen
│   │   ├── orders/                       # OrderConfirmation, ReceiptConfirmation
│   │   ├── master-data/                  # MasterDataScreen
│   │   ├── import/                       # ImportDataScreen (NEW Session 14)
│   │   └── index.ts                      # Re-exports all features
│   ├── screens/                          # Re-export wrappers (backward compat)
│   │   ├── HomeScreen.tsx                # Dashboard (stays here, not in features)
│   │   ├── LoginScreen.tsx               # Login (stays here)
│   │   ├── ProfileScreen.tsx             # Profile (stays here)
│   │   ├── SettingsScreen.tsx            # Settings (stays here)
│   │   ├── DevTicketScreen.tsx           # DevTickets (stays here)
│   │   ├── ImportDataScreen.tsx          # Re-exports from features/import
│   │   └── *.tsx                         # Others: re-export from features/*
│   ├── components/
│   │   ├── layout/                       # RENAMED: Layout/ → layout/ (lowercase)
│   │   │   ├── Sidebar.tsx               # Navigation sidebar (collapsible)
│   │   │   ├── AppHeader.tsx             # Top header (search, dark mode, lang)
│   │   │   ├── MobileBottomNav.tsx       # Bottom nav for mobile (NEW Session 14)
│   │   │   └── index.ts
│   │   ├── ui/                           # UI component library
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── BudgetModal.tsx
│   │   │   ├── ExpandableStatCard.tsx
│   │   │   ├── KPIDetailModal.tsx
│   │   │   ├── PlanningDetailModal.tsx
│   │   │   ├── BottomSheet.tsx           # Draggable bottom sheet (NEW Session 14)
│   │   │   ├── MobileDataCard.tsx        # Card for mobile data display (NEW)
│   │   │   ├── MobileFilterSheet.tsx     # Filter panel slide-up (NEW)
│   │   │   ├── MobileTableView.tsx       # Responsive table/card switcher (NEW)
│   │   │   ├── SwipeAction.tsx           # Swipe approve/reject
│   │   │   ├── FilterSelect.tsx         # Luxury dropdown (NEW Session 25)
│   │   │   ├── CreatableSelect.tsx      # Dropdown + create-new (NEW Session 29)
│   │   │   ├── CurrencyInput.tsx        # VND formatted input (NEW Session 25)
│   │   │   ├── FormattedCurrency.tsx    # Currency display (NEW Session 25)
│   │   │   ├── TableSkeleton.tsx        # Table loading skeleton (NEW Session 25)
│   │   │   ├── Breadcrumbs.tsx          # Navigation breadcrumbs (NEW Session 27)
│   │   │   ├── PrintButton.tsx          # Print support (NEW Session 27)
│   │   │   ├── ConfirmDialog.tsx        # Custom confirm dialog (NEW Session 27)
│   │   │   ├── ErrorBoundary.tsx        # Error boundary wrapper (NEW Session 25)
│   │   │   └── index.ts
│   │   ├── mobile/                      # Mobile UI 2.0 Revolution (NEW Session 14)
│   │   │   ├── MobileCard.tsx           # Card: avatar, badges, progress, metrics
│   │   │   ├── MobileList.tsx           # List: expandable rows, skeleton loading
│   │   │   ├── BottomSheet.tsx          # Draggable sheet + FilterBottomSheet
│   │   │   ├── PullToRefresh.tsx        # Native pull-to-refresh gesture
│   │   │   ├── FilterChips.tsx          # Chips + FAB + MobileSearchBar
│   │   │   └── index.ts                # Barrel exports (components + hooks)
│   │   └── AuthGuard.tsx                 # Route protection
│   ├── contexts/                         # All .tsx with typed interfaces
│   │   ├── AuthContext.tsx               # JWT auth (AuthUser, AuthContextType)
│   │   ├── LanguageContext.tsx            # Bilingual EN/VN with t()
│   │   └── AppContext.tsx                # Shared state (AppContextType)
│   ├── services/                         # All .ts with typed methods
│   │   ├── api.ts                        # Axios + JWT interceptor + GET caching + auto-retry
│   │   ├── authService.ts
│   │   ├── budgetService.ts
│   │   ├── planningService.ts
│   │   ├── proposalService.ts
│   │   ├── masterDataService.ts
│   │   ├── approvalService.ts
│   │   ├── approvalWorkflowService.ts
│   │   ├── importService.ts              # Bulk CSV/Excel import
│   │   ├── orderService.ts               # Order CRUD (NEW S26)
│   │   ├── notificationService.ts        # Notification API (NEW S27)
│   │   ├── approvalHelper.ts             # Shared approval utilities (NEW S25)
│   │   ├── withErrorHandling.ts          # Error handling wrapper (NEW S25)
│   │   └── index.ts
│   ├── hooks/                            # Custom hooks
│   │   ├── useIsMobile.ts                # Responsive breakpoints → {isMobile,isTablet,isDesktop}
│   │   ├── useMobile.ts                  # Mobile UI 2.0 hooks (NEW Session 14)
│   │   ├── useKPIBreakdown.ts            # KPI analytics
│   │   ├── useDataImport.ts              # File parsing + batch import
│   │   ├── useMasterData.ts              # Centralized master data fetching (NEW S25)
│   │   ├── useConfirmDialog.ts           # Custom confirm dialog hook (NEW S25)
│   │   ├── useUnsavedChanges.ts          # Unsaved changes detection (NEW S27)
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts                      # 50+ TypeScript interfaces (NEW Session 14)
│   ├── locales/
│   │   ├── en.ts                         # English translations
│   │   ├── vi.ts                         # Vietnamese translations
│   │   └── index.ts
│   ├── utils/
│   │   ├── routeMap.ts                   # screenId → URL mapping
│   │   ├── routeMap.test.ts              # Route tests (NEW Session 14)
│   │   ├── formatters.ts                 # Currency, date formatters
│   │   ├── formatters.test.ts            # Formatter tests (NEW Session 14)
│   │   ├── constants.ts
│   │   ├── lerp-tokens.ts
│   │   └── index.ts
│   ├── styles/
│   │   └── mobile-design-system.css      # Mobile CSS variables + touch targets (NEW)
│   ├── constants/
│   │   ├── index.ts
│   │   ├── master-data.ts
│   │   └── routes.ts
│   └── test/
│       ├── setup.tsx                     # Vitest test setup (jsdom, mocks)
│       └── utils.tsx                     # Mock factories + API test helpers
├── e2e/                                  # Playwright E2E tests (NEW Session 24)
│   ├── playwright.config.ts
│   ├── specs/                            # auth, budget, planning, approval
│   ├── fixtures/                         # Test data JSON
│   └── helpers/                          # API mocks, auth helpers
├── .github/workflows/ci.yml             # CI/CD pipeline (NEW Session 24)
├── vitest.config.ts                      # Vitest config (jsdom, V8 coverage)
├── tsconfig.json                         # TypeScript strict mode
└── public/
    └── lerp-logo.png
```

---

## KEY PATTERNS

### TypeScript (Session 14)
```ts
// All files are now .ts/.tsx — strict mode enabled
// Shared types in src/types/index.ts (50+ interfaces)
// Contexts export typed interfaces: AppContextType, AuthContextType, AuthUser
// Services use `any` for flexibility: async getAll(filters: any = {})
// Components use typed props or `any` for complex screens
```

### Feature-Based Architecture (Session 14)
```ts
// Screens organized by domain in src/features/{domain}/components/
// Re-exports in src/screens/ for backward compatibility:
//   export { default } from '../features/otb/components/BudgetManagementScreen';
// Hooks co-located with features: src/features/otb/hooks/useBudget.ts
```

### Services
```ts
// api.ts = Axios instance with JWT interceptor + GET request caching (1-min TTL)
// Domain services use: api.get('/endpoint') → response.data.data || response.data
const extract = (res: any) => res.data?.data ?? res.data;
```

### API Responses
```ts
// May return { data: { data: [...] } } or { data: [...] } - always handle both
```

### Bilingual (i18n)
```ts
const { t, language, setLanguage } = useLanguage();
// Usage: t('home.welcomeBack', { name: 'Admin' })
// Translations in src/locales/en.ts and src/locales/vi.ts
// Toggle on AppHeader + Settings page
// Persisted in localStorage
```

### Dark/Light Mode
```ts
// CSS variables in globals.css (.light / .dark classes)
// All screens receive darkMode prop from AppContext
// Pattern: darkMode ? 'dark-classes' : 'light-classes'
```

### Mobile Responsive (Session 14)
```ts
// === V1: Existing hooks (used in 20+ screens) ===
const { isMobile, isTablet, isDesktop } = useIsMobile(); // from @/hooks/useIsMobile
// Breakpoints: mobile <768px, tablet 768-1023px, desktop ≥1024px
// Sidebar hidden on mobile → MobileBottomNav shown instead

// === V1 components: src/components/ui/ ===
// BottomSheet, MobileDataCard, MobileFilterSheet, MobileTableView, SwipeAction

// === V2: Mobile UI 2.0 Revolution (NEW) ===
// Import from: @/components/mobile
import { MobileCard, MobileList, BottomSheet, FilterBottomSheet,
  PullToRefresh, FilterChips, FloatingActionButton, MobileSearchBar,
  useIsMobile, useSwipe, useBottomSheet, useScrollLock, usePullToRefresh, useHaptic
} from '@/components/mobile';

// V2 useIsMobile returns boolean (different from V1 object!)
const isMobile = useIsMobile({ breakpoint: 768 }); // boolean

// CSS: @/styles/mobile-design-system.css (imported in layout.tsx)
// Touch targets ≥44px, safe-area padding, skeleton loading, FAB, sticky headers
```

### Premium Card Design
```js
// KPI/stat cards use gradient background + watermark icon pattern:
// - Diagonal gradient: linear-gradient(135deg, base 0%, base 60%, accentGrad 100%)
// - Large watermark icon: absolute -bottom-3 -right-3, size 80-90px, opacity 0.05
// - Icon badge: w-10 h-10 rounded-xl backdrop-blur-sm
// - Accent colors per card: gold, emerald, blue, rose, amber, teal, violet, indigo
// Applied in: HomeScreen, BudgetManagementScreen, TicketScreen, DevTicketScreen
```

### Color Palette
```
Dark Theme:
  #0A0A0A  - Background
  #121212  - Card background
  #1A1A1A  - Muted/input background
  #2E2E2E  - Borders
  #666666  - Muted text
  #999999  - Secondary text
  #F2F2F2  - Primary text
  #D7B797  - Brand gold (primary accent)
  #2A9E6A  - Success green
  #F85149  - Error red
  #E3B341  - Warning gold

Light Theme:
  #ffffff  - Card background
  #C4B5A5  - Borders (was border-[#2E2E2E]/20)
  #D4C8BB  - Light borders (was border-[#2E2E2E]/10)
  rgba(160,120,75,...) - Hover/accent backgrounds (was rgba(215,183,151,...))
```

---

## SESSION 06/02/2026 - Session 6

### Thay doi chinh

1. **Next.js Migration (tu CRA)**
   - CRA (reference): `/Users/mac/OTBL-ERP/L-ERP - OTB - App/`
   - Next.js 16, App Router, Tailwind v3, React 19
   - 16 routes (14 static + 2 dynamic), all build OK
   - AuthGuard bao ve dashboard routes
   - Cross-screen data: AppContext + sessionStorage

2. **Bilingual UI (EN/VN)**
   - LanguageContext with t() function, {{param}} interpolation
   - 500+ translated keys across 15 screens + components
   - Language toggle on AppHeader + Settings page
   - Persisted in localStorage, default: 'vi'
   - Missing key fallback: current lang → EN → raw key

3. **Premium Card Design**
   - KPI cards: gradient background + large watermark icon (80-90px)
   - 8 accent themes: gold, emerald, blue, rose, amber, teal, violet, indigo
   - Applied to HomeScreen (8 cards), BudgetManagement (3), Ticket (3), DevTicket (4)
   - BudgetAlertsBanner redesigned: glass-morphism, gradient badges, left accent bar
   - hover:shadow-lg, group-hover watermark scale animation

4. **Light Theme Contrast Fix**
   - CSS variables updated: stronger borders, pure white cards, saturated primary
   - Component-level light overrides: .light .ind-card, .ind-table, .kpi-card, etc.
   - Screen-level: border-[#2E2E2E]/20 → border-[#C4B5A5] (solid warm-tan)
   - Screen-level: rgba(215,183,151,...) → rgba(160,120,75,...) (deeper brown)
   - 11 screen files + AppHeader + globals.css updated

5. **Dark Blue Flash Fix**
   - AuthGuard.jsx: bg-[#0f172a] → bg-[#0A0A0A]
   - LoginScreen.jsx: Full palette conversion from slate to app dark theme

6. **Sidebar Enhancements**
   - All text bold (font-semibold for items, font-bold for headers/active)
   - Logo + brand name 120% larger when expanded (h-11, text-xs)
   - Header height 64px

### Files da cap nhat (39 files)

```
# New files
src/contexts/LanguageContext.js       # i18n context
src/locales/en.js                     # English translations
src/locales/vi.js                     # Vietnamese translations
src/locales/index.js                  # Re-export

# Modified - Layout & Components
src/app/globals.css                   # Theme variables + light mode overrides
src/app/providers.jsx                 # + LanguageProvider
src/components/AuthGuard.jsx          # Dark flash fix
src/components/BudgetAlertsBanner.jsx # Premium redesign
src/components/Layout/AppHeader.jsx   # Lang toggle + i18n + light fix
src/components/Layout/Sidebar.jsx     # i18n + bold text + larger logo
src/components/Common/*.jsx           # i18n translations
src/components/RiskScoreCard.jsx      # i18n
src/components/OtbAllocationAdvisor.jsx
src/components/SkuRecommenderPanel.jsx
src/components/SizeCurveAdvisor.jsx
src/components/TicketKanbanBoard.jsx

# Modified - Screens (all 15)
src/screens/*.jsx                     # i18n + light theme fix + premium cards
```

---

## PREVIOUS SESSIONS

### Session 5 (06/02/2026) - Frontend-Backend Integration
- All 7 phases completed: services connected to real API
- Removed all mock data fallbacks (except TicketDetailPage)
- HomeScreen/ProfileScreen use AuthContext user

### Session 4 (03/02/2026) - UI & Render Deployment
- AI button styling, dashboard welcome section
- Render deployment config (render.yaml)

### Session 3 (29/01/2026) - UI Design
- Watermark icon card design (original concept)
- Applied to 22 pages in monorepo version

### Session 2 (14/01/2026) - Backend Completion
- OTB Plans, SKU Proposals, Workflows, Analytics, Integrations modules
- Full API client, CI/CD, Docker config

---

## CONTEXTS (State Management) — All TypeScript

### AuthContext.tsx
```ts
interface AuthUser {
  id: string; email: string; name: string; role: string;
  permissions: string[]; avatar?: string;
}
interface AuthContextType {
  user: AuthUser | null; loading: boolean; error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  canApprove: (level: number) => boolean;
}
// Token: localStorage.accessToken, localStorage.refreshToken
// Auto-fetch user profile on mount
```

### AppContext.tsx
```ts
interface AppContextType {
  darkMode: boolean; setDarkMode: (v: boolean) => void;
  sharedYear: number; setSharedYear: (v: number) => void;
  sharedGroupBrand: string; setSharedGroupBrand: (v: string) => void;
  sharedBrand: string; setSharedBrand: (v: string) => void;
  allocationData: any; setAllocationData: (v: any) => void;
  otbAnalysisContext: any; setOtbAnalysisContext: (v: any) => void;
  skuProposalContext: any; setSkuProposalContext: (v: any) => void;
  kpiData: any; setKpiData: (v: any) => void;
}
```

### LanguageContext.tsx
```ts
const { language, setLanguage, t } = useLanguage();
// language: 'en' | 'vi' (default 'vi')
// t('home.welcomeBack', { name: 'Admin' }) - Translation with {{param}} interpolation
// Fallback: current lang → EN → raw key
// Persisted: localStorage.getItem('app-language')
// 758 lines per locale file, 500+ translation keys
```

---

## HOOKS (Domain Logic) — All TypeScript

### useProposal.ts (src/features/otb/hooks/)
- State: `proposals`, `loading`, `error`, `showProposalDetail`, `selectedProposal`, `skuCatalog`
- Actions: `fetchProposals()`, `fetchSkuCatalog()`, `createProposal()`, `addProduct()`, `bulkAddProducts()`, `updateProduct()`, `removeProduct()`, `submitProposal()`, `approveProposal()`, `deleteProposal()`

### useBudget.ts (src/features/otb/hooks/)
- State: `selectedYear`, `selectedSeasonGroups`, `budgets`, `loading`, `error`, `brands`, `stores`, `seasons`
- Actions: `handleCellClick()`, `handleStoreAllocationChange()`, `handleSaveBudget()`, `submitBudget()`, `approveBudget()`
- Auto-fetches master data on mount, budgets on year change

### usePlanning.ts (src/features/otb/hooks/)
- State: `plannings`, `loading`, `error`, `collections`, `genders`, `categories`
- Actions: `handleOpenPlanningDetail()`, `handleSavePlanning()`, `submitPlanning()`, `approvePlanning()`, `markPlanningFinal()`, `copyPlanning()`

### useDataImport.ts (src/hooks/) — NEW Session 14
- Parse CSV/TSV/Excel files with header detection
- Import targets: products, otb_budget, wssi, size_profiles, forecasts, clearance, kpi_targets, suppliers, categories
- Duplicate modes: skip, overwrite, merge
- Batch processing (BATCH_SIZE=500) with progress tracking + abort control
- Returns: `{ file, parsedData, headers, previewRows, target, importMode, duplicateHandling, matchKeys, isImporting, progress, result, error, parseFile, startImport, abortImport, fetchData, fetchStats, fetchAllStats, deleteSession, clearTarget, resetUpload }`

### useIsMobile.ts (src/hooks/) — V1, Session 14
- Returns: `{ isMobile, isTablet, isDesktop }` (object)
- Breakpoints: mobile <768px, tablet 768-1023px, desktop ≥1024px
- Uses `window.matchMedia` with event listeners
- **Used by 20+ screens** — do NOT replace

### useMobile.ts (src/hooks/) — V2 Mobile UI 2.0, Session 14
- `useIsMobile(options?)` → `boolean` (note: different API from V1!)
- `useSwipe(options?)` → touch handlers + offset + direction + isSwiping
- `useBottomSheet(initialState?)` → `{ isOpen, open, close, toggle }`
- `useScrollLock(locked)` → locks body scroll when true
- `usePullToRefresh(options)` → isPulling, isRefreshing, pullDistance, handlers
- `useHaptic()` → `{ trigger(type) }` — vibration feedback (light/medium/heavy/selection/success/warning/error)
- **Access via:** `import { useSwipe } from '@/components/mobile'` or `from '@/hooks/useMobile'`

### useAllocationState.ts (src/features/otb/hooks/) — NEW Session 25
- Central allocation state management (393 lines)
- Tracks: allocations, dirty cells, selection, undo/redo stack
- Actions: `updateCell()`, `bulkUpdate()`, `undo()`, `redo()`, `selectRows()`, `getTotal()`
- Integrates with `useSessionRecovery` for auto-save

### useSessionRecovery.ts (src/features/otb/hooks/) — NEW Session 25
- Auto-save allocation state to sessionStorage every 30s
- Restore on page reload with "recover unsaved changes?" banner
- Returns: `{ hasRecovery, recover(), dismiss() }`

### useClipboardPaste.ts (src/features/otb/hooks/) — NEW Session 25
- Paste from Excel via clipboard API
- Detects tab-separated values, maps to table cells
- Returns: `{ handlePaste }`

### useTableFilters.ts (src/features/otb/hooks/) — NEW Session 25
- Table filtering/sorting/search logic
- Returns: `{ filters, setFilter, sortBy, searchTerm, filteredData }`

### useMasterData.ts (src/hooks/) — NEW Session 25
- Centralized master data fetching (brands, stores, collections, genders, categories, seasons)
- Caches data, prevents duplicate API calls
- Returns: `{ brands, stores, collections, genders, categories, seasons, loading }`

### useConfirmDialog.ts (src/hooks/) — NEW Session 25
- Custom confirm dialog (replaces window.confirm)
- Returns: `{ isOpen, title, message, confirm(), cancel(), showConfirm(options) }`

### useUnsavedChanges.ts (src/hooks/) — NEW Session 27
- Tracks form dirty state, warns before navigation
- Returns: `{ isDirty, setDirty, resetDirty }`

### useKPIBreakdown.ts (src/hooks/)
- Advanced KPI analytics with breakdown calculations

---

## SERVICES → API ENDPOINTS

### authService.js
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login → returns accessToken, refreshToken, user |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Get current user profile |

### budgetService.js
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/budgets` | List (filters: fiscalYear, status, groupBrandId) |
| GET | `/budgets/statistics` | Budget stats |
| GET | `/budgets/:id` | Get one with details & approval history |
| POST | `/budgets` | Create with store allocations |
| PUT | `/budgets/:id` | Update (DRAFT only) |
| POST | `/budgets/:id/submit` | Submit for approval |
| POST | `/budgets/:id/approve/level1` | L1 approve/reject |
| POST | `/budgets/:id/approve/level2` | L2 approve/reject |
| DELETE | `/budgets/:id` | Delete (DRAFT only) |

### planningService.js
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/planning` | List (filters: budgetDetailId, budgetId, status) |
| GET | `/planning/:id` | Get with details & approvals |
| POST | `/planning` | Create for a budget detail |
| POST | `/planning/:id/copy` | Copy to new version |
| PUT | `/planning/:id` | Update (DRAFT) |
| PATCH | `/planning/:id/details/:detailId` | Update single detail |
| POST | `/planning/:id/submit` | Submit for approval |
| POST | `/planning/:id/approve/level1` | L1 approve/reject |
| POST | `/planning/:id/approve/level2` | L2 approve/reject |
| POST | `/planning/:id/final` | Mark as final version |
| DELETE | `/planning/:id` | Delete (DRAFT) |

### proposalService.js
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/proposals` | List (filters: budgetId, status) |
| GET | `/proposals/statistics` | Proposal stats |
| GET | `/proposals/:id` | Get with products & approvals |
| POST | `/proposals` | Create |
| PUT | `/proposals/:id` | Update (DRAFT) |
| POST | `/proposals/:id/products` | Add single product |
| POST | `/proposals/:id/products/bulk` | Bulk add products |
| PATCH | `/proposals/:id/products/:productId` | Update product |
| DELETE | `/proposals/:id/products/:productId` | Remove product |
| POST | `/proposals/:id/submit` | Submit |
| POST | `/proposals/:id/approve/level1` | L1 approve/reject |
| POST | `/proposals/:id/approve/level2` | L2 approve/reject |
| DELETE | `/proposals/:id` | Delete (DRAFT) |

### masterDataService.js
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master/brands` | Group brands (FER, BUR, GUC, PRA) |
| GET | `/master/stores` | Stores (REX, TTP) |
| GET | `/master/collections` | Collections (Carry Over, New) |
| GET | `/master/genders` | Genders (Male, Female, Unisex) |
| GET | `/master/categories` | Full hierarchy: Gender → Category → SubCategory |
| GET | `/master/seasons` | Season config (SS/FW + Pre/Main) |
| GET | `/master/sku-catalog` | SKU catalog (query: search, productType, brandId, page, pageSize) |
| GET | `/master/sub-categories` | SubCategories (fallback: flatten from categories) |

### approvalWorkflowService.js
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/approval-workflow` | List steps (optional: brandId) |
| GET | `/approval-workflow/roles` | Available roles |
| GET | `/approval-workflow/brand/:brandId` | Workflow for a brand |
| POST | `/approval-workflow` | Create step |
| PATCH | `/approval-workflow/:id` | Update step |
| DELETE | `/approval-workflow/:id` | Delete step |
| POST | `/approval-workflow/brand/:brandId/reorder` | Reorder steps |

### importService.ts (NEW Session 14)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/import/batch` | Batch import CSV/Excel data |
| GET | `/import/data` | Query imported data |
| GET | `/import/stats` | Import stats for target |
| GET | `/import/all-stats` | All import stats |
| DELETE | `/import/data` | Delete import data |
| DELETE | `/import/session/:sessionId` | Delete import session |
| DELETE | `/import/clear/:target` | Clear all data for target |

> **Note:** `aiService.js` da bi xoa trong OTBnonAI (non-AI version). Chi co trong L-ERP-OTB-NextJS.

---

## BACKEND (NestJS)

### Location & Tech
```
/Users/mac/OTBL-ERP/OTBnonAI/backend/
├── src/
│   ├── main.ts                          # Bootstrap + Swagger + CORS + PrismaExceptionFilter
│   ├── app.module.ts                    # Root (9 feature modules)
│   ├── prisma/                          # Prisma service (global module)
│   ├── common/
│   │   ├── guards/                      # jwt-auth.guard, permissions.guard
│   │   ├── filters/                     # prisma-exception.filter (NEW S27)
│   │   ├── services/                    # audit-log.service (NEW S27)
│   │   └── utils/                       # financial.ts — safeSum, roundVND, toNumber (NEW S27)
│   └── modules/
│       ├── auth/                        # Login, JWT, refresh, GDPR erasure (enhanced S27)
│       ├── master-data/                 # Brands, stores, SKU catalog (pagination S27)
│       ├── budget/                      # Budget CRUD + 2-level approval + soft delete + optimistic lock (S27)
│       ├── planning/                    # Planning versions + dimensions + optimistic lock (S27)
│       ├── proposal/                    # Flat proposal products + optimistic lock (S27)
│       ├── import/                      # Bulk import + WSSI analytics (enhanced S27)
│       ├── approval-workflow/           # Workflow config per brand
│       ├── notification/                # Real-time notifications (NEW S27)
│       └── data-retention/              # Data cleanup policies (NEW S27)
├── prisma/
│   ├── schema.prisma                    # 29 tables
│   ├── seed.ts                          # Default users + master data
│   └── seed-rich.ts                     # Rich seed data
├── docker-compose.yml                   # PostgreSQL 16
└── package.json
```

### Database (PostgreSQL 16)
- Docker: `lerp-otb-db` container, port 5432
- Creds: user=`lerp`, password=`lerp2026`, db=`lerp_otb`
- ORM: Prisma 5.8.0, 29 tables

### Prisma Schema Summary

**Auth & RBAC:**
- `users` - accounts with role_id, store_access, brand_access
- `roles` - roles with JSON permissions array (`*` = admin)

**Master Data:**
- `group_brands` - FER, BUR, GUC, PRA with color config
- `stores`, `collections`, `genders`, `categories`, `sub_categories`
- `sku_catalog` - products with sku_code, product_name, srp, brand_id

**Budget (3 tables):**
- `budgets` - by GroupBrand × SeasonGroup × SeasonType × FiscalYear
- `budget_details` - store allocations (Budget → Store)
- `budget_alerts` - variance alerts

**Planning (2 tables):**
- `planning_versions` - version per BudgetDetail with isFinal flag
- `planning_details` - dimension allocation (collection/gender/category) with metrics

**Proposal (3 tables):**
- `proposals` - flat structure (no rails)
- `proposal_products` - SKU + orderQty + costings
- `product_allocations` - per-store quantity

**Approval & Audit:**
- `approvals` - polymorphic (budget/planning/proposal), level, action, comment
- `audit_logs` - entity changes with user_id, changes JSON

**AI Module (7+ tables):**
- `sales_history`, `size_curve_recommendations`, `budget_snapshots`
- `allocation_recommendations`, `risk_assessments`, `risk_thresholds`
- `sku_performance`, `attribute_trends`, `sku_recommendations`
- `approval_workflow_steps`

### Authentication Flow
```
1. POST /auth/login → accessToken (8h) + refreshToken (7d)
2. Request interceptor → Bearer token from localStorage
3. On 401 → Try POST /auth/refresh → new accessToken → retry
4. On refresh fail → clear tokens → redirect /login
5. Permission-based RBAC: budget:read, budget:write, budget:approve_l1, etc.
6. Admin has wildcard '*' permission
```

### Status Workflow (Budget / Planning / Proposal)
```
DRAFT → SUBMITTED → LEVEL1_APPROVED → APPROVED
                  ↘                 ↗
                    → REJECTED ←
```

### API Response Format
```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Paginated
{ "success": true, "data": [...], "total": 100, "page": 1, "pageSize": 20 }

// Error
{ "statusCode": 400, "message": "Error", "error": "Bad Request" }
```

---

## ENVIRONMENT VARIABLES

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Backend (.env)
```
DATABASE_URL="postgresql://lerp:lerp2026@localhost:5432/lerp_otb?schema=public"
JWT_SECRET="change-this-to-a-random-64-char-string-in-production"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

---

## COMMANDS

```bash
# === FRONTEND (OTBnonAI/) ===
npm run dev              # Start dev server (port 3006, turbopack)
npm run build            # Production build
npm run start            # Start production server (standalone)
npm run lint             # ESLint
npm run test             # Run Vitest tests

# === BACKEND (L-ERP-Backend/lerp-otb-backend/) ===
docker compose up -d     # Start PostgreSQL
npm install
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run DB migrations
npm run prisma:seed      # Seed default data + users
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run start:dev        # Start NestJS dev (port 4000)

# Swagger docs: http://localhost:4000/api/docs

# === GIT (4 remotes) ===
git push origin main     # Push to TCDevop/OTB
git push lerp-otb main   # Push to linkk/lerp-otb (primary)
git push lerp main       # Push to linkk/lerp
git push linkk main    # Push to linkk/L-ERP-OTB-TCDATA (legacy)
```

### Full Startup Sequence
```bash
# 1. Start database
cd "/Users/mac/OTBL-ERP/L-ERP-Backend/lerp-otb-backend"
docker compose up -d

# 2. Start backend
npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
npm run start:dev
# API ready at http://localhost:4000/api/v1

# 3. Start frontend (new terminal)
cd "/Users/mac/OTBL-ERP/OTBnonAI"
npm run dev
# App ready at http://localhost:3006
```

---

## DEPENDENCIES

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | Framework |
| react | 19.2.3 | UI Library |
| typescript | 5.9.3 | TypeScript compiler |
| axios | 1.13.4 | HTTP client |
| tailwindcss | 3.4.19 | Styling |
| lucide-react | 0.563.0 | Icons |
| recharts | 3.7.0 | Charts |
| react-hot-toast | 2.6.0 | Notifications |
| framer-motion | 12.34.0 | Animations (BottomSheet, SwipeAction) |
| @tanstack/react-virtual | 3.13.18 | Virtual scrolling |
| xlsx | 0.18.5 | Excel file parsing |
| vitest | 4.0.18 | Testing framework (dev) |
| happy-dom | 20.6.0 | Test DOM environment (dev) |
| @testing-library/react | 16.3.2 | React testing utilities (dev) |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| @nestjs/* | 10.3.0 | Framework |
| @prisma/client | 5.8.0 | ORM |
| passport + @nestjs/jwt | — | Auth (JWT) |
| bcryptjs | — | Password hashing |
| class-validator | — | DTO validation |
| helmet | — | HTTP security headers |
| @nestjs/swagger | — | API documentation |

---

## SESSION 21/02/2026 - Session 29 (S25 CreatableSelect + Add SKU Modal + SKU UI)

### Thay doi chinh

**CreatableSelect Component + View Changes (`84b2c8a` — 38 files, +1615/-1067 lines):**
- `CreatableSelect.tsx` — Luxury dropdown with inline "create new" option (type to add new brand/collection/etc)
- TicketDetailPage: major redesign (554 lines changed), improved layout + data display
- AppHeader: 162 lines changed, improved KPI bar
- AllocationToolbar: simplified (363 lines → compact)
- PlanningDetailPage: redesigned (294 lines changed)
- BudgetManagementScreen: enhanced (+84 lines)
- BudgetModal/PlanningDetailModal: compact redesign
- LoginScreen: simplified (-62 lines)
- Fixed duplicate navigation entries in Sidebar
- LanguageContext: improved type handling

**Add SKU Modal Two-Step Form (`2ac6ac7`, `d3a2418`, `34abd8d`):**
- `AddSKUModal.tsx` upgraded from simple form to two-step wizard (552 lines → full form)
- Step 1: Select brand, collection, gender, category, subcategory
- Step 2: Full data entry (SKU code, name, color, composition, pricing, sizes, store allocation)
- Dynamic API stores (removed hardcoded STORES import)
- Missing i18n keys added for Step 2 + unitCost fallback

**SKU Proposal UI Polish (`d0a63bc`):**
- Removed context bar (budget/version info) for cleaner layout
- Added "Submit Ticket" button for SKU proposals
- Enhanced Total Value display

### Files chinh (42 files)
```
# New files
src/components/ui/CreatableSelect.tsx               # Luxury dropdown with create-new

# Major changes
src/features/tickets/components/TicketDetailPage.tsx  # Major redesign
src/features/otb/components/AddSKUModal.tsx           # Two-step wizard form
src/features/otb/components/AllocationToolbar.tsx      # Simplified
src/features/otb/components/PlanningDetailPage.tsx     # Redesigned
src/features/otb/components/SKUProposalScreen.tsx      # UI cleanup + Submit Ticket
src/components/layout/AppHeader.tsx                    # KPI bar improvements
src/features/otb/components/BudgetManagementScreen.tsx # Enhanced
```

---

## SESSION 20/02/2026 - Session 28 (Client Feedback Round 2)

### Thay doi chinh

**7 Bugs Fixed (`010db53` — 8 files, +417/-115 lines):**
1. **AddSKUModal**: Fixed form submission + validation issues
2. **BudgetAllocateScreen**: Removed unnecessary allocation elements (-24 lines)
3. **OTBAnalysisScreen**: Minor display fix
4. **SKUProposalScreen**: 3 fixes (46 lines changed) — filter behavior + data display
5. **TicketDetailPage**: Major enhancement (+329 lines) — improved ticket detail layout + data
6. **TicketScreen**: Search/filter improvements (54 lines changed)
7. **i18n**: 36 new translation keys (EN + VI) for ticket/proposal screens

### Files chinh (8 files)
```
src/features/otb/components/AddSKUModal.tsx
src/features/otb/components/BudgetAllocateScreen.tsx
src/features/otb/components/OTBAnalysisScreen.tsx
src/features/otb/components/SKUProposalScreen.tsx
src/features/tickets/components/TicketDetailPage.tsx
src/features/tickets/components/TicketScreen.tsx
src/locales/en.ts
src/locales/vi.ts
```

---

## SESSION 18-19/02/2026 - Sessions 26-27 (RRI Pipeline Audit — 73 Gaps Fixed)

### Thay doi chinh

Applied **Reverse Requirements Interview (RRI)** methodology. 73 gaps found, ALL FIXED across 3 commits:

**Round 1 — 18 gaps (`dca11bb` — 28 files, +349/-332 lines):**
- New `orderService.ts` — confirmOrder, cancelOrder, confirmReceipt, flagDiscrepancy
- Order/Receipt confirmation screens: real API wiring instead of demo data
- Budget/Planning/Proposal hooks: AbortController cleanup, error handling
- Removed hardcoded ticket data in TicketDetailPage (-214 lines)
- VersionDiffModal fix, AllocationState improvements
- Removed unused types from index.ts

**Round 2 — P0 Security & Business Logic (`feceb82` — 26 files, +750/-127 lines):**
- **Backend Notification module** (NEW): controller + service + module (real-time alerts)
- **Frontend notificationService.ts** (NEW): API integration for notifications
- Backend auth: JWT strategy hardened, login security improvements
- Backend budget/planning/proposal services: enhanced validation, error handling
- AppHeader: notification bell with real API (122+ lines)
- AppContext: expanded state management (+32 lines)
- HomeScreen: improved KPI data flow

**Round 3 — Complete 73 gaps (`be6cf25` — 60 files, +3704/-481 lines):**

**P0 Critical (16/16):**
- Mock data removal from all screens, replaced with real API calls
- Cache invalidation on mutations (budgetService, planningService, proposalService)
- API wiring for all CRUD operations

**P1 Major (30/30):**
- `financial.ts` utils: `safeSum()` (Kahan summation), `toNumber()` (Prisma Decimal), `roundVND()`
- Workflow enforcement: `validateWorkflowStep()` for brand-specific approval
- WSSI analytics: `getWssiAnalytics()` + `GET /import/wssi/analytics`
- Optimistic locking: `version Int @default(1)` on Budget/Planning/Proposal
- Soft delete: `deletedAt DateTime?` on Budget + `restore()` + `PATCH /budgets/:id/restore`

**P2 Minor (27/27):**
- `Breadcrumbs.tsx` + `PrintButton.tsx` — UI components for detail pages
- Global search with API search (budgets + proposals) in AppHeader
- Session recovery hook `useSessionRecovery.ts` (auto-save to sessionStorage)
- Data-driven budget chart in HomeScreen (replaces fake SVG)
- Brand comparison tab in OTBAnalysisScreen (+496 lines)
- Bulk confirm orders in OrderConfirmation
- Budget archive feature (full-stack)
- Per-brand budget cap (80% limit, client warning + server block)
- GDPR erasure: `DELETE /auth/users/:id/erase` (anonymizes PII)
- Data retention service: cleanup audit logs >365d, archived budgets >730d
- Auto-retry GET requests on network errors (max 2 retries with backoff)

**QA Polish (`8e0d3de`, `183a7eb`, `42c3320`, `533c90e`):**
- `ConfirmDialog.tsx` enhanced — custom dialog component
- UI consistency, compact layout across 15 files
- Missing i18n keys: home screen (10), budget (4)
- Search box dark mode: brightened border, icon, text, kbd badge
- Console errors: createdBy object rendering fix

### New Backend Modules
- `notification/` — notification controller, service, module
- `data-retention/` — `GET /data-retention/policy`, `POST /data-retention/cleanup`
- `import/` — WSSI analytics endpoint added
- Prisma schema: +`version` on Budget/Planning/Proposal, +`deletedAt` on Budget, +`PrismaExceptionFilter`

### New Frontend Files
```
src/services/orderService.ts                    # Order CRUD operations
src/services/notificationService.ts             # Notification API
src/services/approvalHelper.ts                  # Shared approval utilities
src/services/withErrorHandling.ts               # Error handling wrapper
src/components/ui/Breadcrumbs.tsx               # Navigation breadcrumbs
src/components/ui/PrintButton.tsx               # Print support
src/hooks/useUnsavedChanges.ts                  # Unsaved changes detection
backend/src/modules/notification/               # Notification module (NEW)
backend/src/modules/data-retention/             # Data retention module (NEW)
backend/src/common/utils/financial.ts           # Financial utilities
backend/src/common/filters/prisma-exception.filter.ts  # Prisma error filter
backend/src/common/services/audit-log.service.ts       # Audit logging
```

---

## SESSION 16/02/2026 - Session 25 (Budget Allocation Phase 3 + FilterSelect + Code Quality)

### Thay doi chinh

**Phase 3 Budget Allocation (`bc93d29` — 23 NEW files, +3496/-54 lines):**

Major feature drop — transformed BudgetAllocateScreen from basic table to full allocation workstation:

| Component | Description |
|-----------|-------------|
| `AllocationToolbar.tsx` | Toolbar with filters, view toggle, bulk actions |
| `AllocationProgressBar.tsx` | Visual progress for allocation completion |
| `AllocationSidePanel.tsx` | Slide-out panel with allocation details + charts |
| `AllocationStatusBar.tsx` | Status summary bar |
| `BulkActionsMenu.tsx` | Multi-select actions (approve, reject, export) |
| `UnsavedChangesBanner.tsx` | Warning banner for unsaved changes |
| `VersionCompareModal.tsx` | Side-by-side version comparison |
| `ViewToggleBar.tsx` | Toggle between table/card/chart views |
| `CurrencyInput.tsx` | Formatted VND currency input |
| `FormattedCurrency.tsx` | Display component for formatted amounts |
| `TableSkeleton.tsx` | Loading skeleton for tables |

New hooks:
| Hook | Description |
|------|-------------|
| `useAllocationState.ts` | Central allocation state management (393 lines) |
| `useClipboardPaste.ts` | Paste from Excel (clipboard API) |
| `useSessionRecovery.ts` | Auto-save/restore allocation state |
| `useTableFilters.ts` | Table filtering logic |

New utils:
| Util | Description |
|------|-------------|
| `exportExcel.ts` | Excel export for allocation data |

- 118 new i18n keys (EN + VI) for allocation features

**Merge AppHeader + AllocationToolbar (`452c5ac` — 11 files, +696/-446 lines):**
- Merged KPI stepper bar and AllocationToolbar on /planning page
- HomeScreen: major restructure (+561 lines)

**Luxury FilterSelect Component (`41745ad` — 5 files, +534/-254 lines):**
- `FilterSelect.tsx` — Premium dropdown with search, multi-select, luxury styling
- Applied to OTBAnalysisScreen (435 lines changed) and SKUProposalScreen

**QA/QC 8 Issues (`f4c2afd` — 13 files, +539/-52 lines):**
1. Allocation badges on progress bar
2. Filter persistence across navigation
3. Sizing status display
4. AddSKUModal improvements (243-line NEW file)
5. Comment column in tables
6. Removed approvals route from sidebar (now in Approvals screen only)

**Code Quality (`fa88a34` — 15 files, +398/-144 lines):**
- `ErrorBoundary.tsx` (130 lines) — wraps app in providers.tsx
- `React.memo` applied to heavy components
- `approvalHelper.ts` — shared approval logic extracted from 3 services
- `useMasterData.ts` hook (124 lines) — centralized master data fetching
- `withErrorHandling.ts` — service error handling wrapper
- Reduced duplication in budget/planning/proposal services (~100 lines each)

**Responsive Optimization (`c5e829d` — 9 files):**
- Modal/dropdown touch targets
- Safe area padding
- Tailwind config updates

**Code Quality & Responsive (`5f9e36a` — 25 files, +446/-238 lines):**
- Service methods restructured with better error handling
- Responsive improvements across all screens

### Files chinh (75+ files)
```
# 23 NEW files in Phase 3
src/features/otb/components/AllocationToolbar.tsx
src/features/otb/components/AllocationProgressBar.tsx
src/features/otb/components/AllocationSidePanel.tsx
src/features/otb/components/AllocationStatusBar.tsx
src/features/otb/components/BulkActionsMenu.tsx
src/features/otb/components/UnsavedChangesBanner.tsx
src/features/otb/components/VersionCompareModal.tsx
src/features/otb/components/ViewToggleBar.tsx
src/features/otb/hooks/useAllocationState.ts
src/features/otb/hooks/useClipboardPaste.ts
src/features/otb/hooks/useSessionRecovery.ts
src/features/otb/hooks/useTableFilters.ts
src/features/otb/utils/exportExcel.ts
src/components/ui/CurrencyInput.tsx
src/components/ui/FormattedCurrency.tsx
src/components/ui/TableSkeleton.tsx
src/components/ui/FilterSelect.tsx
src/components/ui/ErrorBoundary.tsx
src/hooks/useMasterData.ts
src/hooks/useConfirmDialog.ts
src/components/ui/ConfirmDialog.tsx
src/services/approvalHelper.ts
src/services/withErrorHandling.ts
```

---

## SESSION 14/02/2026 - Session 24 (Approvals Navigation + Phase 1 Hardening)

### Thay doi chinh

**Approvals Navigation Fix (`d1cb244` — 6 files, +456/-339 lines):**
- PlanningDetailPage now works when navigated from Approvals screen (not just from Budget Allocation)
- ProposalDetailPage: same fix — works standalone from Approvals
- SKUProposalScreen: refactored data loading (115 lines)
- ApprovalsScreen: added navigation links to detail pages
- approvalService: expanded API methods

**PlanningDetailPage Light Mode Redesign (`48cd245` — 15 files, +337/-332 lines):**
- Full light mode redesign for PlanningDetailPage (641 lines touched)
- Removed unused `darkMode` props from ui components
- Codebase cleanup across 15 files

**Phase 1 Hardening — E2E + Tests + CI/CD (`ae44096` — 23 files, +2234/-11 lines):**

*E2E Tests (Playwright):*
| Spec | Tests |
|------|-------|
| `e2e/specs/auth.spec.ts` | Login flow, session persistence, logout |
| `e2e/specs/budget.spec.ts` | Budget CRUD, allocation, approval workflow |
| `e2e/specs/planning.spec.ts` | Planning versions, details, finalization |
| `e2e/specs/approval.spec.ts` | Approval workflow, L1/L2 approve/reject |

E2E helpers: `api-mocks.ts` (API route mocking), `auth.ts` (login helper)
E2E fixtures: `auth.json`, `budgets.json`, `master-data.json`, `planning.json`

*Hook Tests:*
| Test File | Tests |
|-----------|-------|
| `useBudget.test.ts` | 344 lines — fetch, filter, create, update, submit, approve |
| `usePlanning.test.ts` | 311 lines — versions, details, finalize, copy |
| `useProposal.test.ts` | 261 lines — CRUD, products, submit, approve |

*Service Tests:*
| Test File | Tests |
|-----------|-------|
| `services.test.ts` | 355 lines — budget, planning, proposal, masterData API calls |

*CI/CD:*
- `.github/workflows/ci.yml` (96 lines) — lint, type-check, unit tests, build, E2E

*Test Infrastructure:*
- `src/test/mock-services.ts` (237 lines) — comprehensive service mocks
- Updated `setup.tsx` and `utils.tsx` for new test patterns

### Build & Test Status
- **201 tests** (185 pass, 16 fail in useProposal due to context mock issue)
- **9 test files** (was 5 files / 114 tests in Session 14)
- **4 E2E spec files** with Playwright

### Files chinh (44 files)
```
# NEW — E2E
.github/workflows/ci.yml
e2e/playwright.config.ts
e2e/specs/auth.spec.ts
e2e/specs/budget.spec.ts
e2e/specs/planning.spec.ts
e2e/specs/approval.spec.ts
e2e/helpers/api-mocks.ts
e2e/helpers/auth.ts
e2e/fixtures/*.json

# NEW — Hook tests
src/features/otb/hooks/__tests__/useBudget.test.ts
src/features/otb/hooks/__tests__/usePlanning.test.ts
src/features/otb/hooks/__tests__/useProposal.test.ts

# NEW — Service tests
src/services/__tests__/services.test.ts
src/test/mock-services.ts

# Modified
src/features/otb/components/PlanningDetailPage.tsx
src/features/otb/components/ProposalDetailPage.tsx
src/features/otb/components/SKUProposalScreen.tsx
src/features/approvals/components/ApprovalsScreen.tsx
src/services/approvalService.ts
```

---

## SESSION 14/02/2026 - Session 23 (Performance: Zero-Lag Filter Bar + Flip Card)

### Thay doi chinh

**Premium SKU Card Flip (`da1bd93`):**
- 3D flip card trên TicketDetailPage PremiumSKUCard
- Front: hình ảnh, SRP, REX/TTP, totals (existing)
- Back: Cost & Margin (unitCost, margin%, markup), Store Allocation bars, Size Breakdown table, Product Info
- CSS 3D: `perspective`, `rotateY(180deg)`, `backface-visibility: hidden`
- Click-triggered flip icon (RotateCcw from lucide-react)
- Fix: `pointerEvents` toggling giữa front/back faces (backface-visibility chỉ ẩn visual, không ẩn pointer events)
- Added `unitCost`, `collection`, `customerTarget` to mock data + API transform

**X-Ray UX Minimalist (`6927ee0`):**
- Loại bỏ ALL fancy animations: cubic-bezier, scale-[0.995], stagger delays, gold line grow, duration-400+
- Tất cả transitions ≤200ms ease-out
- `useSmartScrollState.ts`: giản lược từ 138→70 lines, 5 mechanisms→2 (hysteresis + state lock)
- Removed stagger CSS classes từ globals.css và tailwind.css
- 10 files updated

**Hide Entire Filter Bar on Scroll (`36794e0`, `d5a11ac`):**
- 3 screens (BudgetAllocate, OTBAnalysis, SKUProposal): ẩn TOÀN BỘ filter bar khi cuộn xuống
- Removed collapsed summary bars (badges, stats) — chỉ show/hide toàn bộ
- Pattern: `-translate-y-full opacity-0 pointer-events-none` khi collapsed

**Zero-Lag Filter Bar — Bypass React Re-render (`898e72e`, `1adf915`):**
- **Root cause**: `setBarState()` triggered full React re-render (100+ SKU cards = ~1s lag)
- **Fix**: `useSmartScrollState` returns `barRef` instead of React state
- Scroll handler toggles `el.hidden` directly — pure DOM manipulation, zero re-render
- Removed RAF batching, reduced lock 300→100ms→80ms, tightened thresholds 20/60→10/40px
- All 3 screens use `barRef` + instant `hidden` class

**Remove Sticky Image Row (`6f57c07`, `72b9386`):**
- Sticky image row (top:0, z:20) tạo 80px dark blank band trên SKU row khi scroll
- Removed sticky behavior + tất cả supporting code (MutationObserver, ResizeObserver, stickyImageTopRef)
- Image row giờ scroll bình thường cùng table
- -36 lines code deleted

### useSmartScrollState Architecture (Final)
```ts
// Hook returns barRef (not React state) — zero re-renders
export function useSmartScrollState() {
  const barRef = useRef<HTMLDivElement>(null);
  // Scroll handler: el.hidden = true/false (direct DOM)
  // Hysteresis: show at <10px, hide at >40px
  // Lock: 80ms after each toggle
  return { barRef, handleBarClick };
}
// Usage: <div ref={barRef} ...> — no className for collapsed state
```

### Files chinh (14 files)
```
src/hooks/useSmartScrollState.ts                      # Complete rewrite: DOM-direct, no React state
src/features/tickets/components/TicketDetailPage.tsx   # Flip card, duration-200
src/features/otb/components/SKUProposalScreen.tsx      # Zero-lag filter, remove sticky image
src/features/otb/components/OTBAnalysisScreen.tsx      # Zero-lag filter bar
src/features/otb/components/BudgetAllocateScreen.tsx   # Zero-lag filter bar
src/components/ui/ExpandableStatCard.tsx               # duration-200
src/components/ui/KPIDetailModal.tsx                   # duration-200
src/components/mobile/MobileCard.tsx                   # duration-200
src/app/globals.css                                    # Remove stagger classes
src/styles/tailwind.css                                # Remove stagger classes
```

---

## SESSION 12/02/2026 - Session 21 (Filter Bar Redesign + Fashion SVGs + Smart Auto-expand)

### Thay doi chinh

**Filter Bar Redesign across all screens (`60f9b56` — 5 files, +408/-516 lines):**
- All filter bars: sticky flat toolbar with `backdrop-blur`, no card/rounded/shadow
- Removed "Bo loc" header text, Filter icon, and "Xoa tat ca bo loc" text
- Clear button: icon-only X with red hover and title tooltip
- Removed filter labels above dropdowns (content visible in dropdown itself)
- Auto-sizing: `shrink-0` for small filters, `flex-1 min-w-0` for flexible ones
- Dropdown panels: `whitespace-nowrap w-max min-w-full` for content priority
- SKUProposalScreen: merged version/sizing/view-mode into single compact row
- OTBAnalysisScreen: separated budget context card from sticky filter bar, fixed dual-sticky overlap
- Font consistency: `text-xs`, icon size 12px, compact padding throughout

**Fashion Product SVGs (`b26971a`, `d9ed55f`, `7a14e72`):**
- Increased dropdown/control heights, thin borders, aligned filters
- Added fashion product SVG images (inline SVG components) for SKU cards
- Upgraded to 3D realistic fashion SVGs with transparent backgrounds
- More product SVG types added for Order/Receipt Confirmation
- Order/Receipt Confirmation filter redesign

**Render Cold-Start Login Timeout (`3b44a2d`):**
- Increased global API timeout from 30s to 60s for Render free-tier
- Login uses 120s timeout with up to 2 auto-retries on timeout/network errors
- Shows "May chu dang khoi dong..." status while retrying cold starts
- Better Vietnamese error messages for timeout vs credential errors

**Sticky Rail Controls + Popup 3D Blur (`17bad38`):**
- Rail Controls bar moved into sticky filter bar (no scroll needed)
- Rail Controls: `justify-between`, full-width aligned with filter dropdowns
- Add new SKU button: removed border and hover bg, moved outside scroll container
- OTB Analysis: removed tab scrollbar, removed hint banner, increased header height
- SKU Lightbox: removed dark overlay, added `backdrop-blur-md` + 3D `box-shadow`, uses `createPortal` for full-screen blur

**Smart Auto Expand/Collapse Filter Bar (`5b428a9`, `7b37e6b`):**
- Sticky filter bars auto-collapse when scrolling down (>50px) and auto-expand on scroll to top
- Uses rAF-throttled scroll detection on `#main-scroll` container
- `ignoreScroll` ref prevents click-expand from being overridden by phantom scroll events
- SKUProposalScreen: collapsed bar shows budget/version/choice badges
- BudgetAllocateScreen: collapsed bar shows FY/budget/brand/FINAL badges
- OTBAnalysisScreen: collapsed bar shows FY/budget count/comparison badges
- Smooth CSS `grid-template-rows` animation (0fr ↔ 1fr) for expand/collapse
- Backend: added `localhost:3003` to CORS origins

**Other fixes:**
- Eliminated 24px gap between AppHeader and sticky toolbar on confirmation screens (`0471d7c`)
- Truncate long text in filter dropdown buttons with `text-ellipsis overflow-hidden` (`9fa681a`)

### Files chinh (14 files, +1996/-1333 lines)
```
src/features/otb/components/SKUProposalScreen.tsx       # filter bar, rail controls, auto-expand, fashion SVGs
src/features/orders/components/OrderConfirmationScreen.tsx  # filter redesign, product SVGs, gap fix
src/features/otb/components/OTBAnalysisScreen.tsx       # filter bar, auto-expand, dual-sticky fix
src/features/otb/components/BudgetAllocateScreen.tsx    # filter bar, auto-expand
src/features/otb/components/PlanningDetailPage.tsx      # filter bar redesign
src/features/otb/components/BudgetManagementScreen.tsx  # sticky flat toolbar
src/features/orders/components/ReceiptConfirmationScreen.tsx  # filter redesign, product SVGs
src/features/approvals/components/ApprovalWorkflowScreen.tsx  # filter update
src/screens/LoginScreen.tsx                             # cold-start retry UI
src/services/api.ts                                     # 60s timeout
src/services/authService.ts                             # 120s login timeout, retry logic
src/contexts/AuthContext.tsx                            # cache clear on logout
src/app/(dashboard)/layout.tsx                          # layout adjustment
backend/src/main.ts                                     # CORS localhost:3003
```

---

## SESSION 12/02/2026 - Session 20 (SKU Proposal Excel Redesign + Table Polish)

### Thay doi chinh

**SKU Proposal Table Excel Redesign (`d72167f`, `d77a7d4`, `a9d434c`):**
- Redesigned SKU Proposal table to match W25 L-ERP_proposal.xlsx Excel format
- Added all columns from Excel reference: Image, SKU, Name, Collection, Color, Color Code, Division (L2), Product Type (L3), Dept/Group (L4), FSR, Carry Forward, Composition, Unit Cost, Freight+Ins (3%), Others Tax (2%), Import Tax %, Tax Value, Landed Cost, Landed Cost VND, SRP, Wholesale, R.R.P, Regional RRP, Theme, Total Price, Total Units, Size, plus dynamic store columns
- Tax fields auto-calculated from unit cost (Freight 3%, Others 2%)
- Transposed table to Rail-based format (rows = attributes, columns = SKUs)
- Added subtle grid lines (row + column borders) to transposed SKU table

**Excel-Style Table Interactions (`b0548ad`, `37ddd8f`, `d101bf5`):**
- Click row label to highlight entire row (Excel-style active row)
- Differentiated total/summary rows from editable rows in BudgetAllocateScreen (different bg color)
- Fixed opaque background on Order/TTL sticky cells to prevent scroll bleed-through

**OTB Analysis Polish (`9d252ed`, `e636f39`, `541d4ee`):**
- Added missing OTB Analysis i18n keys + "So mua" (Season Count) dropdown
- Increased spacing on OTB Analysis tabs and hint bar
- Reduced Female/Male gender label font size to ~90% (`text-[0.9em]`)

**Production Cleanup (`8fdd49b`):**
- Removed all `console.log` debug statements
- Fixed SSR safety (localStorage guard)
- Removed dead/unused code

### Files chinh (13 files, +514/-219 lines)
```
src/features/otb/components/SKUProposalScreen.tsx       # Excel redesign, transpose, grid lines
src/features/otb/components/OTBAnalysisScreen.tsx       # i18n, spacing, font size
src/features/otb/components/BudgetAllocateScreen.tsx    # summary row differentiation
src/components/layout/AppHeader.tsx                     # cleanup
src/services/authService.ts                             # SSR safety
src/services/masterDataService.ts                       # cleanup
src/locales/en.ts                                       # OTB Analysis i18n keys
src/locales/vi.ts                                       # OTB Analysis i18n keys
```

---

## SESSION 11/02/2026 - Session 19 (Layout/Logic + QA + Dynamic Stores)

### Thay doi chinh

**4 Layout/Logic Tasks (`4545b84` — 8 files, +1078/-353 lines):**
1. **BudgetManagementScreen:** Removed Group Brand & Brand columns/filters/popup fields — simplified to core budget fields only
2. **OTBAnalysisScreen:** Added Year/Type/BudgetSeason multi-select filters with side panel + comparison table
3. **SKUProposalScreen:** Redesigned to Rail-based layout with subtotals and grand total rows
4. **ApprovalsScreen:** Built `VersionDiffModal` (423 lines) — compares planning versions with highlighted changes (added/removed/modified fields)

**6 QA Issues (`0ada401` — 5 files, +128/-41 lines):**
1. **TicketScreen:** Added search box filtering by name/brand/status/type
2. **TicketDetailPage:** Added SIZE field in details grid (`sizing.sizes`)
3. **OrderConfirmationScreen:** Store x Size x Qty allocation grid replaces simple table
4. **OTBAnalysisScreen:** Reduced gender row font size (`text-sm md:text-base`)
5. **OTBAnalysisScreen:** Auto-select first budget on page load
6. **SKUProposalScreen:** Case-insensitive `productType` match fixes "No SKU data" bug

**Production Login Fix (`5dac096`):**
- Login page: show branded loading spinner instead of returning `null` (was causing black screen while auth state initializes)
- `api.ts`: guard localStorage for SSR, clear cache on refresh failure, prevent redirect loop by checking current path
- AuthContext: clear API cache on logout to prevent stale data
- Note: `NEXT_PUBLIC_API_URL` must be set on Render Dashboard

**Other Fixes:**
- Removed sticky filter card on Budget Allocate screen (`cf22ce5`)
- Dynamic store columns in SKU Proposal table — columns auto-generated from API stores instead of hardcoded REX/TTP (`afcedee`)
- Dynamic store columns on BudgetAllocateScreen + updated STORES constant (`de32c80`)

### Files chinh
```
src/features/otb/components/BudgetManagementScreen.tsx  # removed GroupBrand/Brand
src/features/otb/components/OTBAnalysisScreen.tsx       # multi-select filters, comparison, auto-select, font fix
src/features/otb/components/SKUProposalScreen.tsx       # Rail layout, dynamic stores, case-insensitive match
src/features/otb/components/BudgetAllocateScreen.tsx    # dynamic stores, remove sticky filter
src/features/approvals/components/VersionDiffModal.tsx  # NEW: 423-line version diff modal
src/features/approvals/components/ApprovalsScreen.tsx   # VersionDiff integration
src/features/orders/components/OrderConfirmationScreen.tsx  # Store×Size×Qty grid
src/features/tickets/components/TicketScreen.tsx        # search box
src/features/tickets/components/TicketDetailPage.tsx    # SIZE field
src/contexts/AppContext.tsx                             # removed sharedGroupBrand/sharedBrand
src/services/api.ts                                     # SSR guard, cache clear, redirect fix
src/services/authService.ts                             # loading spinner
src/screens/LoginScreen.tsx                             # branded loading spinner
src/utils/constants.ts                                  # STORES update
```

---

## SESSION 11/02/2026 - Session 18 (Customer Feedback Fixes)

### Thay doi chinh

**OTB Analysis + SKU Proposal editable orders (`3102552`):**
- OTB Analysis filter panel: removed `sticky top-0` and `z-[100]` — changed to static `z-[20]`
- SKU Proposal: removed redundant Rex/TTP/Order/Total Value summary grid
- SKU Proposal: ORDER column in Store Order table made editable with inline `<input>` fields for REX/TTP quantities

**3 Customer Issues (`2f55d23`):**
1. **BudgetManagementScreen:** Removed Season Group and Season fields from Create Budget popup per customer request
2. **SKUProposalScreen:** Fixed gender filter — was using database UUID (`skuContext.gender.id`) but needed to use name string (`skuContext.gender.name.toLowerCase()`); also added logic to build SKU blocks from catalog when no proposals exist for the selected subcategory
3. **TicketDetailPage:** Gender chart was empty for budget/planning tickets — now shows `MOCK_GENDER_DATA` fallback

### Files chinh
```
src/features/otb/components/OTBAnalysisScreen.tsx      # remove sticky filter panel
src/features/otb/components/SKUProposalScreen.tsx       # remove summary grid, editable store orders, gender filter fix, auto-build blocks from catalog
src/features/otb/components/BudgetManagementScreen.tsx  # remove Season Group/Season fields from Create Budget
src/features/tickets/components/TicketDetailPage.tsx    # gender chart fallback data
```

---

## SESSION 11/02/2026 - Session 17 (Compact UI + Login V2 + QA Polish)

### Thay doi chinh

**Compact UI overhaul (`35dd88a` — 19 files, +464/-266 lines):**
- Buttons across entire app compacted: `py-3` to `py-2`, `py-2.5` to `py-1.5`
- AppHeader KPI stepper bar reduced padding
- BudgetModal, PlanningDetailModal, ApprovalWorkflow buttons compacted
- All dropdown selects compacted in BudgetAllocate/OTBAnalysis
- Removed Category Breakdown table from Budget Allocation page
- Changed "Latest" to "Final" in version badges (both EN and VI locales)
- Replaced all `Math.random()` with fixed demo data for consistent display
- Enriched Order/Receipt DEMO_SKUS from 5 to 8 products
- API store fetching filtered to REX/TTP only (`useBudget`, `BudgetMgmt`, `ProposalDetail`)

**Login Page V2 Redesign (`35dd88a`):**
- Light theme with glassmorphism card
- Fashion icon SVGs, Cormorant Garamond font
- Vietnamese tagline, decorative floating elements

**QA Polish (`2e51ccd` — 26 files, +1117/-932 lines):**
- Separated `viewport` from `metadata` export in `layout.tsx` (fixes Next.js 16 warnings)
- Added missing i18n keys: `analytics.*`, `header.notifications`
- Replaced CSS `scroll-behavior` with `data-scroll-behavior` attribute
- Skipped non-existent API endpoints (`/approvals/pending`, `/orders`, `/master/sub-categories`) to eliminate 404s
- Fixed approval names: budgets now show `budgetCode + groupBrand.name` instead of raw CUID
- Added comprehensive Ticket Detail mockup data (collection/gender charts, 4 SKU blocks, dynamic sizing tables)
- Fixed `min-height: 44px` global override — wrapped in mobile-only `@media (max-width: 767px)` query
- Increased sidebar spacing after compact fix
- Backend `seed.ts`: admin user name changed to "Admin"

**Login Logo Fix (`0a3323f`):**
- Changed `lerp-logo-full.png` to already-tracked `lerp-logo.png` (was missing on deployment)

**Workflow Bar + SKU Header Polish (`10d39fc`):**
- AppHeader KPI bar: increased spacing (py, gap, connector width)
- Mobile KPI bar: icon-only mode with count badge, no text labels (uses `useIsMobile` hook)
- TicketDetailPage SKU block header: navy blue gradient → brand gold gradient

### Files chinh (30+ files)
```
src/app/layout.tsx                          # Cormorant Garamond font, viewport export
src/app/globals.css                         # compact button/input heights, mobile-only min-height
src/screens/LoginScreen.tsx                 # V2 redesign, logo fix
src/components/layout/AppHeader.tsx         # compact KPI bar, mobile icon-only mode
src/components/layout/Sidebar.tsx           # spacing adjustments
src/components/ui/BudgetModal.tsx           # compact buttons
src/components/ui/PlanningDetailModal.tsx   # compact buttons
src/contexts/AppContext.tsx                 # KPI defaults (no zeros)
src/features/otb/components/*.tsx           # compact selects, REX/TTP only store filter
src/features/tickets/components/*.tsx       # realistic default data, gold header
src/features/approvals/components/*.tsx     # approval name display fix
src/features/orders/components/*.tsx        # enriched DEMO_SKUS
src/services/approvalService.ts            # skip non-existent API endpoints
src/services/masterDataService.ts          # skip non-existent API endpoints
src/locales/en.ts                          # "Final", analytics keys, notifications
src/locales/vi.ts                          # "Final", analytics keys, notifications
src/styles/mobile-design-system.css        # mobile-only adjustments
backend/prisma/seed.ts                     # admin user name fix
```

---

## SESSION 11/02/2026 - Session 16 (Build Fix + OTB Terminology + Order/Receipt Detail)

### Thay doi chinh

**Build & CSS Fix:**
- `tailwind.config.js` content paths only scanned `.{js,jsx}` after TS migration — added `.{ts,tsx}` to fix all pages rendering unstyled (`1193ba0`)

**Sidebar & Layout:**
- Compact sidebar spacing: group padding `pt-2` to `pt-1`, divider `py-1.5` to `py-0.5` (`f8509c6`)
- Fixed header scrolling with page — changed root layout to `h-screen overflow-hidden`, added `shrink-0` to AppHeader, only content area scrolls (`9115099`)

**Budget Allocation:**
- **Bug fix:** Filters showed values but table was empty — `selectedGroupBrand` was a name string but `groupBrandList` uses API UUIDs; added matching by both ID and name (`3315c9b`)
- Renamed action button "Phan tich OTB" to "Phan bo OTB" with new i18n key (`010f215`)

**OTB Analysis (Phan bo OTB):**
- Full terminology change: "Phan tich" → "Phan bo" across sidebar, header, title, action buttons; EN: "OTB Analysis" → "OTB Allocation" (`4c9d808`)
- Tab order changed to Category | Collection | Gender (Category is default); added demo %Buy/%Sales/%ST data (`fa2f267`)
- Fixed semi-transparent header letting table content bleed through on scroll (`4691e88`)
- **Gender tab:** Populated with reference data (Female REX/TTP, Male REX/TTP) with realistic Buy%, Sales%, ST%, OTB values (`d60bbaa`)
- **Collection tab:** Populated Carry Over and Seasonal rows with REX/TTP reference data (`d60bbaa`)

**SKU Card Changes:**
- Removed redundant 4-cell summary grid (Rex/TTP/Order/Total Value) from SKU cards (`ba97662`)
- Store Order section defaults to open (`storeOrderOpen = true`) (`ba97662`)
- ORDER column in Store Order table now editable with click-to-edit qty (`ba97662`)

**Order/Receipt Screens:**
- Added expandable detail rows with SKU list, store allocation, sizing table, product details (`376743f`)
- Receipt screen added Ordered/Received tracking with discrepancy indicator (`376743f`)
- 5 DEMO_SKUs with full sizing data for when API has no products (`376743f`)

### Files chinh
```
tailwind.config.js                                       # ts/tsx content paths
src/components/layout/Sidebar.tsx                        # compact spacing, terminology
src/components/layout/AppHeader.tsx                      # header shrink-0
src/app/(dashboard)/layout.tsx                           # h-screen overflow-hidden
src/features/otb/components/BudgetAllocateScreen.tsx     # filter matching fix, terminology
src/features/otb/components/OTBAnalysisScreen.tsx        # terminology, tab order, demo data, header bg, Gender/Collection data
src/features/otb/components/SKUProposalScreen.tsx        # remove summary grid, Store Order default open, editable ORDER
src/features/orders/components/OrderConfirmationScreen.tsx    # expandable detail + SKU + sizing
src/features/orders/components/ReceiptConfirmationScreen.tsx  # expandable detail + Ordered/Received tracking
src/locales/en.ts                                        # "OTB Allocation", "Allocate SKU"
src/locales/vi.ts                                        # "Phan bo OTB", "Phan bo SKU"
```

---

## SESSION 11/02/2026 - Session 15 (Mobile UI 2.0 Screen Integration)

### Thay doi chinh
Applied Mobile UI 2.0 components to all 9 target screens:

1. **HomeScreen** — Added FilterChips, FilterBottomSheet, PullToRefresh for mobile filters
2. **TicketScreen** — Replaced MobileDataCard → MobileList + PullToRefresh + FilterChips + FloatingActionButton + FilterBottomSheet
3. **ApprovalsScreen** — Replaced MobileDataCard/MobileFilterSheet → MobileList + PullToRefresh + FilterBottomSheet
4. **MasterDataScreen** — Replaced MobileDataCard/MobileFilterSheet → MobileList + MobileSearchBar + PullToRefresh + FilterBottomSheet
5. **BudgetManagementScreen** — Replaced MobileDataCard/MobileFilterSheet → MobileList + PullToRefresh + FilterChips + FloatingActionButton + FilterBottomSheet
6. **BudgetAllocateScreen** — Replaced MobileFilterSheet → FilterBottomSheet + useBottomSheet hook
7. **OTBAnalysisScreen** — Replaced MobileFilterSheet → FilterBottomSheet + useBottomSheet hook
8. **SKUProposalScreen** — Replaced MobileFilterSheet import → FilterBottomSheet (added missing bottom sheet)
9. **TicketDetailPage** — No mobile components to replace (uses isMobile for layout only)

### Pattern Applied
- `showMobileFilters` state → `useBottomSheet()` hook (`{ isOpen, open, close }`)
- `MobileFilterSheet` → `FilterBottomSheet` (with `filters`, `values`, `onChange`, `onApply`, `onReset` props)
- `MobileDataCard` loop → `MobileList` with `MobileListItemData[]` items (expandable, status variant)
- `PullToRefresh` wrapper around mobile list (requires standalone async fetch function)
- `FilterChips` for quick filter display on mobile
- `FloatingActionButton` for create actions (with `onClick` not `onPress`)

### Build & Test Status
- **BUILD OK** — 21 routes, 0 errors
- **TESTS OK** — 114 tests passed

---

## SESSION 11/02/2026 - Session 14 (TypeScript Migration + Mobile + Import)

### Thay doi chinh

1. **Full TypeScript Migration (.jsx/.js → .tsx/.ts)**
   - Tat ca 116 files `.jsx`/`.js` → `.tsx`/`.ts` (strict mode)
   - 50+ TypeScript interfaces trong `src/types/index.ts` (ApiResponse, User, Budget, Planning, Proposal, Approval, Ticket, masterData types, UI types, event handler types, utility types)
   - Contexts typed: `AuthContextType`, `AppContextType`, `AuthUser`
   - Services dung `any` cho flexibility, nhung co typed response patterns
   - tsconfig.json: strict=true, path alias `@/*`, vitest/globals types

2. **Feature-Based Architecture**
   - Screens to chuc theo domain trong `src/features/`:
     - `otb/` — Budget, Planning, Proposal, OTB Analysis (6 components + 3 hooks)
     - `tickets/` — TicketScreen, TicketDetailPage, TicketKanbanBoard
     - `approvals/` — ApprovalsScreen, ApprovalWorkflowScreen
     - `orders/` — OrderConfirmation, ReceiptConfirmation
     - `master-data/` — MasterDataScreen
     - `import/` — ImportDataScreen (NEW)
   - `src/screens/*.tsx` giu lai lam re-export wrappers (backward compat)
   - Pattern: `export { default } from '../features/otb/components/BudgetManagementScreen'`

3. **Mobile-First Components (6 new components)**
   - `BottomSheet.tsx` — Draggable modal (framer-motion, snap: quarter/half/full)
   - `MobileDataCard.tsx` — Card cho mobile data display (status badges, metrics, actions)
   - `MobileFilterSheet.tsx` — Filter panel slide-up (text/select/range/date/checkbox)
   - `MobileTableView.tsx` — Smart responsive wrapper (desktop table ↔ mobile cards)
   - `SwipeAction.tsx` — Swipe approve/reject gesture (80px threshold, framer-motion)
   - `MobileBottomNav.tsx` — Bottom navigation (4 primary tabs + 12 "More" items)
   - `useIsMobile.ts` hook — Breakpoints: mobile <768px, tablet 768-1023px, desktop ≥1024px

4. **Import Data Feature (NEW)**
   - `ImportDataScreen.tsx` — 3 tabs: Upload | Data | Stats
   - Drag-drop file uploader (CSV/TSV/Excel) with progress bar
   - `importService.ts` — 7 API endpoints (batch, query, stats, delete, clear)
   - `useDataImport.ts` hook — File parsing, batch processing (500/batch), abort control
   - 9 import targets: products, otb_budget, wssi, size_profiles, forecasts, clearance, kpi_targets, suppliers, categories
   - Duplicate handling: skip/overwrite/merge
   - Route: `/import-data`

5. **Testing Framework (Vitest) — 114 tests**
   - `vitest.config.ts` — jsdom environment, globals, V8 coverage, path alias
   - `src/test/setup.tsx` — Mocks: Next.js router/image, localStorage, matchMedia, ResizeObserver, IntersectionObserver, fetch
   - `src/test/utils.tsx` — Mock factories: mockUser, mockBudget, mockGroupBrand, mockStore, mockBudgetDetail, mockPlanningVersion, mockPlanningDetail, mockProposal, mockTicket, mockAuthResponse + fetch helpers + custom render
   - **Auth tests** (24): Login, logout, token refresh, getCurrentUser, token storage, token validation (JWT exp), role-based access, email/password validation
   - **Budget tests** (42): Allocation calculation, committed %, remaining budget, detail totals, season mix, API CRUD, filters (year/brand/status/search), validation
   - **Planning tests** (37): Version ordering (V0→FINAL), fetch/create/finalize versions, planning details CRUD, bulk update, percentage/collection/gender/category allocation, version comparison, budget constraints, completeness check
   - **Utils tests** (11): formatCurrency, generateSeasons, getScreenIdFromPathname
   - `package.json`: `"test": "vitest"`, `"test:run": "vitest run"`, `"test:coverage": "vitest run --coverage"`

6. **Layout Directory Rename**
   - `src/components/Layout/` → `src/components/layout/` (lowercase, consistent conventions)
   - `src/components/Common/` → merged into `src/components/ui/`

7. **New Dependencies**
   - `framer-motion` 12.34.0 — Animations (BottomSheet, SwipeAction, MobileBottomNav)
   - `@tanstack/react-virtual` 3.13.18 — Virtual scrolling
   - `xlsx` 0.18.5 — Excel file parsing
   - `react-is` 19.2.4 — React utilities
   - `typescript` 5.9.3 — TypeScript compiler
   - `vitest` 4.0.18 + `happy-dom` 20.6.0 + `@testing-library/*` — Testing
   - `@types/node`, `@types/react`, `@types/react-dom` — Type definitions

8. **API Service Enhancement**
   - `api.ts`: Added GET request caching (1-minute TTL) for performance

9. **Mobile UI 2.0 Revolution (NEW — ready for screen integration)**
   - `src/components/mobile/` — 6 component files + barrel index
   - **MobileCard** — Avatar, badges, progress bar, metrics grid, action footer
   - **MobileList** — Table replacement with expandable rows, skeleton loading
   - **BottomSheet** — Draggable portal-based sheet + **FilterBottomSheet** compound
   - **PullToRefresh** — Native pull gesture with resistance physics
   - **FilterChips** — Horizontal chips + **FloatingActionButton** + **MobileSearchBar**
   - `src/hooks/useMobile.ts` — 6 hooks: useIsMobile(v2), useSwipe, useBottomSheet, useScrollLock, usePullToRefresh, useHaptic
   - `src/styles/mobile-design-system.css` — CSS variables (spacing, touch targets, typography, radius, shadows, z-index), touch targets ≥44px, safe-area padding, skeleton loading, FAB, sticky headers, swipe actions
   - CSS imported in `src/app/layout.tsx`
   - **NOTE:** Coexists with V1 mobile components in `src/components/ui/` — screens to be individually migrated per TASK-MOBILE-UI-REVOLUTION.md checklist
   - **IMPORTANT:** V1 `useIsMobile()` returns `{isMobile, isTablet, isDesktop}` object — V2 returns `boolean`. Do NOT replace V1 in existing screens without updating destructuring.

### Build & Test Status
- **BUILD OK** — 21 routes (17 static + 4 dynamic), 0 errors
- **TESTS OK** — 5 test files, 114 tests passed (1.03s)
- Fixes applied:
  - AppContext `kpiData` type annotation
  - `Season` interface export
  - `setup.ts` → `setup.tsx` (JSX in setup file)
  - Generic arrow functions `<T>` → `<T,>` in utils.tsx (TSX disambiguation)
  - Auth test: unconsumed mock leaking between describe blocks
- **CHUA COMMIT** — Tat ca changes dang o working directory
- Migration backup tai: `.migration-backup/src_20260211_022022/`

### Files da thay doi (245 files)
```
# Deleted (116 .jsx/.js files)
src/**/*.jsx → deleted
src/**/*.js → deleted

# Added (129 .tsx/.ts files)
src/**/*.tsx                              # All components migrated
src/**/*.ts                               # All services/hooks/utils migrated
src/types/index.ts                        # 50+ TypeScript interfaces
src/features/*/                           # Feature-based architecture
src/components/ui/BottomSheet.tsx          # Mobile: draggable bottom sheet
src/components/ui/MobileDataCard.tsx       # Mobile: data card
src/components/ui/MobileFilterSheet.tsx    # Mobile: filter panel
src/components/ui/MobileTableView.tsx      # Mobile: responsive table/card
src/components/ui/SwipeAction.tsx          # Mobile: swipe gesture
src/components/layout/MobileBottomNav.tsx  # Mobile: bottom navigation
src/hooks/useIsMobile.ts                  # Mobile: breakpoint hook
src/hooks/useDataImport.ts               # Import: file parsing hook
src/services/importService.ts             # Import: API service
src/features/import/                      # Import: feature module
src/app/(dashboard)/import-data/page.tsx  # Import: route page
src/utils/formatters.test.ts              # Test: formatters (7 tests)
src/utils/routeMap.test.ts               # Test: route mapping (4 tests)
src/features/auth/__tests__/auth.test.ts # Test: auth (24 tests)
src/features/budget/__tests__/budget.test.ts   # Test: budget (42 tests)
src/features/planning/__tests__/planning.test.ts # Test: planning (37 tests)
src/test/setup.tsx                       # Test: mocks & setup
src/test/utils.tsx                       # Test: mock factories & helpers
vitest.config.ts                         # Test: config (jsdom, v8 coverage)
TASK-CRITICAL-PATH-TESTING.md            # Testing task guide
TASK-TYPESCRIPT-MIGRATION.md             # TS migration task guide
COMMON-FIXES.md                          # TS common error fixes guide
TASK-MOBILE-UI-REVOLUTION.md             # Mobile UI 2.0 task guide

# Mobile UI 2.0 Revolution (NEW)
src/components/mobile/MobileCard.tsx     # Card: avatar, badges, progress, metrics
src/components/mobile/MobileList.tsx     # List: expandable rows, skeleton
src/components/mobile/BottomSheet.tsx    # Draggable sheet + FilterBottomSheet
src/components/mobile/PullToRefresh.tsx  # Pull-to-refresh gesture
src/components/mobile/FilterChips.tsx    # Chips + FAB + SearchBar
src/components/mobile/index.ts          # Barrel exports
src/hooks/useMobile.ts                  # 6 hooks: useIsMobile(v2), useSwipe, useBottomSheet, useScrollLock, usePullToRefresh, useHaptic
src/styles/mobile-design-system.css     # Mobile CSS design system

# Modified
package.json                              # +7 new dependencies, +test script
package-lock.json                         # Updated
tsconfig.json                             # strict mode, vitest types, path alias
tailwind.config.js                        # Updated
src/app/globals.css                       # Updated styles
src/app/layout.tsx                        # +mobile-design-system.css import
```

---

## SESSION 10/02/2026 - Session 11

### Thay doi chinh: QA Bug Fixes (6 bugs tu customer feedback)

1. **BUG-001: User Menu z-index (HIGH)**
   - Root cause: Sidebar container thieu `z-index`, user menu popup bi de duoi main content
   - Fix: Them `z-40` vao Sidebar container div
   - File: `src/components/Layout/Sidebar.jsx`

2. **BUG-002: Budget Allocation khong hien data (CRITICAL)**
   - Root cause: `GROUP_BRAND_CATEGORIES` hardcode IDs 'A','B','C' nhung API tra ve numeric/UUID groupBrandId
   - Fix: Fetch group brands tu API dynamically, bo hardcoded GROUP_BRAND_CATEGORIES
   - Them state `groupBrandList` + fetch tu `masterDataService.getBrands()`
   - `displayGroups` gio dung `groupBrandList` thay vi hardcoded array
   - File: `src/screens/BudgetAllocateScreen.jsx`

3. **BUG-003: Budget name hien "Untitled" (CRITICAL)**
   - Root cause: SKUProposalScreen dung `budget.name || budget.budgetName` nhung backend tra ve `budgetCode`
   - Fix: Them `budget.budgetCode` lam field dau tien trong mapping
   - File: `src/screens/SKUProposalScreen.jsx`

4. **BUG-004: SKU data khong load (HIGH)**
   - Root cause: `skuBlocks` chi populate tu proposals; neu chua co proposal thi empty
   - Fix: Fetch master data (genders, categories) tu API de populate filter options
   - Them `masterGenders`, `masterCategories` state + fetch tu masterDataService
   - File: `src/screens/SKUProposalScreen.jsx`

5. **BUG-005: Global Search khong hoat dong (MEDIUM)**
   - Root cause: Search input chi la UI shell, chua co handler
   - Fix: Them `searchQuery` state + `searchResults` memo filter SCREEN_CONFIG
   - Search results hien danh sach screens match, click de navigate
   - Ho tro Enter de navigate ket qua dau tien, ESC de dong
   - File: `src/components/Layout/AppHeader.jsx`

6. **BUG-006: Gender dropdown trong (HIGH)**
   - Root cause: `genderOptions` derived tu empty `skuBlocks` thay vi master data
   - Fix: Merge genders tu `skuBlocks` + `masterGenders` (tu API /master/genders)
   - Tuong tu cho categoryOptions va subCategoryOptions
   - File: `src/screens/SKUProposalScreen.jsx`

### Build Verification
- 17 static + 3 dynamic routes (20 total), 0 errors
- postbuild copy assets thanh cong

### Files da cap nhat (4 files)
```
# Modified files
src/components/Layout/Sidebar.jsx         # z-40 cho sidebar container (BUG-001)
src/screens/BudgetAllocateScreen.jsx      # Dynamic group brands tu API (BUG-002)
src/screens/SKUProposalScreen.jsx         # budgetCode mapping + master data filters (BUG-003,004,006)
src/components/Layout/AppHeader.jsx       # Implement search logic (BUG-005)
```

---

## SESSION 09/02/2026 - Session 10

### Thay doi chinh

1. **Node 22/24 Compatibility Fix**
   - `next.config.mjs`: Xoa `eslint`, `typescript`, `experimental` keys (deprecated Next.js 15)
   - Them `transpilePackages: []` va `logging.fetches.fullUrl` cho Node 22/24
   - Xoa `env.NEXT_PUBLIC_API_URL` (Next.js tu dong expose NEXT_PUBLIC_* vars)

2. **Standalone Server (thay the custom server.js)**
   - Xoa `server.js` — khong tuong thich voi `output: 'standalone'`
   - `npm run start` → `node .next/standalone/server.js` (built-in server)
   - `npm run start:azure` → `node azure-startup.js` (Azure wrapper)

3. **Cross-platform Scripts (thay the bash)**
   - Xoa `postbuild.sh`, `startup.sh` (bash — khong cross-platform)
   - `scripts/copy-assets.js` — Node.js script copy public/ va .next/static/ vao standalone
   - `azure-startup.js` — Azure startup: copy assets + spawn standalone server
   - `package.json`: `postbuild: node scripts/copy-assets.js` (tu dong chay sau build)

4. **Engine & Config Updates**
   - `engines.node`: `>=18.0.0 <25.0.0` → `>=20.0.0`
   - `.nvmrc`: `20` → `22`
   - `.npmrc`: Them `fetch-retries`, `fetch-retry-mintimeout`, `fetch-retry-maxtimeout`
   - `version`: `0.1.0` → `1.0.0`

### Build Verification
- 17 static + 3 dynamic routes (20 total), compiled 3.6s, 0 errors
- Standalone server: Ready in 54ms, HTTP 200 confirmed
- postbuild auto-copies public/ va .next/static/

### Azure Portal Configuration (UPDATED)
```
Frontend App Service:
  Stack: Node 22 LTS (hoac 24)        ← THAY DOI (khong dung Node 20)
  Startup Command: node .next/standalone/server.js
  PORT = 8080
  WEBSITES_PORT = 8080
  NODE_ENV = production
  NEXT_PUBLIC_API_URL = https://[backend-url]/api/v1
```

### Files da tao/cap nhat (9 files)
```
# New files
scripts/copy-assets.js                    # Cross-platform asset copy (Node.js)
azure-startup.js                          # Azure startup wrapper

# Modified files
next.config.mjs                           # Remove deprecated keys, add transpilePackages/logging
package.json                              # New scripts, engines >=20.0.0, version 1.0.0
package-lock.json                         # Updated
.nvmrc                                    # 20 → 22
.npmrc                                    # Added retry settings

# Deleted files
server.js                                 # Custom server (replaced by standalone)
postbuild.sh                              # Bash script (replaced by scripts/copy-assets.js)
startup.sh                                # Bash script (replaced by azure-startup.js)
```

---

## SESSION 09/02/2026 - Session 9

### Thay doi chinh

1. **Fix Frontend Azure Deployment (`sh: 1: next: not found`)**
   - `server.js`: Viet lai hoan toan — dung `next()` truc tiep thay vi require standalone
   - `package.json`: Scripts moi — `start: node server.js`, `start:standalone`, `start:next`, `postinstall`
   - `next.config.mjs`: Them `env.NEXT_PUBLIC_API_URL`, `experimental: {}`
   - `.npmrc`: Tao moi — `legacy-peer-deps=true`, `auto-install-peers=true`
   - `.env.production`: Tao moi — placeholder cho Azure

2. **Fix Backend Deployment (`Cannot find module '@nestjs/config'`)**
   - `package.json`: Them `@nestjs/config@^4.0.3`
   - `app.module.ts`: Them `ConfigModule.forRoot({ isGlobal: true })` lam import dau tien
   - `start:prod`: Fix path `node dist/main` → `node dist/src/main` (do tsconfig outDir)
   - `.npmrc`: Tao moi — `legacy-peer-deps=true` (fix swagger v11 peer dep conflict)

3. **Build Verification**
   - Frontend: 17 static + 3 dynamic routes, `.next/standalone/server.js` ton tai
   - Backend: Build thanh cong, `dist/src/main.js` ton tai

### Azure Portal Configuration (UPDATED)
```
Frontend App Service:
  Stack: Node 20 LTS
  Startup Command: node server.js        ← THAY DOI (khong dung bash startup.sh)
  PORT = 3000
  WEBSITES_PORT = 3000
  NODE_ENV = production
  NEXT_PUBLIC_API_URL = https://[backend-url]/api/v1

Backend App Service:
  Stack: Node 20 LTS
  Startup Command: node dist/src/main.js  ← THAY DOI (khong phai dist/main.js)
  PORT = 3000
  NODE_ENV = production
  DATABASE_URL = [postgresql-connection-string]
  JWT_SECRET = [your-secret]
  JWT_EXPIRES_IN = 7d
```

### Files da tao/cap nhat (8 files)
```
# New files
.npmrc                                    # npm config (legacy-peer-deps)
.env.production                           # Production env placeholder

# Modified files
server.js                                 # Rewritten: proper Next.js custom server
package.json                              # New scripts for Azure
next.config.mjs                           # Added env, experimental
backend/package.json                      # +@nestjs/config, fix start:prod path
backend/src/app.module.ts                 # +ConfigModule.forRoot()

# Also updated (standalone backend copy)
/Users/mac/otblerp/L-ERP-Backend/lerp-otb-backend/  # Same changes applied
```

---

## SESSION 08/02/2026 - Session 8

### Thay doi chinh

1. **100% Migration - 3 man hinh moi**
   - `ApprovalsScreen.jsx` - Phe duyet: bang, filter (entity type/level), approve/reject modal voi comment
   - `OrderConfirmationScreen.jsx` - Xac nhan don hang: KPI cards, bang PO, confirm/cancel workflow
   - `ReceiptConfirmationScreen.jsx` - Xac nhan bien nhan: KPI cards, bang receipt, flag discrepancy
   - 3 route pages: `/approvals`, `/order-confirmation`, `/receipt-confirmation`
   - routeMap.js: 3 entries moi (ROUTE_MAP + PATHNAME_TO_SCREEN)
   - i18n: 105+ translation keys moi (EN + VI) cho 3 man hinh

2. **Azure App Services Deployment Config**
   - `next.config.mjs`: `output: 'standalone'`, `images.unoptimized`, ignore TS/ESLint
   - `server.js`: Custom server cho Azure (port tu env, fallback logic)
   - `startup.sh`: Bash script copy static assets → start standalone server
   - `package.json`: `start:azure` script, `postbuild` copy assets, `engines: node >=18 <25`
   - `.nvmrc`: Node 20 LTS
   - `.env.example`: Huong dan cau hinh Azure

3. **Build & Infrastructure**
   - tsconfig.json: exclude `backend` directory fix build error
   - 20 routes total (17 static + 3 dynamic), 18 screens
   - Standalone build: `.next/standalone/server.js` + `public/` + `.next/static/`

4. **Backend Security Fix**
   - npm audit fix: 10 vulnerabilities → 0 vulnerabilities
   - @nestjs/cli: ^10.3.0 → ^11.0.16
   - @nestjs/swagger: ^7.2.0 → ^11.2.6

### Azure Portal Configuration
```
General Settings:
  Stack: Node
  Major version: 20 LTS (KHONG dung 24)
  Startup Command: bash startup.sh

Application Settings:
  PORT = 3000
  WEBSITES_PORT = 3000
  NODE_ENV = production
  NEXT_PUBLIC_API_URL = https://your-backend.azurewebsites.net/api/v1
```

### Files da tao/cap nhat (16 files)
```
# New files
.nvmrc                                        # Node 20
server.js                                     # Custom server cho Azure
startup.sh                                    # Azure startup script
src/screens/ApprovalsScreen.jsx               # Approvals screen
src/screens/OrderConfirmationScreen.jsx       # Order Confirmation screen
src/screens/ReceiptConfirmationScreen.jsx     # Receipt Confirmation screen
src/app/(dashboard)/approvals/page.jsx        # Route page
src/app/(dashboard)/order-confirmation/page.jsx
src/app/(dashboard)/receipt-confirmation/page.jsx

# Modified files
next.config.mjs                               # standalone output
package.json                                  # azure scripts, engines
tsconfig.json                                 # exclude backend
src/utils/routeMap.js                         # 3 new routes
src/locales/en.js                             # 105+ new keys
src/locales/vi.js                             # 105+ new keys
.env.example                                  # Azure config guide
```

---

## SESSION 07/02/2026 - Session 7

### Thay doi chinh

1. **Full-Stack Handover Documentation**
   - Bo sung toan bo Backend API documentation (7 modules, 60+ endpoints)
   - Document Database schema (Prisma, 29 tables)
   - Document Authentication flow + RBAC permissions
   - Bo sung Contexts, Hooks documentation chi tiet
   - Services → API endpoints mapping table day du
   - Environment variables, startup sequence, dependencies
   - Swagger docs URL: `http://localhost:4000/api/docs`

---

## REMAINING ITEMS

- [x] ~~3 missing screens (Approvals, Order Confirm, Receipt Confirm)~~ → Done Session 8
- [x] ~~Azure deployment config~~ → Done Session 8
- [x] ~~Backend security vulnerabilities~~ → 0 vulnerabilities (Session 8)
- [x] ~~QA Bug Fixes (6 bugs)~~ → Done Session 11
- [x] ~~TypeScript migration~~ → Done Session 14 (full .tsx/.ts migration)
- [x] ~~Feature-based architecture~~ → Done Session 14
- [x] ~~Mobile components V1~~ → Done Session 14 (6 components in ui/ + useIsMobile)
- [x] ~~Mobile UI 2.0 Revolution~~ → Done Session 14 (6 components in mobile/ + 6 hooks + CSS design system)
- [x] ~~Testing framework setup~~ → Done Session 14 (Vitest + 5 test suites, 114 tests)
- [x] ~~Apply Mobile UI 2.0 to 9 screens~~ → Done Session 15
- [x] ~~Tailwind CSS fix after TS migration~~ → Done Session 16 (ts/tsx content paths)
- [x] ~~OTB terminology "Phan tich" → "Phan bo"~~ → Done Session 16
- [x] ~~Budget Allocation filter matching fix~~ → Done Session 16
- [x] ~~Order/Receipt expandable detail with SKU + sizing~~ → Done Session 16
- [x] ~~Compact UI overhaul~~ → Done Session 17 (buttons, selects, KPI bar)
- [x] ~~Login V2 redesign~~ → Done Session 17 (glassmorphism, fashion icons)
- [x] ~~QA polish (viewport, i18n, API 404s, approval names)~~ → Done Session 17
- [x] ~~Remove Season fields from Create Budget~~ → Done Session 18
- [x] ~~SKU data flow fix (gender filter + auto-build from catalog)~~ → Done Session 18
- [x] ~~Fixed header scrolling~~ → Done Session 16 (h-screen overflow-hidden)
- [x] ~~Remove GroupBrand/Brand from Budget Management~~ → Done Session 19
- [x] ~~Approvals VersionDiffModal~~ → Done Session 19
- [x] ~~Dynamic store columns (SKU + BudgetAllocate)~~ → Done Session 19
- [x] ~~Production login fix (black screen, session handling)~~ → Done Session 19
- [x] ~~SKU Proposal Excel format redesign~~ → Done Session 20
- [x] ~~Excel-style row highlight + summary row differentiation~~ → Done Session 20
- [x] ~~Production cleanup (debug logs, SSR safety)~~ → Done Session 20
- [x] ~~Filter bar redesign (sticky flat toolbar across all screens)~~ → Done Session 21
- [x] ~~Fashion product SVGs (3D realistic)~~ → Done Session 21
- [x] ~~Smart auto expand/collapse filter bar~~ → Done Session 21
- [x] ~~Render cold-start login timeout handling~~ → Done Session 21
- [x] ~~Premium SKU Card flip (detail back face)~~ → Done Session 23
- [x] ~~X-Ray UX minimalist (remove fancy animations)~~ → Done Session 23
- [x] ~~Zero-lag filter bar (bypass React re-render)~~ → Done Session 23
- [x] ~~Remove sticky image row (blank gap fix)~~ → Done Session 23
- [x] ~~Approvals navigation fix (planning/proposal from Approvals)~~ → Done Session 24
- [x] ~~Phase 1 Hardening (E2E + hook/service tests + CI/CD)~~ → Done Session 24
- [x] ~~Phase 3 Budget Allocation (toolbar, bulk actions, session recovery, Excel export)~~ → Done Session 25
- [x] ~~FilterSelect luxury component~~ → Done Session 25
- [x] ~~ErrorBoundary + useMasterData + approvalHelper~~ → Done Session 25
- [x] ~~RRI Pipeline Audit (73 gaps — P0:16, P1:30, P2:27)~~ → Done Sessions 26-27
- [x] ~~Notification module (backend + frontend)~~ → Done Session 27
- [x] ~~Data retention module + GDPR erasure~~ → Done Session 27
- [x] ~~Financial utils (safeSum, roundVND, toNumber)~~ → Done Session 27
- [x] ~~Optimistic locking + Soft delete~~ → Done Session 27
- [x] ~~Client feedback round 2 (7 bugs)~~ → Done Session 28
- [x] ~~CreatableSelect component~~ → Done Session 29
- [x] ~~Add SKU Modal two-step wizard~~ → Done Session 29
- [ ] Fix useProposal test failures (16 tests fail — context mock issue)
- [ ] TicketScreen.tsx: TODO - Implement create ticket API call
- [ ] Azure Portal manual config (Node 22 LTS, env vars)
- [ ] Mobile responsive E2E testing on real devices
- [ ] Hardcoded years (2025) o nhieu noi can dynamic
- [ ] Performance tuning (virtual scrolling da add @tanstack/react-virtual, can apply)

---

## GHI CHU CHO CLAUDE

Khi doc file nay:
1. **Frontend**: `/Users/mac/OTBL-ERP/OTBnonAI/` (TypeScript, Next.js 16, App Router)
2. **Backend**: `/Users/mac/OTBL-ERP/OTBnonAI/backend/` (NestJS — 9 modules)
3. **API**: `http://localhost:4000/api/v1` | Swagger: `http://localhost:4000/api/docs`
4. **Database**: PostgreSQL via Docker (port 5432, user=lerp, db=lerp_otb)
5. Tat ca file la `.tsx`/`.ts` — TypeScript strict mode
6. Feature-based architecture: `src/features/{domain}/components/` + `src/features/{domain}/hooks/`
7. Screens re-export: `src/screens/*.tsx` → `export { default } from '../features/...'`
8. Mobile V1: `useIsMobile()` → `{isMobile, isTablet, isDesktop}` (20+ screens), MobileBottomNav khi <768px
8b. Mobile V2: `@/components/mobile` — MobileCard, MobileList, BottomSheet, FilterChips, PullToRefresh, FAB + 6 hooks trong useMobile.ts
9. i18n dung `useLanguage()` hook, translations tai `src/locales/`
10. Dark/light mode qua `darkMode` prop + CSS variables
11. Premium cards: gradient + watermark icon pattern (xem HomeScreen lam mau)
12. 2-level approval: DRAFT → SUBMITTED → L1_APPROVED → APPROVED
13. Permissions: `budget:read`, `budget:write`, `budget:approve_l1`, `budget:approve_l2`, etc.
14. Testing: `npm run test` (Vitest, 9 suites, 201 tests) + E2E (Playwright, 4 specs)
15. Types: `src/types/index.ts` (50+ shared interfaces)
16. Filter bars: sticky flat toolbar, auto-hide on scroll via `useSmartScrollState` (DOM-direct, zero re-render)
17. SKU Proposal table: Excel format, transposed Rail-based, dynamic store columns
18. Store columns: dynamic from API (khong hardcode REX/TTP)
19. VersionDiffModal + VersionCompareModal: so sanh planning versions
20. Deploy: Render (free-tier, cold-start 120s timeout + 2 retries)
21. Budget Allocation: full workstation with AllocationToolbar, BulkActionsMenu, SidePanel, SessionRecovery, Excel export
22. `CreatableSelect` + `FilterSelect`: luxury dropdown components
23. `AddSKUModal`: two-step wizard (brand/collection → full data entry)
24. Backend modules: auth, master-data, budget, planning, proposal, approval-workflow, import, notification, data-retention
25. CI/CD: `.github/workflows/ci.yml` (lint, typecheck, test, build, E2E)
26. RRI audit completed: 73 gaps fixed (optimistic locking, soft delete, financial utils, GDPR, data retention)

---

*Cap nhat file nay sau moi session lam viec quan trong*
