# @linkk/dashboard

**L-ERP Unified Dashboard Package**

Unified dashboard package with KPI widgets that aggregate data across all L-ERP modules. Provides reusable React components, hooks, and preset configurations for building dashboards with real-time insights.

---

**Package Tiếng Việt:**

Gói Dashboard thống nhất L-ERP với các widget KPI tổng hợp dữ liệu từ tất cả các mô-đun L-ERP. Cung cấp các thành phần React có thể tái sử dụng, hook và cấu hình preset để xây dựng bảng điều khiển với những hiểu biết sâu sắc thực tế.

## Features | Tính Năng

- **KPI Cards** — Display key metrics with trends and sparklines
- **Chart Widgets** — Auto-selecting chart types (line, bar, pie, doughnut) with Recharts
- **Data Tables** — Sortable, filterable tables with pagination for recent activity
- **Module Status** — Grid view of module health and system uptime
- **Dashboard Grid** — Responsive CSS Grid layout with configurable columns
- **Dashboard Hooks** — `useDashboardData()` and `useChartData()` for data fetching
- **Preset Configurations** — Pre-built layouts for Executive, Operations, and HR dashboards
- **Bilingual Support** — Vietnamese and English labels throughout

---

- **Thẻ KPI** — Hiển thị các chỉ số chính với xu hướng và sparkline
- **Widget Biểu đồ** — Tự động chọn loại biểu đồ (line, bar, pie, doughnut) với Recharts
- **Bảng Dữ liệu** — Bảng có thể sắp xếp, lọc với phân trang cho hoạt động gần đây
- **Trạng thái Mô-đun** — Khung nhìn lưới sức khỏe mô-đun và thời gian hoạt động hệ thống
- **Lưới Dashboard** — Bố cục CSS Grid phản hồi với cột có thể định cấu hình
- **Dashboard Hook** — `useDashboardData()` và `useChartData()` để tìm nạp dữ liệu
- **Cấu hình Preset** — Bố cục được xây dựng trước cho bảng điều khiển Điều hành, Vận hành và Nhân Sự
- **Hỗ trợ Hai ngôn ngữ** — Nhãn Tiếng Việt và Tiếng Anh xuyên suốt

## Installation | Cài Đặt

```bash
npm install @linkk/dashboard
```

## Usage | Cách Sử Dụng

### Basic KPI Card | Thẻ KPI Cơ Bản

```tsx
import { KPICard } from '@linkk/dashboard';
import { DollarSign } from 'lucide-react';

export default function App() {
  return (
    <KPICard
      title="Total Revenue | Tổng Doanh Thu"
      value="$1.2M"
      change={12.5}
      trend="up"
      icon={<DollarSign />}
      color="success"
      module="Sales"
      link="/sales"
    />
  );
}
```

### Chart Widget | Widget Biểu Đồ

```tsx
import { ChartWidget } from '@linkk/dashboard';

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      label: 'Revenue | Doanh Thu',
      data: [65000, 78000, 92000, 85000, 110000],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
  ],
  type: 'line' as const,
};

export default function App() {
  return (
    <ChartWidget
      title="Revenue Trend | Xu Hướng Doanh Thu"
      data={chartData}
      height={300}
    />
  );
}
```

### Data Table | Bảng Dữ Liệu

```tsx
import { DataTable } from '@linkk/dashboard';

const data = [
  {
    id: '1',
    timestamp: new Date(),
    module: 'Sales',
    action: 'Order Created',
    entity: 'Order #ORD-001',
    user: 'John Doe',
  },
];

export default function App() {
  return (
    <DataTable
      data={data}
      columns={['timestamp', 'module', 'action', 'entity', 'user']}
      pageSize={10}
      onRowClick={(row) => console.log(row)}
    />
  );
}
```

### Module Status | Trạng thái Mô-đun

```tsx
import { ModuleStatus } from '@linkk/dashboard';

const modules = [
  {
    moduleName: 'Sales CRM',
    status: 'online' as const,
    uptime: 99.95,
    responseTime: 145,
  },
  {
    moduleName: 'Accounting',
    status: 'online' as const,
    uptime: 99.98,
    responseTime: 123,
  },
];

export default function App() {
  return <ModuleStatus modules={modules} columns={2} />;
}
```

### Dashboard Grid | Lưới Dashboard

```tsx
import {
  DashboardGrid,
  WidgetContainer,
  KPICard,
  ChartWidget,
} from '@linkk/dashboard';

export default function Dashboard() {
  return (
    <DashboardGrid columns={3} gap="md">
      <WidgetContainer
        widget={{ id: '1', type: 'kpi', size: 'sm', title: 'Revenue' }}
      >
        <KPICard title="Revenue" value="$1.2M" change={12.5} trend="up" />
      </WidgetContainer>

      <WidgetContainer
        widget={{
          id: '2',
          type: 'chart',
          size: 'lg',
          title: 'Trend',
        }}
      >
        <ChartWidget title="Revenue Trend" data={chartData} />
      </WidgetContainer>
    </DashboardGrid>
  );
}
```

### Dashboard Data Hook | Hook Dữ Liệu Dashboard

```tsx
import { useDashboardData } from '@linkk/dashboard';

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboardData('MONTH', 60000);

  if (loading) return <div>Loading... | Đang tải...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Revenue: ${data?.revenue}</p>
      <p>Orders: {data?.orders}</p>
      <button onClick={refetch}>Refresh | Làm mới</button>
    </div>
  );
}
```

### Using Presets | Sử Dụng Preset

```tsx
import {
  DashboardGrid,
  WidgetContainer,
  executiveDashboard,
} from '@linkk/dashboard';

export default function ExecutiveDashboard() {
  const preset = executiveDashboard;

  return (
    <div>
      <h1>{preset.name}</h1>
      <p>{preset.description}</p>

      <DashboardGrid columns={preset.layout.columns} gap={preset.layout.gap}>
        {preset.layout.widgets.map((widget) => (
          <WidgetContainer key={widget.id} widget={widget}>
            {/* Render widget based on type */}
          </WidgetContainer>
        ))}
      </DashboardGrid>
    </div>
  );
}
```

## Components | Thành Phần

### KPICard

Display single KPI metrics with trend indicators and navigation.

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Card title / Tiêu đề thẻ |
| `value` | string \| number | Metric value / Giá trị chỉ số |
| `change?` | number | Percentage change / Thay đổi phần trăm |
| `trend?` | 'up' \| 'down' \| 'flat' | Trend direction / Hướng xu hướng |
| `icon?` | ReactNode | Icon component / Thành phần biểu tượng |
| `color?` | 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' | Color scheme / Sơ đồ màu |
| `module?` | string | Associated module / Mô-đun liên kết |
| `link?` | string | Navigation link / Liên kết điều hướng |

### ChartWidget

Responsive chart wrapper supporting multiple chart types.

| Prop | Type | Description |
|------|------|-------------|
| `title?` | string | Chart title / Tiêu đề biểu đồ |
| `data` | ChartData | Chart data structure / Cấu trúc dữ liệu biểu đồ |
| `height?` | number | Chart height in pixels / Chiều cao biểu đồ tính bằng pixel |
| `loading?` | boolean | Loading state / Trạng thái tải |
| `error?` | string \| null | Error message / Thông báo lỗi |

### DataTable

Sortable and filterable table for displaying activity data.

| Prop | Type | Description |
|------|------|-------------|
| `data` | TableRow[] | Table data / Dữ liệu bảng |
| `columns?` | (keyof TableRow)[] | Visible columns / Cột hiển thị |
| `pageSize?` | number | Rows per page / Hàng mỗi trang |
| `onRowClick?` | (row) => void | Row click handler / Trình xử lý nhấp hàng |
| `loading?` | boolean | Loading state / Trạng thái tải |

### ModuleStatus

Grid of module health and system status indicators.

| Prop | Type | Description |
|------|------|-------------|
| `modules` | ModuleStatus[] | Module status data / Dữ liệu trạng thái mô-đun |
| `columns?` | 1 \| 2 \| 3 \| 4 | Grid columns / Cột lưới |
| `loading?` | boolean | Loading state / Trạng thái tải |

### DashboardGrid & WidgetContainer

Responsive CSS Grid layout system.

| Prop | Type | Description |
|------|------|-------------|
| `columns?` | 1 \| 2 \| 3 \| 4 | Grid columns / Cột lưới |
| `gap?` | 'sm' \| 'md' \| 'lg' | Gap between items / Khoảng cách giữa các mục |
| `responsive?` | boolean | Enable responsive behavior / Kích hoạt hành vi phản hồi |

## Hooks | Hook

### useDashboardData

Fetch aggregated dashboard data from all modules.

```tsx
const { data, loading, error, refetch } = useDashboardData(
  'MONTH', // TimeRange
  60000    // Auto-refresh interval in ms
);
```

Returns:
- `data: DashboardData | null` — Aggregated metrics
- `loading: boolean` — Loading state
- `error: Error | null` — Error object
- `refetch: () => Promise<void>` — Manual refetch function

### useChartData

Fetch chart data with auto-refresh support.

```tsx
const { data, loading, error, refetch } = useChartData(
  'revenue-trend', // Chart ID
  'MONTH',         // TimeRange
  300000           // Auto-refresh interval in ms
);
```

## Presets | Preset

### Executive Dashboard | Dashboard Điều Hành

High-level business overview with revenue, profit, top customers, and sales pipeline.

```tsx
import { executiveDashboard } from '@linkk/dashboard';

console.log(executiveDashboard.name);        // "Executive Dashboard"
console.log(executiveDashboard.defaultTimeRange); // "MONTH"
```

### Operations Dashboard | Dashboard Vận Hành

Real-time operational metrics: orders, inventory, production, shipping.

```tsx
import { operationsDashboard } from '@linkk/dashboard';
```

### HR Dashboard | Dashboard Nhân Sự

Human resources metrics: headcount, attendance, leave, payroll.

```tsx
import { hrDashboard } from '@linkk/dashboard';
```

## Types | Kiểu Dữ Liệu

### KPICard

```typescript
interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  module?: string;
  link?: string;
}
```

### ChartData

```typescript
interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  type: 'line' | 'bar' | 'pie' | 'doughnut';
}
```

### DashboardWidget

```typescript
interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'moduleStatus' | 'custom';
  title: string;
  module?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  data?: Record<string, unknown>;
  refreshInterval?: number;
  loading?: boolean;
  error?: string | null;
}
```

### TimeRange

```typescript
type TimeRange = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
```

## Styling | Kiểu Dáng

The package uses Tailwind CSS utility classes for styling. Ensure Tailwind CSS is configured in your project:

```json
{
  "content": [
    "./node_modules/@linkk/dashboard/**/*.{ts,tsx}"
  ]
}
```

## Integration | Tích Hợp

### With Next.js

```tsx
// app/dashboard/page.tsx
import { DashboardGrid, KPICard, ChartWidget } from '@linkk/dashboard';

export default function DashboardPage() {
  return (
    <DashboardGrid columns={3} gap="md">
      {/* Dashboard content */}
    </DashboardGrid>
  );
}
```

### API Integration | Tích Hợp API

The hooks expect data from:
- `/api/dashboard?timeRange=MONTH` — Dashboard data endpoint
- `/api/charts/:chartId?timeRange=MONTH` — Chart data endpoint

Return formats:

```typescript
// /api/dashboard response
{
  revenue: number;
  profit: number;
  orders: number;
  newCustomers: number;
  activeProjects: number;
  openTasks: number;
  pendingInvoices: number;
  inventory: number;
  productionStatus: string;
  shippingStatus: string;
  headcount: number;
  attendance: number;
  payrollStatus: string;
  topCustomers: Array<{ id, name, revenue }>;
  salesPipeline: Array<{ stage, value, opportunities }>;
  recentActivity: TableRow[];
  moduleStatus: ModuleStatus[];
  kpis: Record<string, KPICard>;
}

// /api/charts/:chartId response
{
  labels: string[];
  datasets: ChartDataset[];
  type: 'line' | 'bar' | 'pie' | 'doughnut';
}
```

## Browser Support | Hỗ Trợ Trình Duyệt

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## TypeScript | Lập Trình Kiểu

Fully typed with strict TypeScript support. No `@ts-ignore` needed.

## Performance | Hiệu Năng

- Lazy loading for charts with Suspense boundaries
- Auto-refresh intervals prevent excessive API calls
- Skeleton loaders for better UX
- Responsive images and optimized rendering

## License | Giấy Phép

Proprietary — L-ERP Project

## Contributing | Đóng Góp

Report issues or suggest improvements in the L-ERP monorepo.

---

## Visual Guide | Hướng Dẫn Hình Ảnh

### KPI Card Layout

```
┌─────────────────┐
│ Revenue (Sales) │ [Icon]
├─────────────────┤
│     $1.2M       │
│ +12.5% (↑up)    │
│ [Sparkline]     │
└─────────────────┘
```

### Dashboard Grid Layout (3 columns)

```
┌────────────┬────────────┬────────────┐
│   KPI 1    │   KPI 2    │   KPI 3    │
├────────────┴────────────┴────────────┤
│           Chart Widget (lg)           │
├────────────┬────────────┬────────────┤
│  Module 1  │  Module 2  │  Module 3  │
├────────────┴────────────┴────────────┤
│         Data Table (xl)               │
└────────────────────────────────────────┘
```

### Module Status Grid

```
┌──────────┬──────────┬──────────┐
│  Module  │  Module  │  Module  │
│  Sales   │ Accounts │Inventory │
│  ✓       │  ✓       │  ⚠       │
│  99.95%  │  99.98%  │  98.5%   │
└──────────┴──────────┴──────────┘
```

## Changelog | Nhật Ký Thay Đổi

### Version 1.0.0 (2026-03-29)

- Initial release with core components
- KPI Card, Chart Widget, Data Table, Module Status
- useDashboardData and useChartData hooks
- Executive, Operations, and HR presets
- Full TypeScript support
- Bilingual Vietnamese/English documentation
