// =============================================================================
// L-ERP MRP - ADVANCED ANALYTICS TYPES
// TypeScript interfaces for analytics module
// =============================================================================

// =============================================================================
// KPI TYPES
// =============================================================================

export type KPICategory =
  | 'inventory'
  | 'sales'
  | 'production'
  | 'quality'
  | 'financial'
  | 'supplier';

export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'CUSTOM';

export type ThresholdDirection = 'higher_is_better' | 'lower_is_better';

export type TrendPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type KPIStatus = 'normal' | 'warning' | 'critical';

export interface KPIDefinition {
  id: string;
  code: string;
  name: string;
  nameVi: string;
  description?: string;
  descriptionVi?: string;
  category: KPICategory;
  formula: string;
  dataSource: string;
  aggregation: AggregationType;
  unit?: string;
  format: 'number' | 'currency' | 'percent' | 'decimal';
  precision: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  targetValue?: number;
  thresholdDirection: ThresholdDirection;
  trendPeriod: TrendPeriod;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
}

export interface KPIValue {
  code: string;
  value: number;
  formattedValue: string;
  status: KPIStatus;
  trend?: KPITrend;
  previousValue?: number;
  changePercent?: number;
  target?: number;
  targetPercent?: number;
  timestamp: Date;
}

export interface KPITrend {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  data: KPITrendPoint[];
}

export interface KPITrendPoint {
  date: string;
  value: number;
}

export interface KPICalculationParams {
  dateFrom?: Date;
  dateTo?: Date;
  period?: TrendPeriod;
  filters?: Record<string, unknown>;
  includeTrend?: boolean;
  trendPeriods?: number;
}

// =============================================================================
// WIDGET TYPES
// =============================================================================

export type WidgetType =
  | 'kpi'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'chart-area'
  | 'chart-donut'
  | 'gauge'
  | 'table'
  | 'sparkline'
  | 'heatmap';

export type DataSource =
  | 'inventory'
  | 'sales'
  | 'production'
  | 'quality'
  | 'financial'
  | 'supplier'
  | 'mrp'
  | 'custom';

export interface WidgetQueryConfig {
  metrics?: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  groupBy?: string[];
  orderBy?: QueryOrderBy[];
  limit?: number;
  dateRange?: DateRangeConfig;
  aggregation?: AggregationType;
  customQuery?: string;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'between';
  value: unknown;
}

export interface QueryOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DateRangeConfig {
  type: 'preset' | 'custom';
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear';
  from?: string;
  to?: string;
}

export interface WidgetDisplayConfig {
  colors?: string[];
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  showTrend?: boolean;
  formatter?: 'number' | 'currency' | 'percent';
  locale?: string;
  thresholds?: ThresholdConfig[];
  animation?: boolean;
  stacked?: boolean;
  curved?: boolean;
}

export interface ThresholdConfig {
  value: number;
  color: string;
  label?: string;
}

export interface DrillDownConfig {
  enabled: boolean;
  targetDashboard?: string;
  targetWidget?: string;
  filterField?: string;
  openInModal?: boolean;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  titleVi?: string;
  dataSource: DataSource;
  metric?: string;
  queryConfig: WidgetQueryConfig;
  displayConfig: WidgetDisplayConfig;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  refreshInterval?: number;
  drillDownConfig?: DrillDownConfig;
}

export interface WidgetData {
  widgetId: string;
  data: unknown;
  metadata?: {
    total?: number;
    lastUpdated?: Date;
    cached?: boolean;
  };
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  compactType: 'vertical' | 'horizontal' | null;
}

export interface Dashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  isPublic: boolean;
  isDefault: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardCreateInput {
  name: string;
  description?: string;
  layout?: Partial<DashboardLayout>;
  isPublic?: boolean;
  isDefault?: boolean;
}

export interface DashboardUpdateInput {
  name?: string;
  description?: string;
  layout?: DashboardLayout;
  isPublic?: boolean;
  isDefault?: boolean;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  category: string;
  thumbnail?: string;
  layout: DashboardLayout;
  widgets: Omit<DashboardWidget, 'id' | 'dashboardId'>[];
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
}

// =============================================================================
// REPORT TYPES
// =============================================================================

export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface ReportRecipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
  userId?: string;
  attachReport?: boolean;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  name?: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: ReportRecipient[];
  outputFormat: ReportFormat;
  parameters?: Record<string, unknown>;
  emailSubject?: string;
  emailBody?: string;
  isActive: boolean;
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed' | 'partial';
  nextRunAt?: Date;
  runCount: number;
}

export interface ReportScheduleCreateInput {
  reportId: string;
  name?: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone?: string;
  recipients: ReportRecipient[];
  outputFormat?: ReportFormat;
  parameters?: Record<string, unknown>;
  emailSubject?: string;
  emailBody?: string;
}

export interface ReportInstance {
  id: string;
  scheduleId?: string;
  reportId: string;
  generatedAt: Date;
  generatedBy: string;
  parameters: Record<string, unknown>;
  format: ReportFormat;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  expiresAt?: Date;
  downloadCount: number;
  recipients?: ReportRecipient[];
  deliveryStatus?: 'pending' | 'sent' | 'partial' | 'failed';
}

export interface ReportGenerateInput {
  reportId: string;
  format: ReportFormat;
  parameters?: Record<string, unknown>;
  recipients?: ReportRecipient[];
  sendEmail?: boolean;
  /** ID of the user generating this report. Falls back to 'system' when not provided. */
  generatedBy?: string;
}

// =============================================================================
// QUERY BUILDER TYPES
// =============================================================================

export interface QueryBuilderOptions {
  table: string;
  select?: string[];
  where?: QueryFilter[];
  groupBy?: string[];
  orderBy?: QueryOrderBy[];
  limit?: number;
  offset?: number;
  joins?: QueryJoin[];
}

export interface QueryJoin {
  table: string;
  on: string;
  type: 'inner' | 'left' | 'right';
}

export interface AggregatedResult {
  dimension?: string;
  value: number;
  count?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  took: number;
  cached?: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// CHART DATA TYPES
// =============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MultiSeriesDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ChartData {
  type: WidgetType;
  data: ChartDataPoint[] | TimeSeriesDataPoint[] | MultiSeriesDataPoint[];
  series?: { key: string; name: string; color?: string }[];
  xAxisKey?: string;
  yAxisKey?: string;
}
