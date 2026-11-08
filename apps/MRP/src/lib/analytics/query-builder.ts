// =============================================================================
// L-ERP MRP - QUERY BUILDER
// Flexible query builder for analytics aggregations
// =============================================================================

import { prisma } from '@/lib/prisma';
import type {
  QueryBuilderOptions,
  QueryFilter,
  QueryOrderBy,
  QueryJoin,
  AggregatedResult,
  AggregationType,
} from './types';

// Structural type for Prisma model delegates used by QueryBuilder.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma delegates have complex, model-specific generic signatures
type PrismaModelDelegate = {
  findMany: (args: any) => Promise<Record<string, unknown>[]>;
  count: (args: any) => Promise<number>;
  aggregate: (args: any) => Promise<Record<string, unknown>>;
  groupBy: (args: any) => Promise<Record<string, unknown>[]>;
};

// =============================================================================
// QUERY BUILDER CLASS
// =============================================================================

export class QueryBuilder {
  private options: QueryBuilderOptions;

  constructor(table: string) {
    this.options = {
      table,
      select: [],
      where: [],
      groupBy: [],
      orderBy: [],
      joins: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Builder Methods
  // ---------------------------------------------------------------------------

  select(...fields: string[]): QueryBuilder {
    this.options.select = fields;
    return this;
  }

  where(filter: QueryFilter): QueryBuilder {
    this.options.where = this.options.where || [];
    this.options.where.push(filter);
    return this;
  }

  whereMany(filters: QueryFilter[]): QueryBuilder {
    this.options.where = this.options.where || [];
    this.options.where.push(...filters);
    return this;
  }

  groupBy(...fields: string[]): QueryBuilder {
    this.options.groupBy = fields;
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder {
    this.options.orderBy = this.options.orderBy || [];
    this.options.orderBy.push({ field, direction });
    return this;
  }

  limit(n: number): QueryBuilder {
    this.options.limit = n;
    return this;
  }

  offset(n: number): QueryBuilder {
    this.options.offset = n;
    return this;
  }

  join(table: string, on: string, type: 'inner' | 'left' | 'right' = 'inner'): QueryBuilder {
    this.options.joins = this.options.joins || [];
    this.options.joins.push({ table, on, type });
    return this;
  }

  // ---------------------------------------------------------------------------
  // Execution Methods
  // ---------------------------------------------------------------------------

  async execute(): Promise<Record<string, unknown>[]> {
    const whereClause = this.buildWhereClause();
    const model = this.getModel();

    if (!model) {
      throw new Error(`Unknown table: ${this.options.table}`);
    }

    return model.findMany({
      where: whereClause,
      orderBy: this.buildOrderBy(),
      take: this.options.limit,
      skip: this.options.offset,
    });
  }

  async count(): Promise<number> {
    const whereClause = this.buildWhereClause();
    const model = this.getModel();

    if (!model) {
      throw new Error(`Unknown table: ${this.options.table}`);
    }

    return model.count({ where: whereClause });
  }

  async aggregate(aggregation: AggregationType, field: string): Promise<number> {
    const whereClause = this.buildWhereClause();
    const model = this.getModel();

    if (!model) {
      throw new Error(`Unknown table: ${this.options.table}`);
    }

    const result = await model.aggregate({
      where: whereClause,
      _sum: aggregation === 'SUM' ? { [field]: true } : undefined,
      _avg: aggregation === 'AVG' ? { [field]: true } : undefined,
      _min: aggregation === 'MIN' ? { [field]: true } : undefined,
      _max: aggregation === 'MAX' ? { [field]: true } : undefined,
      _count: aggregation === 'COUNT' ? { [field]: true } : undefined,
    }) as Record<string, Record<string, number> | undefined>;

    switch (aggregation) {
      case 'SUM':
        return result._sum?.[field] || 0;
      case 'AVG':
        return result._avg?.[field] || 0;
      case 'MIN':
        return result._min?.[field] || 0;
      case 'MAX':
        return result._max?.[field] || 0;
      case 'COUNT':
        return result._count?.[field] || 0;
      default:
        return 0;
    }
  }

  async groupAggregate(
    aggregation: AggregationType,
    field: string
  ): Promise<AggregatedResult[]> {
    const whereClause = this.buildWhereClause();
    const model = this.getModel();

    if (!model || !this.options.groupBy?.length) {
      throw new Error('Group by fields required for group aggregation');
    }

    const results = await model.groupBy({
      by: this.options.groupBy,
      where: whereClause,
      _sum: aggregation === 'SUM' ? { [field]: true } : undefined,
      _avg: aggregation === 'AVG' ? { [field]: true } : undefined,
      _min: aggregation === 'MIN' ? { [field]: true } : undefined,
      _max: aggregation === 'MAX' ? { [field]: true } : undefined,
      _count: aggregation === 'COUNT' ? { [field]: true } : undefined,
    });

    return results.map((r: Record<string, unknown>) => {
      const dimension = this.options.groupBy!.map(g => r[g]).join(' - ');
      let value: number;
      const agg = r as Record<string, Record<string, number> | undefined>;

      switch (aggregation) {
        case 'SUM':
          value = agg._sum?.[field] || 0;
          break;
        case 'AVG':
          value = agg._avg?.[field] || 0;
          break;
        case 'MIN':
          value = agg._min?.[field] || 0;
          break;
        case 'MAX':
          value = agg._max?.[field] || 0;
          break;
        case 'COUNT':
          value = agg._count?.[field] || 0;
          break;
        default:
          value = 0;
      }

      return {
        dimension,
        value,
        metadata: this.options.groupBy!.reduce((acc, g) => {
          acc[g] = r[g];
          return acc;
        }, {} as Record<string, unknown>),
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private buildWhereClause(): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    for (const filter of this.options.where || []) {
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

  private buildOrderBy(): Record<string, 'asc' | 'desc'>[] {
    return (this.options.orderBy || []).map(o => ({
      [o.field]: o.direction,
    }));
  }

  // Prisma model delegates share a common structural shape for findMany/count/aggregate/groupBy
  private getModel(): PrismaModelDelegate | undefined {
    const tableMap: Record<string, PrismaModelDelegate> = {
      // Core tables
      parts: prisma.part,
      suppliers: prisma.supplier,
      customers: prisma.customer,
      inventory: prisma.inventory,

      // Orders
      salesOrders: prisma.salesOrder,
      salesOrderLines: prisma.salesOrderLine,
      purchaseOrders: prisma.purchaseOrder,
      purchaseOrderLines: prisma.purchaseOrderLine,
      workOrders: prisma.workOrder,

      // Quality
      inspections: prisma.inspection,
      ncrs: prisma.nCR,
      capas: prisma.cAPA,

      // Production
      workOrderOperations: prisma.workOrderOperation,
      workCenters: prisma.workCenter,

      // Financial
      salesInvoices: prisma.salesInvoice,
      purchaseInvoices: prisma.purchaseInvoice,
      costVariances: prisma.costVariance,

      // Analytics
      dashboards: prisma.analyticsDashboard,
      widgets: prisma.dashboardWidget,
      kpiDefinitions: prisma.kPIDefinition,
      savedReports: prisma.savedReport,
      reportSchedules: prisma.reportSchedule,
      reportInstances: prisma.reportInstance,
    };

    return tableMap[this.options.table];
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function createQuery(table: string): QueryBuilder {
  return new QueryBuilder(table);
}

// Pre-built query helpers for common analytics scenarios
export const analyticsQueries = {
  // Inventory queries
  inventoryValueByCategory: () =>
    createQuery('inventory')
      .join('parts', 'partId')
      .groupBy('category'),

  lowStockItems: () =>
    createQuery('inventory')
      .where({ field: 'onHand', operator: 'lte', value: 0 })
      .orderBy('onHand', 'asc'),

  // Sales queries
  salesByMonth: (year: number) =>
    createQuery('salesOrders')
      .where({ field: 'orderDate', operator: 'gte', value: new Date(year, 0, 1) })
      .where({ field: 'orderDate', operator: 'lt', value: new Date(year + 1, 0, 1) }),

  topCustomers: (limit = 10) =>
    createQuery('salesOrders')
      .groupBy('customerId')
      .orderBy('totalAmount', 'desc')
      .limit(limit),

  // Production queries
  workOrdersByStatus: () =>
    createQuery('workOrders')
      .groupBy('status'),

  productionEfficiency: (dateFrom: Date, dateTo: Date) =>
    createQuery('workOrders')
      .where({ field: 'plannedStart', operator: 'gte', value: dateFrom })
      .where({ field: 'plannedStart', operator: 'lte', value: dateTo }),

  // Quality queries
  ncrsByCategory: () =>
    createQuery('ncrs')
      .where({ field: 'status', operator: 'notIn', value: ['closed', 'voided'] })
      .groupBy('defectCategory'),

  qualityTrend: (dateFrom: Date, dateTo: Date) =>
    createQuery('inspections')
      .where({ field: 'createdAt', operator: 'gte', value: dateFrom })
      .where({ field: 'createdAt', operator: 'lte', value: dateTo })
      .where({ field: 'status', operator: 'eq', value: 'completed' }),

  // Supplier queries
  supplierPerformance: () =>
    createQuery('suppliers')
      .where({ field: 'status', operator: 'eq', value: 'active' })
      .orderBy('rating', 'desc'),
};

export default {
  QueryBuilder,
  createQuery,
  analyticsQueries,
};
