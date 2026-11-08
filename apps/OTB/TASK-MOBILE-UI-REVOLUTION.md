# ═══════════════════════════════════════════════════════════════════════════════
# 📱 TASK: Mobile UI/UX Revolution — OTBnonAI
# Target: 6 điểm → 9 điểm
# Timeline: 4 weeks
# ═══════════════════════════════════════════════════════════════════════════════

## 🎯 EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────────────────────────┐
│  MOBILE UX REVOLUTION                                           │
├─────────────────────────────────────────────────────────────────┤
│  Current Score: 6/10  ████████░░░░░░░░░░░░                      │
│  Target Score:  9/10  █████████████████████░░░                  │
│                                                                 │
│  5 PILLARS:                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ CARDS   │ │ LISTS   │ │ FILTERS │ │GESTURES │ │  PERF   │   │
│  │   2.0   │ │  VIEW   │ │ BOTTOM  │ │ NATIVE  │ │   OPT   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│     +1.0       +1.0        +0.5        +0.5        +0.5        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ STEP 1: Install Dependencies (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# No additional packages needed - using native React
# But if you want smooth animations, optionally install:
npm install framer-motion
```

---

## ⚡ STEP 2: Setup Directory Structure (5 min)

```bash
mkdir -p src/components/mobile
mkdir -p src/hooks
mkdir -p src/styles
```

---

## ⚡ STEP 3: Copy Component Files

### 3.1 Copy từ package này vào project:

```
MOBILE-UI-REVOLUTION.tar.gz
├── styles/
│   └── mobile-design-system.css    → src/styles/mobile-design-system.css
├── components/
│   ├── MobileCard.tsx              → src/components/mobile/MobileCard.tsx
│   ├── MobileList.tsx              → src/components/mobile/MobileList.tsx
│   ├── BottomSheet.tsx             → src/components/mobile/BottomSheet.tsx
│   ├── PullToRefresh.tsx           → src/components/mobile/PullToRefresh.tsx
│   ├── FilterChips.tsx             → src/components/mobile/FilterChips.tsx
│   └── index.ts                    → src/components/mobile/index.ts
└── hooks/
    └── useMobile.ts                → src/hooks/useMobile.ts
```

### 3.2 Import CSS vào app:

```tsx
// src/app/layout.tsx
import '@/styles/mobile-design-system.css';
```

---

## ⚡ STEP 4: Apply to Budget Screen (Example)

### BEFORE: Desktop table on mobile

```tsx
// Old code
<table className="w-full">
  <thead>
    <tr>
      <th>Name</th>
      <th>Brand</th>
      <th>Budget</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {budgets.map(budget => (
      <tr key={budget.id}>
        <td>{budget.name}</td>
        <td>{budget.brand.name}</td>
        <td>{formatCurrency(budget.totalBudget)}</td>
        <td><StatusBadge status={budget.status} /></td>
      </tr>
    ))}
  </tbody>
</table>
```

### AFTER: Mobile-optimized

```tsx
// New code
import { useIsMobile } from '@/hooks/useMobile';
import { MobileCard, MobileList, FilterChips, FilterBottomSheet, useBottomSheet } from '@/components/mobile';

const BudgetListScreen = () => {
  const isMobile = useIsMobile();
  const { isOpen, open, close } = useBottomSheet();
  const [filters, setFilters] = useState({});

  // Transform budgets to mobile list format
  const mobileItems = budgets.map(budget => ({
    id: budget.id,
    avatar: budget.brand.code.substring(0, 2),
    title: budget.name,
    subtitle: `${budget.brand.name} • ${budget.seasonGroup} ${budget.season}`,
    value: formatCurrency(budget.totalBudget),
    status: {
      text: budget.status,
      variant: budget.status === 'approved' ? 'success' : 
               budget.status === 'rejected' ? 'error' : 'warning',
    },
  }));

  // Filter config
  const filterSections = [
    {
      key: 'fiscalYear',
      label: 'Fiscal Year',
      icon: '📅',
      type: 'single' as const,
      options: [
        { value: '2024', label: 'FY 2024' },
        { value: '2025', label: 'FY 2025' },
        { value: '2026', label: 'FY 2026' },
      ],
    },
    {
      key: 'brand',
      label: 'Brand',
      icon: '🏷️',
      type: 'multi' as const,
      options: [
        { value: 'FER', label: 'Ferragamo' },
        { value: 'PRA', label: 'Prada' },
        { value: 'GUC', label: 'Gucci' },
      ],
    },
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-xl font-bold mb-3">Budgets</h1>
          
          {/* Filter Chips */}
          <FilterChips
            chips={[
              { key: 'fiscalYear', label: 'FY 2025', icon: '📅' },
              { key: 'brand', label: 'All Brands', icon: '🏷️' },
            ]}
            activeValues={filters}
            onChipPress={(key) => open()}
            onMorePress={open}
          />
        </div>

        {/* List */}
        <div className="p-4">
          <MobileList
            items={mobileItems}
            onItemPress={(item) => router.push(`/budgets/${item.id}`)}
            expandable
          />
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={isOpen}
          onClose={close}
          filters={filterSections}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => {/* Apply filters */}}
          onReset={() => setFilters({})}
        />

        {/* FAB */}
        <FloatingActionButton
          onClick={() => router.push('/budgets/new')}
          label="New Budget"
          size="extended"
        />
      </div>
    );
  }

  // Desktop view
  return <DesktopBudgetTable budgets={budgets} />;
};
```

---

## ⚡ STEP 5: Apply to All Screens

### Checklist by Screen:

| Screen | Component | Status |
|--------|-----------|--------|
| Budget Management | MobileList + FilterBottomSheet | [ ] |
| Budget Allocation | MobileCard + Expandable rows | [ ] |
| OTB Analysis | MobileCard + Swipe tabs | [ ] |
| SKU Proposal | MobileCard grid (2 cols) | [ ] |
| Tickets Kanban | MobileCard (compact) | [ ] |
| Ticket Detail | MobileCard + Timeline | [ ] |
| Master Data | MobileList + Search | [ ] |
| Approvals | MobileList + Swipe actions | [ ] |
| Home Dashboard | MobileCard carousel | [ ] |

---

## 📋 COMPONENT USAGE GUIDE

### MobileCard

```tsx
<MobileCard
  title="BUD-FER-SS-2025"
  subtitle="Ferragamo • Spring Summer"
  avatar="FE"
  badges={[{ text: 'Approved', variant: 'success' }]}
  progress={{ current: 650000000, total: 1000000000, label: 'Committed' }}
  metrics={[
    { icon: '🏷️', label: 'Brand', value: 'Ferragamo' },
    { icon: '📅', label: 'Season', value: 'SS 2025' },
  ]}
  onPress={() => router.push(`/budgets/${id}`)}
  onActionPress={() => setActionSheet(true)}
/>
```

### MobileList

```tsx
<MobileList
  items={[
    {
      id: '1',
      avatar: 'FE',
      title: 'BUD-FER-SS-2025',
      subtitle: 'Ferragamo • Spring Summer',
      value: '1.2B đ',
      status: { text: 'Approved', variant: 'success' },
      details: [
        { label: 'REX', value: '800M đ' },
        { label: 'TTP', value: '400M đ' },
      ],
    },
  ]}
  onItemPress={(item) => console.log(item.id)}
  expandable
/>
```

### FilterBottomSheet

```tsx
const { isOpen, open, close } = useBottomSheet();

<FilterBottomSheet
  isOpen={isOpen}
  onClose={close}
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'multi',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'approved', label: 'Approved' },
      ],
    },
  ]}
  values={filterValues}
  onChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
  onApply={() => applyFilters()}
  onReset={() => setFilterValues({})}
/>
```

### PullToRefresh

```tsx
<PullToRefresh onRefresh={async () => await refetchData()}>
  <MobileList items={items} />
</PullToRefresh>
```

---

## 📊 TESTING CHECKLIST

### Touch Targets (must be ≥44px)
```
[ ] All buttons ≥ 44px height
[ ] All list items ≥ 48px height  
[ ] All filter chips ≥ 36px height
[ ] FAB = 56px
```

### Visual Hierarchy
```
[ ] Avatar clearly visible
[ ] Title is 17px semibold
[ ] Subtitle is 14px gray
[ ] Status badges readable
[ ] Progress bars visible
```

### Gestures
```
[ ] Pull to refresh works
[ ] Bottom sheet drags to close
[ ] Expandable rows animate
[ ] FAB has press feedback
```

### Performance
```
[ ] Lists with 50+ items smooth
[ ] No jank on scroll
[ ] Bottom sheet opens in <300ms
```

---

## 📈 SUCCESS METRICS

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Touch targets ≥44px | 60% | — | 100% |
| Content viewport | 60% | — | 85% |
| Lighthouse Mobile | 65 | — | 90+ |
| User satisfaction | 6/10 | — | 9/10 |

---

## 📁 FILES IN PACKAGE

| File | Lines | Purpose |
|------|-------|---------|
| `mobile-design-system.css` | 400 | CSS variables, base styles |
| `MobileCard.tsx` | 200 | Card component |
| `MobileList.tsx` | 250 | List component |
| `BottomSheet.tsx` | 280 | Bottom sheet + Filter sheet |
| `PullToRefresh.tsx` | 150 | Pull to refresh |
| `FilterChips.tsx` | 200 | Chips, FAB, Search |
| `useMobile.ts` | 250 | Hooks |
| `index.ts` | 40 | Barrel exports |
| **TOTAL** | **~1,770** | |

---

## 🚀 QUICK START

```bash
# 1. Extract package
tar -xzvf MOBILE-UI-REVOLUTION.tar.gz -C ~/OTBL-ERP/OTBnonAI/src

# 2. Import CSS
echo "import '@/styles/mobile-design-system.css';" >> src/app/globals.css

# 3. Start applying to screens
# Begin with Budget Management screen as example

# 4. Test on mobile device or Chrome DevTools
npm run dev
# Open Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
```

---

## 📊 REPORT TEMPLATE

```
MOBILE UI REVOLUTION PROGRESS
═══════════════════════════════════════
Date: ___________
Week: ___/4

SCREENS COMPLETED:
[ ] Budget Management
[ ] Budget Allocation
[ ] OTB Analysis
[ ] SKU Proposal
[ ] Tickets
[ ] Master Data
[ ] Approvals
[ ] Home Dashboard
[ ] Other: _________

METRICS:
- Touch target compliance: ___%
- Lighthouse Mobile Score: ___
- Tested on devices: ___________

ISSUES FOUND:
1. _______________
2. _______________

NEXT WEEK PLAN:
1. _______________
2. _______________
```

---

**Priority:** 🟡 HIGH
**Timeline:** 4 weeks
**Contact:** Weekly progress report
