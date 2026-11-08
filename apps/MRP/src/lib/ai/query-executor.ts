// =============================================================================
// DATABASE QUERY GENERATOR
// Translates AI intents into database queries for L-ERP MRP
// =============================================================================

import { QueryIntent, DetectedIntent } from './prompts';
import { prismaDataFetcher } from './prisma-data-fetcher';

// =============================================================================
// TYPES
// =============================================================================

export interface QueryResult {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

export interface InventorySummary {
  totalItems: number;
  okCount: number;
  lowCount: number;
  outCount: number;
  totalValue: number;
}

export interface InventoryAlert {
  partNumber: string;
  partName: string;
  onHand: number;
  minStock: number;
  safetyStock: number;
  reorderPoint: number;
  status: string;
  unitCost: number;
  unit: string;
  category: string;
  isCritical: boolean;
}

export interface OrdersSummary {
  totalOrders: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  monthlyRevenue: number;
  growthPercent: number;
}

export interface ProductionSummary {
  efficiency: number;
  runningCount: number;
  waitingCount: number;
  completedToday: number;
  completedWeek: number;
}

export interface MRPResults {
  requirements: Record<string, unknown>[];
  shortages: Record<string, unknown>[];
  suggestions: Record<string, unknown>[];
}

export interface QualitySummary {
  passRate: number;
  openNCRs: number;
  inspectionsToday: number;
  passedToday: number;
  failedToday: number;
}

export interface AnalyticsData {
  revenue: { thisMonth: number; lastMonth: number; growth: number };
  production: { efficiency: number; lastMonthEfficiency: number };
  inventory: { turnover: number; avgDaysOnHand: number; totalValue: number };
  quality?: QualitySummary;
  [key: string]: unknown;
}

export interface PurchaseSuggestion {
  partNumber: string;
  partName: string;
  supplier: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  priority: string;
  leadTimeDays: number;
  orderDate: string;
}

export interface WorkOrderInfo {
  orderNumber: string;
  product: string;
  productName?: string;
  status: string;
  progress: number;
  quantity: number;
  completedQty: number;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface DataFetcher {
  getInventorySummary: () => Promise<InventorySummary>;
  getInventoryAlerts: () => Promise<InventoryAlert[]>;
  getInventoryByParts: (partNumbers: string[]) => Promise<InventoryAlert[]>;
  getOrdersSummary: () => Promise<OrdersSummary>;
  getOrdersByNumbers: (orderNumbers: string[]) => Promise<Record<string, unknown>[]>;
  getPendingOrders: () => Promise<Record<string, unknown>[]>;
  getRecentOrders: (limit: number) => Promise<Record<string, unknown>[]>;
  getProductionSummary: () => Promise<ProductionSummary>;
  getWorkOrders: (status?: string) => Promise<WorkOrderInfo[]>;
  getMRPResults: (orderIds: string[]) => Promise<MRPResults>;
  getPurchaseSuggestions: () => Promise<PurchaseSuggestion[]>;
  getQualitySummary: () => Promise<QualitySummary>;
  getOpenNCRs: () => Promise<Record<string, unknown>[]>;
  getAnalytics: (period: string) => Promise<AnalyticsData>;
  getSupplierInfo: (supplierNames?: string[]) => Promise<Record<string, unknown>[]>;
}

// Data fetching is handled by prismaDataFetcher (see src/lib/ai/prisma-data-fetcher.ts)

// =============================================================================
// QUERY EXECUTOR
// =============================================================================

export class QueryExecutor {
  private dataFetcher: DataFetcher;

  constructor(fetcher?: DataFetcher) {
    // Use prismaDataFetcher as default for real database queries
    this.dataFetcher = fetcher || prismaDataFetcher;
  }

  async execute(intent: DetectedIntent): Promise<QueryResult> {
    try {
      const data = await this.fetchDataForIntent(intent);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async fetchDataForIntent(intent: DetectedIntent): Promise<Record<string, unknown>> {
    switch (intent.intent) {
      case 'inventory_status':
        return this.fetchInventoryStatus(intent);

      case 'inventory_shortage':
        return this.fetchInventoryShortage(intent);

      case 'order_status':
        return this.fetchOrderStatus(intent);

      case 'order_summary':
        return this.fetchOrderSummary();

      case 'production_status':
        return this.fetchProductionStatus();

      case 'mrp_calculation':
        return this.fetchMRPData(intent);

      case 'purchase_suggestion':
        return this.fetchPurchaseSuggestions();

      case 'quality_report':
        return this.fetchQualityReport();

      case 'supplier_info':
        return this.fetchSupplierInfo(intent);

      case 'analytics':
        return this.fetchAnalytics();

      case 'help':
        return { type: 'help' };

      default:
        return this.fetchGeneralOverview();
    }
  }

  private async fetchInventoryStatus(intent: DetectedIntent): Promise<Record<string, unknown>> {
    const [summary, alerts] = await Promise.all([
      this.dataFetcher.getInventorySummary(),
      this.dataFetcher.getInventoryAlerts(),
    ]);

    let items = alerts;
    if (intent.entities.partNumbers && intent.entities.partNumbers.length > 0) {
      items = await this.dataFetcher.getInventoryByParts(intent.entities.partNumbers);
    }

    return { summary, items, alerts: alerts.filter(a => a.status !== 'OK') };
  }

  private async fetchInventoryShortage(intent: DetectedIntent): Promise<Record<string, unknown>> {
    const [summary, alerts] = await Promise.all([
      this.dataFetcher.getInventorySummary(),
      this.dataFetcher.getInventoryAlerts(),
    ]);

    const shortages = alerts.filter(a => a.status === 'CRITICAL' || a.status === 'LOW');
    const critical = shortages.filter(a => a.status === 'CRITICAL');
    const low = shortages.filter(a => a.status === 'LOW');

    return {
      summary: {
        ...summary,
        criticalCount: critical.length,
        lowCount: low.length,
      },
      items: shortages,
      alerts: critical,
      critical,
      low,
    };
  }

  private async fetchOrderStatus(intent: DetectedIntent): Promise<Record<string, unknown>> {
    if (intent.entities.orderNumbers && intent.entities.orderNumbers.length > 0) {
      const orders = await this.dataFetcher.getOrdersByNumbers(intent.entities.orderNumbers);
      return { orders, summary: null };
    }

    const [summary, pending, recent] = await Promise.all([
      this.dataFetcher.getOrdersSummary(),
      this.dataFetcher.getPendingOrders(),
      this.dataFetcher.getRecentOrders(10),
    ]);

    return { summary, pending, orders: recent };
  }

  private async fetchOrderSummary(): Promise<Record<string, unknown>> {
    const [summary, pending, recent] = await Promise.all([
      this.dataFetcher.getOrdersSummary(),
      this.dataFetcher.getPendingOrders(),
      this.dataFetcher.getRecentOrders(5),
    ]);

    return { summary, pending, orders: recent };
  }

  private async fetchProductionStatus(): Promise<Record<string, unknown>> {
    const [summary, running, waiting] = await Promise.all([
      this.dataFetcher.getProductionSummary(),
      this.dataFetcher.getWorkOrders('Running'),
      this.dataFetcher.getWorkOrders('Waiting Material'),
    ]);

    return {
      summary,
      workOrders: [...running, ...waiting],
      issues: waiting.map(w => ({
        type: 'Chờ vật tư',
        description: `${w.orderNumber} - ${w.product}`,
      })),
    };
  }

  private async fetchMRPData(intent: DetectedIntent): Promise<Record<string, unknown>> {
    const orderIds = intent.entities.orderNumbers || [];
    const mrpResults = await this.dataFetcher.getMRPResults(orderIds);
    return { ...mrpResults };
  }

  private async fetchPurchaseSuggestions(): Promise<Record<string, unknown>> {
    const suggestions = await this.dataFetcher.getPurchaseSuggestions();
    
    const bySupplier: Record<string, { items: number; total: number }> = {};
    let totalValue = 0;

    suggestions.forEach(s => {
      if (!bySupplier[s.supplier]) {
        bySupplier[s.supplier] = { items: 0, total: 0 };
      }
      bySupplier[s.supplier].items++;
      bySupplier[s.supplier].total += s.totalCost;
      totalValue += s.totalCost;
    });

    return { suggestions, bySupplier, totalValue };
  }

  private async fetchQualityReport(): Promise<Record<string, unknown>> {
    const [summary, ncrs] = await Promise.all([
      this.dataFetcher.getQualitySummary(),
      this.dataFetcher.getOpenNCRs(),
    ]);

    return { summary, ncrs };
  }

  private async fetchSupplierInfo(intent: DetectedIntent): Promise<Record<string, unknown>> {
    const suppliers = await this.dataFetcher.getSupplierInfo(intent.entities.suppliers);
    return { suppliers };
  }

  private async fetchAnalytics(): Promise<Record<string, unknown>> {
    const analytics = await this.dataFetcher.getAnalytics('6months');
    return { ...analytics };
  }

  private async fetchGeneralOverview(): Promise<Record<string, unknown>> {
    const [inventory, orders, production, quality] = await Promise.all([
      this.dataFetcher.getInventorySummary(),
      this.dataFetcher.getOrdersSummary(),
      this.dataFetcher.getProductionSummary(),
      this.dataFetcher.getQualitySummary(),
    ]);

    return {
      inventory,
      orders,
      production,
      quality,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let queryExecutorInstance: QueryExecutor | null = null;

export function getQueryExecutor(fetcher?: DataFetcher): QueryExecutor {
  if (!queryExecutorInstance) {
    queryExecutorInstance = new QueryExecutor(fetcher);
  }
  return queryExecutorInstance;
}

export default QueryExecutor;
