// =============================================================================
// L-ERP MRP - KPI SERVICE
// Service for KPI calculations and management
// =============================================================================

import { prisma } from '@/lib/prisma';
import type {
  KPIDefinition,
  KPIValue,
  KPITrend,
  KPITrendPoint,
  KPICalculationParams,
  KPICategory,
  KPIStatus,
  TrendPeriod,
} from './types';

// =============================================================================
// SYSTEM KPI DEFINITIONS
// =============================================================================

export const SYSTEM_KPIS: Omit<KPIDefinition, 'id'>[] = [
  // Inventory KPIs
  {
    code: 'INV_VALUE',
    name: 'Total Inventory Value',
    nameVi: 'Tổng giá trị tồn kho',
    description: 'Total value of all inventory on hand',
    category: 'inventory',
    formula: 'SUM(inventory.quantity * parts.unitCost)',
    dataSource: 'inventory',
    aggregation: 'SUM',
    unit: 'VND',
    format: 'currency',
    precision: 0,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 1,
  },
  {
    code: 'INV_TURNOVER',
    name: 'Inventory Turnover',
    nameVi: 'Vòng quay tồn kho',
    description: 'Number of times inventory is sold and replaced over a period',
    category: 'inventory',
    formula: 'COGS / AVG(inventory value)',
    dataSource: 'inventory',
    aggregation: 'CUSTOM',
    unit: 'x',
    format: 'decimal',
    precision: 2,
    warningThreshold: 4,
    criticalThreshold: 2,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 2,
  },
  {
    code: 'INV_LOW_STOCK',
    name: 'Low Stock Items',
    nameVi: 'Vật tư sắp hết',
    description: 'Number of items below reorder point',
    category: 'inventory',
    formula: 'COUNT(inventory WHERE quantity <= reorderPoint)',
    dataSource: 'inventory',
    aggregation: 'COUNT',
    unit: 'items',
    format: 'number',
    precision: 0,
    warningThreshold: 10,
    criticalThreshold: 20,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'day',
    isActive: true,
    isSystem: true,
    sortOrder: 3,
  },
  {
    code: 'INV_OUT_STOCK',
    name: 'Out of Stock Items',
    nameVi: 'Vật tư hết hàng',
    description: 'Number of items with zero stock',
    category: 'inventory',
    formula: 'COUNT(inventory WHERE quantity = 0)',
    dataSource: 'inventory',
    aggregation: 'COUNT',
    unit: 'items',
    format: 'number',
    precision: 0,
    warningThreshold: 5,
    criticalThreshold: 10,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'day',
    isActive: true,
    isSystem: true,
    sortOrder: 4,
  },
  // Sales KPIs
  {
    code: 'REVENUE_MTD',
    name: 'Revenue MTD',
    nameVi: 'Doanh thu tháng',
    description: 'Total revenue month to date',
    category: 'sales',
    formula: 'SUM(salesOrders.totalAmount WHERE thisMonth)',
    dataSource: 'sales',
    aggregation: 'SUM',
    unit: 'VND',
    format: 'currency',
    precision: 0,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 5,
  },
  {
    code: 'ORDER_COUNT',
    name: 'Orders This Month',
    nameVi: 'Đơn hàng tháng này',
    description: 'Total number of orders this month',
    category: 'sales',
    formula: 'COUNT(salesOrders WHERE thisMonth)',
    dataSource: 'sales',
    aggregation: 'COUNT',
    unit: 'orders',
    format: 'number',
    precision: 0,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 6,
  },
  {
    code: 'AVG_ORDER_VALUE',
    name: 'Average Order Value',
    nameVi: 'Giá trị đơn hàng TB',
    description: 'Average value per order',
    category: 'sales',
    formula: 'AVG(salesOrders.totalAmount)',
    dataSource: 'sales',
    aggregation: 'AVG',
    unit: 'VND',
    format: 'currency',
    precision: 0,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 7,
  },
  // Production KPIs
  {
    code: 'ON_TIME_DELIVERY',
    name: 'On-Time Delivery Rate',
    nameVi: 'Tỷ lệ giao đúng hạn',
    description: 'Percentage of orders delivered on time',
    category: 'production',
    formula: 'COUNT(onTime) / COUNT(total) * 100',
    dataSource: 'production',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 1,
    warningThreshold: 90,
    criticalThreshold: 80,
    targetValue: 95,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 8,
  },
  {
    code: 'PRODUCTION_EFFICIENCY',
    name: 'Production Efficiency',
    nameVi: 'Hiệu suất sản xuất',
    description: 'Actual output vs planned output',
    category: 'production',
    formula: 'SUM(completedQty) / SUM(plannedQty) * 100',
    dataSource: 'production',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 1,
    warningThreshold: 85,
    criticalThreshold: 75,
    targetValue: 95,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 9,
  },
  {
    code: 'ACTIVE_WORK_ORDERS',
    name: 'Active Work Orders',
    nameVi: 'Lệnh SX đang chạy',
    description: 'Number of work orders in progress',
    category: 'production',
    formula: 'COUNT(workOrders WHERE status = IN_PROGRESS)',
    dataSource: 'production',
    aggregation: 'COUNT',
    unit: 'orders',
    format: 'number',
    precision: 0,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'day',
    isActive: true,
    isSystem: true,
    sortOrder: 10,
  },
  // Quality KPIs
  {
    code: 'FIRST_PASS_YIELD',
    name: 'First Pass Yield',
    nameVi: 'Tỷ lệ đạt lần đầu',
    description: 'Percentage of products passing inspection on first attempt',
    category: 'quality',
    formula: 'COUNT(passed) / COUNT(inspected) * 100',
    dataSource: 'quality',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 1,
    warningThreshold: 95,
    criticalThreshold: 90,
    targetValue: 99,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 11,
  },
  {
    code: 'DEFECT_RATE',
    name: 'Defect Rate',
    nameVi: 'Tỷ lệ lỗi',
    description: 'Percentage of defective products',
    category: 'quality',
    formula: 'COUNT(defects) / COUNT(produced) * 100',
    dataSource: 'quality',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 2,
    warningThreshold: 2,
    criticalThreshold: 5,
    targetValue: 0.5,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 12,
  },
  {
    code: 'OPEN_NCRS',
    name: 'Open NCRs',
    nameVi: 'NCR đang mở',
    description: 'Number of open non-conformance reports',
    category: 'quality',
    formula: 'COUNT(ncrs WHERE status != closed)',
    dataSource: 'quality',
    aggregation: 'COUNT',
    unit: 'NCRs',
    format: 'number',
    precision: 0,
    warningThreshold: 10,
    criticalThreshold: 20,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'day',
    isActive: true,
    isSystem: true,
    sortOrder: 13,
  },
  {
    code: 'OPEN_CAPAS',
    name: 'Open CAPAs',
    nameVi: 'CAPA đang mở',
    description: 'Number of open corrective actions',
    category: 'quality',
    formula: 'COUNT(capas WHERE status != closed)',
    dataSource: 'quality',
    aggregation: 'COUNT',
    unit: 'CAPAs',
    format: 'number',
    precision: 0,
    warningThreshold: 5,
    criticalThreshold: 10,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'day',
    isActive: true,
    isSystem: true,
    sortOrder: 14,
  },
  // Supplier KPIs
  {
    code: 'SUPPLIER_OTD',
    name: 'Supplier On-Time Delivery',
    nameVi: 'NCC giao đúng hạn',
    description: 'Percentage of POs delivered on time by suppliers',
    category: 'supplier',
    formula: 'COUNT(onTime) / COUNT(total) * 100',
    dataSource: 'supplier',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 1,
    warningThreshold: 90,
    criticalThreshold: 80,
    targetValue: 95,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 15,
  },
  {
    code: 'AVG_LEAD_TIME',
    name: 'Average Lead Time',
    nameVi: 'Lead time trung bình',
    description: 'Average supplier lead time in days',
    category: 'supplier',
    formula: 'AVG(suppliers.leadTimeDays)',
    dataSource: 'supplier',
    aggregation: 'AVG',
    unit: 'days',
    format: 'number',
    precision: 1,
    warningThreshold: 21,
    criticalThreshold: 30,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 16,
  },
  // Financial KPIs
  {
    code: 'GROSS_MARGIN',
    name: 'Gross Margin',
    nameVi: 'Biên lợi nhuận gộp',
    description: 'Gross profit as percentage of revenue',
    category: 'financial',
    formula: '(Revenue - COGS) / Revenue * 100',
    dataSource: 'financial',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 1,
    warningThreshold: 25,
    criticalThreshold: 15,
    targetValue: 35,
    thresholdDirection: 'higher_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 17,
  },
  {
    code: 'COST_VARIANCE',
    name: 'Cost Variance',
    nameVi: 'Chênh lệch chi phí',
    description: 'Actual cost vs standard cost variance percentage',
    category: 'financial',
    formula: '(Actual - Standard) / Standard * 100',
    dataSource: 'financial',
    aggregation: 'CUSTOM',
    unit: '%',
    format: 'percent',
    precision: 1,
    warningThreshold: 5,
    criticalThreshold: 10,
    thresholdDirection: 'lower_is_better',
    trendPeriod: 'month',
    isActive: true,
    isSystem: true,
    sortOrder: 18,
  },
];

// =============================================================================
// KPI SERVICE CLASS
// =============================================================================

class KPIService {
  // ---------------------------------------------------------------------------
  // KPI Definition Management
  // ---------------------------------------------------------------------------

  async getKPIDefinitions(category?: KPICategory): Promise<KPIDefinition[]> {
    const where = category ? { category, isActive: true } : { isActive: true };

    const definitions = await prisma.kPIDefinition.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    return definitions as unknown as KPIDefinition[];
  }

  async getKPIDefinition(code: string): Promise<KPIDefinition | null> {
    const definition = await prisma.kPIDefinition.findUnique({
      where: { code },
    });

    return definition as unknown as KPIDefinition | null;
  }

  async seedSystemKPIs(): Promise<void> {
    for (const kpi of SYSTEM_KPIS) {
      await prisma.kPIDefinition.upsert({
        where: { code: kpi.code },
        update: {
          name: kpi.name,
          nameVi: kpi.nameVi,
          description: kpi.description,
          category: kpi.category,
          formula: kpi.formula,
          dataSource: kpi.dataSource,
          aggregation: kpi.aggregation,
          unit: kpi.unit,
          format: kpi.format,
          precision: kpi.precision,
          warningThreshold: kpi.warningThreshold,
          criticalThreshold: kpi.criticalThreshold,
          targetValue: kpi.targetValue,
          thresholdDirection: kpi.thresholdDirection,
          trendPeriod: kpi.trendPeriod,
          isActive: kpi.isActive,
          sortOrder: kpi.sortOrder,
        },
        create: {
          code: kpi.code,
          name: kpi.name,
          nameVi: kpi.nameVi,
          description: kpi.description,
          descriptionVi: kpi.descriptionVi,
          category: kpi.category,
          formula: kpi.formula,
          dataSource: kpi.dataSource,
          aggregation: kpi.aggregation,
          unit: kpi.unit,
          format: kpi.format,
          precision: kpi.precision,
          warningThreshold: kpi.warningThreshold,
          criticalThreshold: kpi.criticalThreshold,
          targetValue: kpi.targetValue,
          thresholdDirection: kpi.thresholdDirection,
          trendPeriod: kpi.trendPeriod,
          isActive: kpi.isActive,
          isSystem: kpi.isSystem,
          sortOrder: kpi.sortOrder,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // KPI Calculations
  // ---------------------------------------------------------------------------

  async calculateKPI(code: string, params: KPICalculationParams = {}): Promise<KPIValue> {
    const definition = await this.getKPIDefinition(code);
    if (!definition) {
      throw new Error(`KPI definition not found: ${code}`);
    }

    const value = await this.computeKPIValue(definition, params);
    const status = this.determineKPIStatus(value, definition);
    const formattedValue = this.formatKPIValue(value, definition);

    let trend: KPITrend | undefined;
    if (params.includeTrend) {
      trend = await this.calculateTrend(definition, params);
    }

    let previousValue: number | undefined;
    let changePercent: number | undefined;
    if (trend && trend.data.length > 1) {
      previousValue = trend.data[trend.data.length - 2]?.value;
      if (previousValue && previousValue !== 0) {
        changePercent = ((value - previousValue) / previousValue) * 100;
      }
    }

    return {
      code,
      value,
      formattedValue,
      status,
      trend,
      previousValue,
      changePercent,
      target: definition.targetValue,
      targetPercent: definition.targetValue ? (value / definition.targetValue) * 100 : undefined,
      timestamp: new Date(),
    };
  }

  async calculateKPIs(codes: string[], params: KPICalculationParams = {}): Promise<KPIValue[]> {
    return Promise.all(codes.map(code => this.calculateKPI(code, params)));
  }

  async getKPIWithTrend(code: string, periods: number = 6): Promise<KPIValue> {
    return this.calculateKPI(code, { includeTrend: true, trendPeriods: periods });
  }

  async getAllKPIsByCategory(category: KPICategory, params: KPICalculationParams = {}): Promise<KPIValue[]> {
    const definitions = await this.getKPIDefinitions(category);
    const codes = definitions.map(d => d.code);
    return this.calculateKPIs(codes, params);
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private async computeKPIValue(definition: KPIDefinition, params: KPICalculationParams): Promise<number> {
    const { dateFrom, dateTo } = this.getDateRange(params);

    switch (definition.code) {
      case 'INV_VALUE':
        return this.calculateInventoryValue();
      case 'INV_TURNOVER':
        return this.calculateInventoryTurnover(dateFrom, dateTo);
      case 'INV_LOW_STOCK':
        return this.calculateLowStockCount();
      case 'INV_OUT_STOCK':
        return this.calculateOutOfStockCount();
      case 'REVENUE_MTD':
        return this.calculateRevenueMTD(dateFrom, dateTo);
      case 'ORDER_COUNT':
        return this.calculateOrderCount(dateFrom, dateTo);
      case 'AVG_ORDER_VALUE':
        return this.calculateAvgOrderValue(dateFrom, dateTo);
      case 'ON_TIME_DELIVERY':
        return this.calculateOnTimeDelivery(dateFrom, dateTo);
      case 'PRODUCTION_EFFICIENCY':
        return this.calculateProductionEfficiency(dateFrom, dateTo);
      case 'ACTIVE_WORK_ORDERS':
        return this.calculateActiveWorkOrders();
      case 'FIRST_PASS_YIELD':
        return this.calculateFirstPassYield(dateFrom, dateTo);
      case 'DEFECT_RATE':
        return this.calculateDefectRate(dateFrom, dateTo);
      case 'OPEN_NCRS':
        return this.calculateOpenNCRs();
      case 'OPEN_CAPAS':
        return this.calculateOpenCAPAs();
      case 'SUPPLIER_OTD':
        return this.calculateSupplierOTD(dateFrom, dateTo);
      case 'AVG_LEAD_TIME':
        return this.calculateAvgLeadTime();
      case 'GROSS_MARGIN':
        return this.calculateGrossMargin(dateFrom, dateTo);
      case 'COST_VARIANCE':
        return this.calculateCostVariance(dateFrom, dateTo);
      default:
        return 0;
    }
  }

  private determineKPIStatus(value: number, definition: KPIDefinition): KPIStatus {
    if (!definition.warningThreshold && !definition.criticalThreshold) {
      return 'normal';
    }

    const isHigherBetter = definition.thresholdDirection === 'higher_is_better';

    if (definition.criticalThreshold !== undefined && definition.criticalThreshold !== null) {
      if (isHigherBetter && value < definition.criticalThreshold) return 'critical';
      if (!isHigherBetter && value > definition.criticalThreshold) return 'critical';
    }

    if (definition.warningThreshold !== undefined && definition.warningThreshold !== null) {
      if (isHigherBetter && value < definition.warningThreshold) return 'warning';
      if (!isHigherBetter && value > definition.warningThreshold) return 'warning';
    }

    return 'normal';
  }

  private formatKPIValue(value: number, definition: KPIDefinition): string {
    const { format, precision, unit } = definition;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${value.toFixed(precision)}%`;
      case 'decimal':
        return value.toFixed(precision) + (unit ? ` ${unit}` : '');
      default:
        return new Intl.NumberFormat('vi-VN', {
          maximumFractionDigits: precision,
        }).format(value) + (unit ? ` ${unit}` : '');
    }
  }

  private getDateRange(params: KPICalculationParams): { dateFrom: Date; dateTo: Date } {
    const now = new Date();

    if (params.dateFrom && params.dateTo) {
      return { dateFrom: params.dateFrom, dateTo: params.dateTo };
    }

    const period = params.period || 'month';
    const dateFrom = new Date(now);

    switch (period) {
      case 'day':
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'quarter':
        dateFrom.setMonth(dateFrom.getMonth() - 3);
        break;
      case 'year':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }

    return { dateFrom, dateTo: now };
  }

  private async calculateTrend(definition: KPIDefinition, params: KPICalculationParams): Promise<KPITrend> {
    const periods = params.trendPeriods || 6;
    const trendPeriod = definition.trendPeriod;
    const data: KPITrendPoint[] = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const dateTo = new Date(now);
      const dateFrom = new Date(now);

      switch (trendPeriod) {
        case 'day':
          dateTo.setDate(dateTo.getDate() - i);
          dateFrom.setDate(dateFrom.getDate() - i - 1);
          break;
        case 'week':
          dateTo.setDate(dateTo.getDate() - i * 7);
          dateFrom.setDate(dateFrom.getDate() - (i + 1) * 7);
          break;
        case 'month':
          dateTo.setMonth(dateTo.getMonth() - i);
          dateFrom.setMonth(dateFrom.getMonth() - i - 1);
          break;
        case 'quarter':
          dateTo.setMonth(dateTo.getMonth() - i * 3);
          dateFrom.setMonth(dateFrom.getMonth() - (i + 1) * 3);
          break;
        case 'year':
          dateTo.setFullYear(dateTo.getFullYear() - i);
          dateFrom.setFullYear(dateFrom.getFullYear() - i - 1);
          break;
      }

      const value = await this.computeKPIValue(definition, { dateFrom, dateTo });
      data.push({
        date: dateTo.toISOString().split('T')[0],
        value,
      });
    }

    const lastValue = data[data.length - 1]?.value || 0;
    const prevValue = data[data.length - 2]?.value || 0;
    const changePercent = prevValue !== 0 ? ((lastValue - prevValue) / prevValue) * 100 : 0;

    return {
      direction: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable',
      changePercent,
      data,
    };
  }

  // ---------------------------------------------------------------------------
  // Individual KPI Calculations
  // ---------------------------------------------------------------------------

  private async calculateInventoryValue(): Promise<number> {
    const result = await prisma.inventory.aggregate({
      _sum: {
        quantity: true,
      },
    });

    const inventory = await prisma.inventory.findMany({
      include: { part: { select: { unitCost: true } } },
    });

    return inventory.reduce((sum, inv) => {
      return sum + (inv.quantity * (inv.part?.unitCost || 0));
    }, 0);
  }

  private async calculateInventoryTurnover(dateFrom: Date, dateTo: Date): Promise<number> {
    // Simplified calculation: COGS / Average Inventory Value
    const avgInventoryValue = await this.calculateInventoryValue();
    if (avgInventoryValue === 0) return 0;

    const sales = await prisma.salesOrder.aggregate({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
        status: { in: ['DELIVERED', 'SHIPPED', 'COMPLETED'] },
      },
      _sum: { totalAmount: true },
    });

    const cogs = (sales._sum.totalAmount || 0) * 0.7; // Assume 70% COGS ratio
    return cogs / avgInventoryValue;
  }

  private async calculateLowStockCount(): Promise<number> {
    // Count inventory items with low quantity (less than 10 as a simple threshold)
    return prisma.inventory.count({
      where: {
        quantity: { gt: 0, lte: 10 },
      },
    });
  }

  private async calculateOutOfStockCount(): Promise<number> {
    return prisma.inventory.count({
      where: { quantity: { lte: 0 } },
    });
  }

  private async calculateRevenueMTD(dateFrom: Date, dateTo: Date): Promise<number> {
    const result = await prisma.salesOrder.aggregate({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount || 0;
  }

  private async calculateOrderCount(dateFrom: Date, dateTo: Date): Promise<number> {
    return prisma.salesOrder.count({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
      },
    });
  }

  private async calculateAvgOrderValue(dateFrom: Date, dateTo: Date): Promise<number> {
    const result = await prisma.salesOrder.aggregate({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
      },
      _avg: { totalAmount: true },
    });
    return result._avg.totalAmount || 0;
  }

  private async calculateOnTimeDelivery(dateFrom: Date, dateTo: Date): Promise<number> {
    const total = await prisma.salesOrder.count({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
        status: { in: ['DELIVERED', 'SHIPPED', 'COMPLETED'] },
      },
    });

    if (total === 0) return 100;

    const onTime = await prisma.salesOrder.count({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
        status: { in: ['DELIVERED', 'SHIPPED', 'COMPLETED'] },
        // Assuming shippedDate <= requiredDate means on-time
      },
    });

    return (onTime / total) * 100;
  }

  private async calculateProductionEfficiency(dateFrom: Date, dateTo: Date): Promise<number> {
    const result = await prisma.workOrder.aggregate({
      where: {
        plannedStart: { gte: dateFrom, lte: dateTo },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      _sum: {
        quantity: true,
        completedQty: true,
      },
    });

    const planned = result._sum.quantity || 0;
    const completed = result._sum.completedQty || 0;

    if (planned === 0) return 100;
    return (completed / planned) * 100;
  }

  private async calculateActiveWorkOrders(): Promise<number> {
    return prisma.workOrder.count({
      where: {
        status: { in: ['IN_PROGRESS', 'RELEASED'] },
      },
    });
  }

  private async calculateFirstPassYield(dateFrom: Date, dateTo: Date): Promise<number> {
    const total = await prisma.inspection.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'completed',
      },
    });

    if (total === 0) return 100;

    const passed = await prisma.inspection.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'completed',
        result: 'PASS',
      },
    });

    return (passed / total) * 100;
  }

  private async calculateDefectRate(dateFrom: Date, dateTo: Date): Promise<number> {
    const total = await prisma.inspection.aggregate({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'completed',
      },
      _sum: { quantityInspected: true },
    });

    const rejected = await prisma.inspection.aggregate({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'completed',
      },
      _sum: { quantityRejected: true },
    });

    const totalQty = total._sum.quantityInspected || 0;
    const rejectedQty = rejected._sum.quantityRejected || 0;

    if (totalQty === 0) return 0;
    return (rejectedQty / totalQty) * 100;
  }

  private async calculateOpenNCRs(): Promise<number> {
    return prisma.nCR.count({
      where: {
        status: { notIn: ['closed', 'voided'] },
      },
    });
  }

  private async calculateOpenCAPAs(): Promise<number> {
    return prisma.cAPA.count({
      where: {
        status: { notIn: ['closed', 'cancelled'] },
      },
    });
  }

  private async calculateSupplierOTD(dateFrom: Date, dateTo: Date): Promise<number> {
    const total = await prisma.purchaseOrder.count({
      where: {
        orderDate: { gte: dateFrom, lte: dateTo },
        status: { in: ['RECEIVED', 'COMPLETED', 'PARTIAL'] },
      },
    });

    if (total === 0) return 100;

    // For now, return a calculated value based on available data
    // In a real implementation, you'd compare receivedDate with expectedDate
    return 92; // Placeholder
  }

  private async calculateAvgLeadTime(): Promise<number> {
    const result = await prisma.supplier.aggregate({
      where: { status: 'active' },
      _avg: { leadTimeDays: true },
    });
    return result._avg.leadTimeDays || 0;
  }

  private async calculateGrossMargin(dateFrom: Date, dateTo: Date): Promise<number> {
    const revenue = await this.calculateRevenueMTD(dateFrom, dateTo);
    if (revenue === 0) return 0;

    // Simplified: Assume COGS is 70% of revenue
    const cogs = revenue * 0.7;
    return ((revenue - cogs) / revenue) * 100;
  }

  private async calculateCostVariance(dateFrom: Date, dateTo: Date): Promise<number> {
    const variances = await prisma.costVariance.aggregate({
      where: {
        periodYear: { gte: dateFrom.getFullYear(), lte: dateTo.getFullYear() },
        periodMonth: { gte: dateFrom.getMonth() + 1, lte: dateTo.getMonth() + 1 },
      },
      _avg: { variancePercent: true },
    });
    return Math.abs(variances._avg.variancePercent || 0);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const kpiService = new KPIService();
export default kpiService;
