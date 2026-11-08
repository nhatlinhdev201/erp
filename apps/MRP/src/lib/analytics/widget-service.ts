// =============================================================================
// L-ERP MRP - WIDGET SERVICE
// Service for fetching and processing widget data
// =============================================================================

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { kpiService } from './kpi-service';
import type {
  DashboardWidget,
  WidgetData,
  WidgetQueryConfig,
  DataSource,
  ChartData,
  ChartDataPoint,
  TimeSeriesDataPoint,
  MultiSeriesDataPoint,
  QueryFilter,
} from './types';

// =============================================================================
// WIDGET SERVICE CLASS
// =============================================================================

class WidgetService {
  // ---------------------------------------------------------------------------
  // Main Data Fetching
  // ---------------------------------------------------------------------------

  async getWidgetData(widget: DashboardWidget): Promise<WidgetData> {
    const startTime = Date.now();

    try {
      let data: unknown;

      switch (widget.widgetType) {
        case 'kpi':
          data = await this.fetchKPIData(widget);
          break;
        case 'chart-line':
        case 'chart-area':
          data = await this.fetchTimeSeriesData(widget);
          break;
        case 'chart-bar':
          data = await this.fetchBarChartData(widget);
          break;
        case 'chart-pie':
        case 'chart-donut':
          data = await this.fetchPieChartData(widget);
          break;
        case 'gauge':
          data = await this.fetchGaugeData(widget);
          break;
        case 'table':
          data = await this.fetchTableData(widget);
          break;
        case 'sparkline':
          data = await this.fetchSparklineData(widget);
          break;
        default:
          data = null;
      }

      return {
        widgetId: widget.id,
        data,
        metadata: {
          lastUpdated: new Date(),
          cached: false,
        },
      };
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'widget-service', widgetId: widget.id });
      return {
        widgetId: widget.id,
        data: null,
        metadata: {
          lastUpdated: new Date(),
          cached: false,
        },
      };
    }
  }

  async getMultipleWidgetsData(widgets: DashboardWidget[]): Promise<WidgetData[]> {
    return Promise.all(widgets.map(w => this.getWidgetData(w)));
  }

  // ---------------------------------------------------------------------------
  // KPI Widget Data
  // ---------------------------------------------------------------------------

  private async fetchKPIData(widget: DashboardWidget) {
    if (!widget.metric) {
      return null;
    }

    const kpiValue = await kpiService.calculateKPI(widget.metric, {
      includeTrend: widget.displayConfig.showTrend,
      trendPeriods: 6,
    });

    return {
      value: kpiValue.value,
      formattedValue: kpiValue.formattedValue,
      status: kpiValue.status,
      trend: kpiValue.trend,
      changePercent: kpiValue.changePercent,
      target: kpiValue.target,
      targetPercent: kpiValue.targetPercent,
    };
  }

  // ---------------------------------------------------------------------------
  // Time Series Chart Data
  // ---------------------------------------------------------------------------

  private async fetchTimeSeriesData(widget: DashboardWidget): Promise<ChartData> {
    const { dataSource, queryConfig } = widget;
    const dateRange = this.getDateRange(queryConfig);

    let data: TimeSeriesDataPoint[] = [];

    switch (dataSource) {
      case 'sales':
        data = await this.getSalesTimeSeries(dateRange, queryConfig);
        break;
      case 'production':
        data = await this.getProductionTimeSeries(dateRange, queryConfig);
        break;
      case 'quality':
        data = await this.getQualityTimeSeries(dateRange, queryConfig);
        break;
      case 'inventory':
        data = await this.getInventoryTimeSeries(dateRange, queryConfig);
        break;
      default:
        data = [];
    }

    return {
      type: widget.widgetType,
      data,
      xAxisKey: 'date',
      yAxisKey: 'value',
    };
  }

  private async getSalesTimeSeries(
    dateRange: { from: Date; to: Date },
    config: WidgetQueryConfig
  ): Promise<TimeSeriesDataPoint[]> {
    const orders = await prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        orderDate: true,
        totalAmount: true,
      },
      orderBy: { orderDate: 'asc' },
    });

    // Group by month
    const grouped = new Map<string, number>();
    orders.forEach(order => {
      const date = new Date(order.orderDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped.set(key, (grouped.get(key) || 0) + (order.totalAmount || 0));
    });

    return Array.from(grouped.entries()).map(([date, value]) => ({
      date,
      value,
      label: this.formatMonthLabel(date),
    }));
  }

  private async getProductionTimeSeries(
    dateRange: { from: Date; to: Date },
    config: WidgetQueryConfig
  ): Promise<TimeSeriesDataPoint[]> {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        plannedStart: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        plannedStart: true,
        completedQty: true,
        quantity: true,
      },
      orderBy: { plannedStart: 'asc' },
    });

    // Group by week
    const grouped = new Map<string, { completed: number; planned: number }>();
    workOrders.forEach(wo => {
      if (!wo.plannedStart) return;
      const date = new Date(wo.plannedStart);
      const weekStart = this.getWeekStart(date);
      const key = weekStart.toISOString().split('T')[0];
      const current = grouped.get(key) || { completed: 0, planned: 0 };
      grouped.set(key, {
        completed: current.completed + (wo.completedQty || 0),
        planned: current.planned + (wo.quantity || 0),
      });
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      value: data.planned > 0 ? (data.completed / data.planned) * 100 : 0,
      label: this.formatWeekLabel(date),
    }));
  }

  private async getQualityTimeSeries(
    dateRange: { from: Date; to: Date },
    config: WidgetQueryConfig
  ): Promise<TimeSeriesDataPoint[]> {
    const inspections = await prisma.inspection.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        status: 'completed',
      },
      _count: { result: true },
    });

    // Group by month
    const grouped = new Map<string, { passed: number; total: number }>();

    for (const insp of inspections) {
      const date = new Date(insp.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = grouped.get(key) || { passed: 0, total: 0 };
      current.total += insp._count.result;
      grouped.set(key, current);
    }

    // Get passed counts
    const passedInspections = await prisma.inspection.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        status: 'completed',
        result: 'PASS',
      },
      _count: { result: true },
    });

    for (const insp of passedInspections) {
      const date = new Date(insp.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = grouped.get(key);
      if (current) {
        current.passed += insp._count.result;
      }
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      value: data.total > 0 ? (data.passed / data.total) * 100 : 100,
      label: this.formatMonthLabel(date),
    }));
  }

  private async getInventoryTimeSeries(
    dateRange: { from: Date; to: Date },
    config: WidgetQueryConfig
  ): Promise<TimeSeriesDataPoint[]> {
    // For inventory, we'll show current snapshot since historical data isn't typically tracked
    const inventory = await prisma.inventory.findMany({
      include: { part: { select: { unitCost: true, category: true } } },
    });

    // Group by category
    const grouped = new Map<string, number>();
    inventory.forEach(inv => {
      const category = inv.part?.category || 'Other';
      grouped.set(category, (grouped.get(category) || 0) + (inv.quantity * (inv.part?.unitCost || 0)));
    });

    return Array.from(grouped.entries()).map(([category, value]) => ({
      date: category,
      value,
      label: category,
    }));
  }

  // ---------------------------------------------------------------------------
  // Bar Chart Data
  // ---------------------------------------------------------------------------

  private async fetchBarChartData(widget: DashboardWidget): Promise<ChartData> {
    const { dataSource, queryConfig } = widget;
    let data: ChartDataPoint[] = [];

    switch (dataSource) {
      case 'sales':
        data = await this.getSalesByCategory(queryConfig);
        break;
      case 'production':
        data = await this.getWorkOrdersByStatus(queryConfig);
        break;
      case 'quality':
        data = await this.getNCRsByCategory(queryConfig);
        break;
      case 'inventory':
        data = await this.getInventoryByCategory(queryConfig);
        break;
      case 'supplier':
        data = await this.getSuppliersByRating(queryConfig);
        break;
      default:
        data = [];
    }

    return {
      type: 'chart-bar',
      data,
    };
  }

  private async getSalesByCategory(config: WidgetQueryConfig): Promise<ChartDataPoint[]> {
    const dateRange = this.getDateRange(config);

    const sales = await prisma.salesOrderLine.findMany({
      where: {
        order: {
          orderDate: { gte: dateRange.from, lte: dateRange.to },
        },
      },
      include: {
        product: { select: { name: true } },
      },
    });

    const grouped = new Map<string, number>();
    sales.forEach(line => {
      const productName = line.product?.name || 'Other';
      grouped.set(productName, (grouped.get(productName) || 0) + (line.lineTotal || 0));
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  private async getWorkOrdersByStatus(config: WidgetQueryConfig): Promise<ChartDataPoint[]> {
    const counts = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusLabels: Record<string, string> = {
      PLANNED: 'Kế hoạch',
      RELEASED: 'Đã phát hành',
      IN_PROGRESS: 'Đang thực hiện',
      ON_HOLD: 'Tạm dừng',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };

    return counts.map(c => ({
      name: statusLabels[c.status] || c.status,
      value: c._count.status,
    }));
  }

  private async getNCRsByCategory(config: WidgetQueryConfig): Promise<ChartDataPoint[]> {
    const ncrs = await prisma.nCR.groupBy({
      by: ['defectCategory'],
      _count: { defectCategory: true },
      where: {
        status: { notIn: ['closed', 'voided'] },
      },
    });

    return ncrs.map(n => ({
      name: n.defectCategory || 'Không phân loại',
      value: n._count.defectCategory,
    }));
  }

  private async getInventoryByCategory(config: WidgetQueryConfig): Promise<ChartDataPoint[]> {
    const inventory = await prisma.inventory.findMany({
      include: { part: { select: { category: true, unitCost: true } } },
    });

    const grouped = new Map<string, number>();
    inventory.forEach(inv => {
      const category = inv.part?.category || 'Other';
      grouped.set(category, (grouped.get(category) || 0) + (inv.quantity * (inv.part?.unitCost || 0)));
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  private async getSuppliersByRating(config: WidgetQueryConfig): Promise<ChartDataPoint[]> {
    const suppliers = await prisma.supplier.groupBy({
      by: ['rating'],
      _count: { rating: true },
      where: { status: 'active' },
    });

    const ratingLabels = ['1 Sao', '2 Sao', '3 Sao', '4 Sao', '5 Sao'];

    return suppliers.map(s => ({
      name: ratingLabels[Math.floor((s.rating || 0)) - 1] || `${s.rating} Sao`,
      value: s._count.rating,
    }));
  }

  // ---------------------------------------------------------------------------
  // Pie Chart Data
  // ---------------------------------------------------------------------------

  private async fetchPieChartData(widget: DashboardWidget): Promise<ChartData> {
    // Pie charts use similar data structure as bar charts
    const barData = await this.fetchBarChartData(widget);
    return {
      ...barData,
      type: widget.widgetType,
    };
  }

  // ---------------------------------------------------------------------------
  // Gauge Data
  // ---------------------------------------------------------------------------

  private async fetchGaugeData(widget: DashboardWidget) {
    if (!widget.metric) {
      return { value: 0, min: 0, max: 100 };
    }

    const kpiValue = await kpiService.calculateKPI(widget.metric);

    return {
      value: kpiValue.value,
      min: 0,
      max: 100,
      target: kpiValue.target,
      status: kpiValue.status,
    };
  }

  // ---------------------------------------------------------------------------
  // Table Data
  // ---------------------------------------------------------------------------

  private async fetchTableData(widget: DashboardWidget) {
    const { dataSource, queryConfig } = widget;
    const limit = queryConfig.limit || 10;

    switch (dataSource) {
      case 'sales':
        return this.getSalesTableData(queryConfig, limit);
      case 'production':
        return this.getProductionTableData(queryConfig, limit);
      case 'quality':
        return this.getQualityTableData(queryConfig, limit);
      case 'inventory':
        return this.getInventoryTableData(queryConfig, limit);
      case 'supplier':
        return this.getSupplierTableData(queryConfig, limit);
      default:
        return { columns: [], rows: [] };
    }
  }

  private async getSalesTableData(config: WidgetQueryConfig, limit: number) {
    const orders = await prisma.salesOrder.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { orderDate: 'desc' },
      take: limit,
    });

    return {
      columns: [
        { key: 'orderNumber', label: 'Mã đơn', width: 120 },
        { key: 'customerName', label: 'Khách hàng', width: 200 },
        { key: 'orderDate', label: 'Ngày đặt', width: 100 },
        { key: 'totalAmount', label: 'Tổng tiền', width: 150 },
        { key: 'status', label: 'Trạng thái', width: 100 },
      ],
      rows: orders.map(o => ({
        orderNumber: o.orderNumber,
        customerName: o.customer?.name || '',
        orderDate: new Date(o.orderDate).toLocaleDateString('vi-VN'),
        totalAmount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.totalAmount || 0),
        status: o.status,
      })),
    };
  }

  private async getProductionTableData(config: WidgetQueryConfig, limit: number) {
    const filters = this.buildWhereClause(config.filters || []);

    const workOrders = await prisma.workOrder.findMany({
      where: filters,
      include: { product: { select: { sku: true, name: true } } },
      orderBy: { plannedStart: 'desc' },
      take: limit,
    });

    return {
      columns: [
        { key: 'orderNumber', label: 'Mã lệnh', width: 120 },
        { key: 'productName', label: 'Sản phẩm', width: 200 },
        { key: 'quantity', label: 'SL kế hoạch', width: 100 },
        { key: 'completedQty', label: 'SL hoàn thành', width: 100 },
        { key: 'progress', label: 'Tiến độ', width: 80 },
        { key: 'status', label: 'Trạng thái', width: 100 },
      ],
      rows: workOrders.map(wo => ({
        orderNumber: wo.woNumber,
        productName: wo.product?.name || wo.product?.sku || '',
        quantity: wo.quantity,
        completedQty: wo.completedQty || 0,
        progress: `${Math.round(((wo.completedQty || 0) / wo.quantity) * 100)}%`,
        status: wo.status,
      })),
    };
  }

  private async getQualityTableData(config: WidgetQueryConfig, limit: number) {
    const ncrs = await prisma.nCR.findMany({
      where: { status: { notIn: ['closed', 'voided'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      columns: [
        { key: 'ncrNumber', label: 'Mã NCR', width: 120 },
        { key: 'title', label: 'Tiêu đề', width: 250 },
        { key: 'priority', label: 'Độ ưu tiên', width: 100 },
        { key: 'status', label: 'Trạng thái', width: 100 },
        { key: 'createdAt', label: 'Ngày tạo', width: 100 },
      ],
      rows: ncrs.map(n => ({
        ncrNumber: n.ncrNumber,
        title: n.title,
        priority: n.priority,
        status: n.status,
        createdAt: new Date(n.createdAt).toLocaleDateString('vi-VN'),
      })),
    };
  }

  private async getInventoryTableData(config: WidgetQueryConfig, limit: number) {
    const inventory = await prisma.inventory.findMany({
      include: { part: { select: { partNumber: true, name: true, unitCost: true } } },
      orderBy: { quantity: 'asc' },
      take: limit,
    });

    return {
      columns: [
        { key: 'partNumber', label: 'Mã vật tư', width: 120 },
        { key: 'partName', label: 'Tên vật tư', width: 200 },
        { key: 'quantity', label: 'Tồn kho', width: 100 },
        { key: 'status', label: 'Trạng thái', width: 100 },
      ],
      rows: inventory.map(inv => ({
        partNumber: inv.part?.partNumber || '',
        partName: inv.part?.name || '',
        quantity: inv.quantity,
        status: inv.quantity <= 0 ? 'Hết hàng' : inv.quantity <= 10 ? 'Sắp hết' : 'Đủ hàng',
      })),
    };
  }

  private async getSupplierTableData(config: WidgetQueryConfig, limit: number) {
    const suppliers = await prisma.supplier.findMany({
      where: { status: 'active' },
      orderBy: { rating: 'desc' },
      take: limit,
    });

    return {
      columns: [
        { key: 'code', label: 'Mã NCC', width: 100 },
        { key: 'name', label: 'Tên NCC', width: 200 },
        { key: 'leadTimeDays', label: 'Lead time', width: 100 },
        { key: 'rating', label: 'Đánh giá', width: 100 },
        { key: 'ndaaCompliant', label: 'NDAA', width: 80 },
      ],
      rows: suppliers.map(s => ({
        code: s.code,
        name: s.name,
        leadTimeDays: `${s.leadTimeDays} ngày`,
        rating: s.rating ? `${s.rating.toFixed(1)} ⭐` : 'N/A',
        ndaaCompliant: s.ndaaCompliant ? '✓' : '✗',
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Sparkline Data
  // ---------------------------------------------------------------------------

  private async fetchSparklineData(widget: DashboardWidget) {
    if (!widget.metric) {
      return { data: [] };
    }

    const kpiValue = await kpiService.getKPIWithTrend(widget.metric, 7);

    return {
      data: kpiValue.trend?.data || [],
      currentValue: kpiValue.value,
      changePercent: kpiValue.changePercent,
    };
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private getDateRange(config: WidgetQueryConfig): { from: Date; to: Date } {
    const now = new Date();
    const dateRange = config.dateRange;

    if (dateRange?.type === 'custom' && dateRange.from && dateRange.to) {
      return {
        from: new Date(dateRange.from),
        to: new Date(dateRange.to),
      };
    }

    const preset = dateRange?.preset || 'last30days';
    const from = new Date(now);

    switch (preset) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        from.setDate(from.getDate() - 7);
        break;
      case 'last30days':
        from.setDate(from.getDate() - 30);
        break;
      case 'thisMonth':
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
      case 'lastMonth':
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
      case 'thisQuarter':
        from.setMonth(Math.floor(from.getMonth() / 3) * 3);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
      case 'thisYear':
        from.setMonth(0);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
      default:
        from.setDate(from.getDate() - 30);
    }

    return { from, to: now };
  }

  private buildWhereClause(filters: QueryFilter[]): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = filter.value;
          break;
        case 'ne':
          where[filter.field] = { not: filter.value };
          break;
        case 'gt':
          where[filter.field] = { gt: filter.value };
          break;
        case 'gte':
          where[filter.field] = { gte: filter.value };
          break;
        case 'lt':
          where[filter.field] = { lt: filter.value };
          break;
        case 'lte':
          where[filter.field] = { lte: filter.value };
          break;
        case 'in':
          where[filter.field] = { in: filter.value };
          break;
        case 'notIn':
          where[filter.field] = { notIn: filter.value };
          break;
        case 'contains':
          where[filter.field] = { contains: filter.value, mode: 'insensitive' };
          break;
        case 'between': {
          const [rangeStart, rangeEnd] = filter.value as [unknown, unknown];
          where[filter.field] = { gte: rangeStart, lte: rangeEnd };
          break;
        }
      }
    }

    return where;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private formatMonthLabel(dateStr: string): string {
    const [year, month] = dateStr.split('-');
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  }

  private formatWeekLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const widgetService = new WidgetService();
export default widgetService;
