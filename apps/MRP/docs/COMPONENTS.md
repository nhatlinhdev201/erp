# UI Components | Thư viện Component UI

> Component library documentation for L-ERP MRP System  
> Tài liệu thư viện component cho Hệ thống L-ERP MRP

---

## Table of Contents | Mục lục

- [Overview | Tổng quan](#overview--tổng-quan)
- [Design Tokens | Token thiết kế](#design-tokens--token-thiết-kế)
- [Layout Components | Component bố cục](#layout-components--component-bố-cục)
- [UI Primitives | Component UI cơ bản](#ui-primitives--component-ui-cơ-bản)
- [Animation Components | Component hoạt ảnh](#animation-components--component-hoạt-ảnh)
- [PWA Components | Component PWA](#pwa-components--component-pwa)
- [Theme System | Hệ thống Theme](#theme-system--hệ-thống-theme)
- [Data Hooks | Hook dữ liệu](#data-hooks--hook-dữ-liệu)

---

## Overview | Tổng quan

### English

The L-ERP MRP UI library is built on top of Tailwind CSS with custom components optimized for manufacturing applications. All components support dark mode, animations, and accessibility.

### Tiếng Việt

Thư viện UI L-ERP MRP được xây dựng trên Tailwind CSS với các component tùy chỉnh được tối ưu cho ứng dụng sản xuất. Tất cả component đều hỗ trợ chế độ tối, hoạt ảnh và khả năng truy cập.

### Component Categories | Danh mục Component

| Category | Count | Description | Mô tả |
|----------|-------|-------------|-------|
| Layout | 2 | App shell, page layout | Shell ứng dụng, bố cục trang |
| UI Primitives | 8+ | Button, Card, Input, etc. | Button, Card, Input, v.v. |
| Animation | 10+ | FadeIn, Spinner, etc. | FadeIn, Spinner, v.v. |
| PWA | 4 | Install prompt, offline | Nhắc cài đặt, offline |
| Providers | 2 | Theme, root providers | Theme, provider gốc |

---

## Design Tokens | Token thiết kế

### Colors | Màu sắc

```css
/* Primary (Blue) */
--primary-50:  #eff6ff;
--primary-500: #3b82f6;
--primary-900: #1e3a8a;

/* Success (Green) */
--success-500: #22c55e;

/* Warning (Amber) */
--warning-500: #f59e0b;

/* Danger (Red) */
--danger-500: #ef4444;

/* Gray */
--gray-50:  #f9fafb;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Spacing | Khoảng cách

| Token | Value | Usage | Sử dụng |
|-------|-------|-------|---------|
| `xs` | 0.25rem (4px) | Tight spacing | Khoảng cách chặt |
| `sm` | 0.5rem (8px) | Small padding | Padding nhỏ |
| `md` | 1rem (16px) | Default spacing | Mặc định |
| `lg` | 1.5rem (24px) | Large spacing | Khoảng cách lớn |
| `xl` | 2rem (32px) | Section spacing | Khoảng cách section |

### Border Radius | Bo góc

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 0.25rem | Small elements |
| `md` | 0.375rem | Buttons, inputs |
| `lg` | 0.5rem | Cards |
| `xl` | 0.75rem | Modals |
| `2xl` | 1rem | Large cards |
| `full` | 9999px | Pills, avatars |

---

## Layout Components | Component bố cục

### AppShellV2

Main application layout with sidebar and topbar.  
Bố cục ứng dụng chính với sidebar và topbar.

```tsx
import { AppShellV2 } from '@/components/layout/app-shell-v2';

function App() {
  return (
    <AppShellV2>
      {/* Page content */}
    </AppShellV2>
  );
}
```

**Features | Tính năng:**
- ✅ Collapsible sidebar | Sidebar thu gọn được
- ✅ Mobile responsive | Responsive mobile
- ✅ Dark mode support | Hỗ trợ chế độ tối
- ✅ Theme toggle | Chuyển đổi theme
- ✅ User menu | Menu người dùng
- ✅ Notifications | Thông báo

### PageLayout

Page wrapper with title and breadcrumbs.  
Wrapper trang với tiêu đề và breadcrumb.

```tsx
import { PageLayout } from '@/components/layout/page-layout';

function DashboardPage() {
  return (
    <PageLayout
      title="Dashboard"
      subtitle="Overview of your business"
      actions={<Button>Export</Button>}
    >
      {/* Page content */}
    </PageLayout>
  );
}
```

**Props:**

| Prop | Type | Description | Mô tả |
|------|------|-------------|-------|
| `title` | string | Page title | Tiêu đề trang |
| `subtitle` | string | Page description | Mô tả trang |
| `actions` | ReactNode | Header actions | Các action header |
| `breadcrumbs` | Array | Breadcrumb items | Mục breadcrumb |

---

## UI Primitives | Component UI cơ bản

### Button

Animated button with ripple effect.  
Button hoạt ảnh với hiệu ứng ripple.

```tsx
import { Button, IconButton, ButtonGroup } from '@/components/ui/button-animated';

// Basic usage | Sử dụng cơ bản
<Button>Click me</Button>

// Variants | Các biến thể
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>

// Sizes | Kích thước
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// With icons | Với icon
<Button leftIcon={<Plus />}>Add Item</Button>
<Button rightIcon={<ArrowRight />}>Next</Button>

// Loading state | Trạng thái loading
<Button isLoading>Saving...</Button>
<Button isLoading loadingText="Processing...">Save</Button>

// Icon button | Button icon
<IconButton aria-label="Settings">
  <Settings />
</IconButton>

// Button group | Nhóm button
<ButtonGroup attached>
  <Button>Left</Button>
  <Button>Middle</Button>
  <Button>Right</Button>
</ButtonGroup>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | 'primary' | Button style variant |
| `size` | string | 'md' | Button size |
| `isLoading` | boolean | false | Show loading state |
| `loadingText` | string | - | Text during loading |
| `leftIcon` | ReactNode | - | Icon on left |
| `rightIcon` | ReactNode | - | Icon on right |
| `ripple` | boolean | true | Enable ripple effect |
| `fullWidth` | boolean | false | Full width button |

### Card

Animated card with hover effects.  
Card hoạt ảnh với hiệu ứng hover.

```tsx
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter,
  StatCard,
  FeatureCard,
  GlassCard 
} from '@/components/ui/card-animated';

// Basic card | Card cơ bản
<Card>
  <CardHeader title="Card Title" subtitle="Description" />
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>

// Card variants | Các biến thể card
<Card variant="default">Default</Card>
<Card variant="bordered">Bordered</Card>
<Card variant="elevated">Elevated</Card>
<Card variant="ghost">Ghost</Card>

// Hover effects | Hiệu ứng hover
<Card hover="lift">Lifts on hover</Card>
<Card hover="glow">Glows on hover</Card>
<Card hover="scale">Scales on hover</Card>
<Card hover="border">Border highlight</Card>

// Stat card | Card thống kê
<StatCard
  title="Revenue"
  value="$45,231"
  change={{ value: 12, type: 'increase' }}
  icon={<DollarSign />}
/>

// Feature card | Card tính năng
<FeatureCard
  title="Analytics"
  description="Track your metrics"
  icon={<BarChart />}
  color="purple"
/>

// Glass card | Card kính
<GlassCard blur="md">
  Glassmorphism effect
</GlassCard>
```

**Card Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | 'default' | Card style |
| `hover` | string | 'lift' | Hover effect |
| `padding` | string | 'md' | Padding size |
| `rounded` | string | 'xl' | Border radius |
| `interactive` | boolean | false | Clickable card |

---

## Animation Components | Component hoạt ảnh

### FadeIn

Fade in animation with intersection observer.  
Hoạt ảnh fade in với intersection observer.

```tsx
import { FadeIn, StaggerChildren } from '@/components/ui/animations';

// Basic fade in | Fade in cơ bản
<FadeIn>
  <Card>Content</Card>
</FadeIn>

// With direction | Với hướng
<FadeIn direction="up">Slides up</FadeIn>
<FadeIn direction="down">Slides down</FadeIn>
<FadeIn direction="left">Slides left</FadeIn>
<FadeIn direction="right">Slides right</FadeIn>

// With delay | Với độ trễ
<FadeIn delay={100}>Delayed 100ms</FadeIn>

// Stagger children | Các con hiển thị lần lượt
<StaggerChildren staggerDelay={50}>
  <Card>First</Card>
  <Card>Second</Card>
  <Card>Third</Card>
</StaggerChildren>
```

### Loading States | Trạng thái Loading

```tsx
import { Spinner, Skeleton, ProgressBar, PulseDot } from '@/components/ui/animations';

// Spinner | Vòng xoay
<Spinner size="sm" />
<Spinner size="md" color="primary" />
<Spinner size="lg" color="white" />

// Skeleton | Khung xương
<Skeleton width={200} height={20} />
<Skeleton width="100%" height={40} rounded="lg" />

// Progress bar | Thanh tiến trình
<ProgressBar value={75} />
<ProgressBar value={50} color="success" showValue />
<ProgressBar value={25} animated />

// Pulse dot (status indicator) | Chấm nhấp nháy
<PulseDot color="success" /> Online
<PulseDot color="danger" /> Error
<PulseDot color="warning" /> Warning
```

### AnimatedCounter

Animated number counter.  
Bộ đếm số hoạt ảnh.

```tsx
import { AnimatedCounter } from '@/components/ui/animations';

// Basic | Cơ bản
<AnimatedCounter value={1234} />

// With formatting | Với định dạng
<AnimatedCounter 
  value={45231} 
  prefix="$" 
  suffix="k"
  decimals={2}
/>
```

### Collapse

Collapsible content with animation.  
Nội dung thu gọn với hoạt ảnh.

```tsx
import { Collapse } from '@/components/ui/animations';

function Accordion() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      <Collapse isOpen={isOpen}>
        <p>Collapsible content here...</p>
      </Collapse>
    </div>
  );
}
```

---

## PWA Components | Component PWA

### InstallPromptBanner

Shows install prompt for PWA.  
Hiển thị nhắc cài đặt PWA.

```tsx
import { InstallPromptBanner } from '@/components/pwa';

// Auto shows when installable
// Tự động hiển thị khi có thể cài đặt
<InstallPromptBanner />

// With callback | Với callback
<InstallPromptBanner 
  onDismiss={() => console.log('Dismissed')} 
/>
```

### OfflineIndicator

Shows network status.  
Hiển thị trạng thái mạng.

```tsx
import { OfflineIndicator } from '@/components/pwa';

// Auto shows when offline/online
// Tự động hiển thị khi offline/online
<OfflineIndicator />
```

### UpdateNotification

Shows when new version available.  
Hiển thị khi có phiên bản mới.

```tsx
import { UpdateNotification } from '@/components/pwa';

// Auto shows when update available
// Tự động hiển thị khi có cập nhật
<UpdateNotification />
```

### PWAProvider

Combines all PWA components.  
Kết hợp tất cả component PWA.

```tsx
import { PWAProvider } from '@/components/pwa';

function App() {
  return (
    <PWAProvider
      showInstallPrompt
      showOfflineIndicator
      showUpdateNotification
    >
      <AppContent />
    </PWAProvider>
  );
}
```

---

## Theme System | Hệ thống Theme

### ThemeProvider

Context provider for theme.  
Provider ngữ cảnh cho theme.

```tsx
import { ThemeProvider } from '@/components/providers/theme-provider';

function App() {
  return (
    <ThemeProvider 
      defaultTheme="system"
      storageKey="lerp-mrp-theme"
    >
      <AppContent />
    </ThemeProvider>
  );
}
```

### useTheme Hook

Access theme context.  
Truy cập ngữ cảnh theme.

```tsx
import { useTheme } from '@/components/providers/theme-provider';

function Component() {
  const { 
    theme,         // 'light' | 'dark' | 'system'
    resolvedTheme, // 'light' | 'dark'
    isDark,        // boolean
    setTheme,      // (theme) => void
    toggleTheme,   // () => void
  } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}
```

### ThemeToggle

Pre-built theme toggle button.  
Button chuyển theme có sẵn.

```tsx
import { ThemeToggle, ThemeSelector } from '@/components/providers/theme-provider';

// Simple toggle | Toggle đơn giản
<ThemeToggle />
<ThemeToggle size="sm" />
<ThemeToggle showLabel />

// Dropdown selector | Dropdown chọn
<ThemeSelector />
```

---

## Data Hooks | Hook dữ liệu

### useDashboard

Fetch dashboard data.  
Lấy dữ liệu dashboard.

```tsx
import { useDashboard } from '@/lib/hooks/use-data';

function Dashboard() {
  const { data, isLoading, isError, mutate } = useDashboard();
  
  if (isLoading) return <Spinner />;
  if (isError) return <Error />;
  
  return (
    <div>
      <StatCard 
        title="Total Parts" 
        value={data.kpis.inventory.totalParts} 
      />
    </div>
  );
}
```

### useParts

Fetch and manage parts.  
Lấy và quản lý linh kiện.

```tsx
import { useParts, useCreatePart } from '@/lib/hooks/use-data';

function PartsList() {
  const { 
    parts, 
    total, 
    isLoading, 
    page, 
    totalPages,
    mutate 
  } = useParts({ page: 1, search: 'motor' });
  
  const { createPart, isLoading: creating } = useCreatePart();
  
  const handleCreate = async () => {
    await createPart({
      partNumber: 'NEW-001',
      name: 'New Part',
      category: 'Electronics'
    });
    mutate(); // Refresh list
  };
  
  return (
    <div>
      {parts.map(part => (
        <Card key={part.id}>{part.name}</Card>
      ))}
    </div>
  );
}
```

### Other Hooks | Các hook khác

```tsx
// Sales Orders | Đơn hàng
const { orders, kpis } = useSalesOrders({ status: 'PENDING' });

// Work Orders | Lệnh sản xuất
const { workOrders } = useWorkOrders({ priority: 'high' });

// Inventory | Tồn kho
const { inventory, stockSummary } = useInventory({ warehouseId: 'wh-1' });

// Quality/NCR | Chất lượng
const { ncrs, kpis } = useNCRs({ status: 'open' });

// BOM | Danh mục vật tư
const { lines, summary } = useBOM(productId);

// Analytics | Phân tích
const { data } = useAnalytics({ tab: 'overview', period: 30 });
```

### Mutation Hooks | Hook mutation

```tsx
// Create records | Tạo bản ghi
const { createPart } = useCreatePart();
const { createOrder } = useCreateSalesOrder();
const { createWorkOrder } = useCreateWorkOrder();

// Update records | Cập nhật bản ghi
const { updateRecord } = useUpdateRecord();
await updateRecord('/api/v2/parts/123', { name: 'Updated' });

// Delete records | Xóa bản ghi
const { deleteRecord } = useDeleteRecord();
await deleteRecord('/api/v2/parts/123');

// Inventory actions | Hành động tồn kho
const { performAction } = useInventoryActions();
await performAction('receive', { partId, quantity: 100 });

// BOM actions | Hành động BOM
const { addLine, updateLine, deleteLine } = useBOMActions();
```

---

## CSS Classes | Class CSS

### Utility Classes | Class tiện ích

```css
/* Theme-aware backgrounds */
.bg-theme-primary    /* White / Gray-900 */
.bg-theme-secondary  /* Gray-50 / Gray-800 */
.bg-surface-1        /* Surface level 1 */
.bg-surface-2        /* Surface level 2 */

/* Theme-aware text */
.text-theme-primary   /* Gray-900 / Gray-50 */
.text-theme-secondary /* Gray-600 / Gray-300 */
.text-theme-muted     /* Gray-400 / Gray-500 */

/* Animation classes */
.animate-fade-in
.animate-fade-in-up
.animate-scale-in
.animate-slide-in-left
.animate-ripple
.animate-pulse-soft
.animate-shake
.animate-bounce-subtle
.animate-float
.animate-shimmer

/* Hover effects */
.hover-scale
.hover-lift
.hover-glow
.hover-bright

/* Card classes */
.card-theme
.card-hover

/* Button classes */
.btn-press
.btn-ripple
```

---

<p align="center">
  <em>Component Library v2.0 | Thư viện Component v2.0</em>
</p>
