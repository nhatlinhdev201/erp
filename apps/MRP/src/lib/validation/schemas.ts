// =============================================================================
// L-ERP MRP - ZOD VALIDATION SCHEMAS
// Input validation for all API endpoints
// =============================================================================

import { z } from 'zod';
import { NextResponse } from 'next/server';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Sort
export const SortSchema = z.object({
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Search
export const SearchSchema = z.object({
  search: z.string().max(200).optional(),
});

// ID parameter
export const IdSchema = z.object({
  id: z.string().min(1).max(50),
});

// Date range
export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  data => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: 'Start date must be before end date' }
);

// =============================================================================
// PARTS SCHEMAS
// =============================================================================

export const PartFiltersSchema = z.object({
  category: z.string().max(50).optional(),
  subCategory: z.string().max(50).optional(),
  status: z.enum(['DEVELOPMENT', 'PROTOTYPE', 'ACTIVE', 'PHASE_OUT', 'OBSOLETE', 'EOL']).optional(),
  type: z.enum(['MAKE', 'BUY', 'BOTH']).optional(),
  itar: z.enum(['true', 'false']).optional(),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK', 'OVERSTOCK']).optional(),
  supplierId: z.string().max(50).optional(),
});

export const PartQuerySchema = PaginationSchema
  .merge(SortSchema)
  .merge(SearchSchema)
  .merge(PartFiltersSchema);

export const PartCreateSchema = z.object({
  partNumber: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i, 'Part number must be alphanumeric with dashes'),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50),
  subCategory: z.string().max(50).optional(),
  partType: z.string().max(50).optional(),
  unit: z.string().max(20).default('pcs'),

  // Compliance
  ndaaCompliant: z.boolean().default(true),
  itarControlled: z.boolean().default(false),
  rohsCompliant: z.boolean().default(true),
  reachCompliant: z.boolean().default(true),
  countryOfOrigin: z.string().max(50).optional(),
  hsCode: z.string().max(20).optional(),
  eccn: z.string().max(20).optional(),

  // Quality
  lotControl: z.boolean().default(false),
  serialControl: z.boolean().default(false),
  shelfLifeDays: z.number().int().min(0).optional(),
  inspectionRequired: z.boolean().default(true),

  // Inventory
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).default(0),
  safetyStock: z.number().int().min(0).default(0),
  leadTimeDays: z.number().int().min(0).default(0),
  critical: z.boolean().default(false),

  // Costing
  unitCost: z.number().min(0),
  standardCost: z.number().min(0).optional(),

  // Engineering
  makeOrBuy: z.enum(['MAKE', 'BUY', 'BOTH']).default('BUY'),
  manufacturer: z.string().max(100).optional(),
  manufacturerPn: z.string().max(100).optional(),
  drawingNumber: z.string().max(50).optional(),

  primarySupplierId: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const PartUpdateSchema = PartCreateSchema.partial().extend({
  id: z.string().min(1).max(50),
});

// =============================================================================
// SALES ORDER SCHEMAS
// =============================================================================

export const SalesOrderFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  customerId: z.string().max(50).optional(),
  view: z.enum(['list', 'kanban']).default('list'),
});

export const SalesOrderQuerySchema = PaginationSchema
  .merge(SortSchema)
  .merge(SearchSchema)
  .merge(SalesOrderFiltersSchema)
  .merge(DateRangeSchema);

export const SalesOrderLineSchema = z.object({
  productId: z.string().min(1).max(50),
  quantity: z.number().min(0.001),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
});

export const SalesOrderCreateSchema = z.object({
  customerId: z.string().min(1).max(50),
  orderDate: z.coerce.date().optional(),
  requestedDate: z.coerce.date().optional(),
  promisedDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  currency: z.string().length(3).default('USD'),
  paymentTerms: z.string().max(50).optional(),
  shippingMethod: z.string().max(50).optional(),
  shippingAddress: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  lines: z.array(SalesOrderLineSchema).min(1).max(100),
});

export const SalesOrderUpdateSchema = z.object({
  id: z.string().min(1).max(50),
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  requestedDate: z.coerce.date().optional(),
  promisedDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
});

// =============================================================================
// PRODUCTION/WORK ORDER SCHEMAS
// =============================================================================

export const WorkOrderFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  workCenter: z.string().max(50).optional(),
  productId: z.string().max(50).optional(),
  view: z.enum(['list', 'kanban']).default('list'),
});

export const WorkOrderQuerySchema = PaginationSchema
  .merge(SortSchema)
  .merge(SearchSchema)
  .merge(WorkOrderFiltersSchema)
  .merge(DateRangeSchema);

export const WorkOrderOperationSchema = z.object({
  seq: z.number().int().min(1),
  name: z.string().min(1).max(100),
  workCenter: z.string().max(50).optional(),
  plannedHours: z.number().min(0),
});

export const WorkOrderCreateSchema = z.object({
  productId: z.string().min(1).max(50),
  quantity: z.number().min(0.001),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  workCenter: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  operations: z.array(WorkOrderOperationSchema).optional(),
});

export const WorkOrderUpdateSchema = z.object({
  id: z.string().min(1).max(50),
  status: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['DRAFT', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'])
  ).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  quantity: z.number().int().min(1).optional(),
  plannedStart: z.string().or(z.date()).optional().nullable(),
  plannedEnd: z.string().or(z.date()).optional().nullable(),
  completedQty: z.number().min(0).optional(),
  scrapQty: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
});

// =============================================================================
// QUALITY/NCR SCHEMAS
// =============================================================================

export const NCRFiltersSchema = z.object({
  status: z.enum(['open', 'in_progress', 'pending_review', 'closed']).optional(),
  severity: z.enum(['minor', 'major', 'critical']).optional(),
  source: z.enum(['supplier', 'production', 'customer']).optional(),
  type: z.enum(['Receiving', 'In-Process', 'Final', 'Customer']).optional(),
  view: z.enum(['list', 'kanban']).default('list'),
});

export const NCRQuerySchema = PaginationSchema
  .merge(SortSchema)
  .merge(SearchSchema)
  .merge(NCRFiltersSchema)
  .merge(DateRangeSchema);

export const NCRCreateSchema = z.object({
  type: z.enum(['Receiving', 'In-Process', 'Final', 'Customer']),
  source: z.enum(['supplier', 'production', 'customer']),
  partId: z.string().max(50).optional(),
  partNumber: z.string().max(50).optional(),
  partName: z.string().max(200).optional(),
  quantityAffected: z.number().min(0.001),
  description: z.string().min(1).max(5000),
  rootCause: z.string().max(5000).optional(),
  disposition: z.enum(['Scrap', 'Rework', 'Return', 'Use-as-is']).optional(),
  costImpact: z.number().min(0).optional(),
  assignedTo: z.string().max(100).optional(),
});

export const NCRUpdateSchema = z.object({
  id: z.string().min(1).max(50),
  status: z.enum(['open', 'in_progress', 'pending_review', 'closed']).optional(),
  rootCause: z.string().max(5000).optional(),
  disposition: z.enum(['Scrap', 'Rework', 'Return', 'Use-as-is']).optional(),
  costImpact: z.number().min(0).optional(),
  assignedTo: z.string().max(100).optional(),
});

// =============================================================================
// INVENTORY SCHEMAS
// =============================================================================

export const InventoryFiltersSchema = z.object({
  warehouse: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK', 'OVERSTOCK']).optional(),
  partId: z.string().max(50).optional(),
});

export const InventoryQuerySchema = PaginationSchema
  .merge(SortSchema)
  .merge(SearchSchema)
  .merge(InventoryFiltersSchema);

export const InventoryActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('receive'),
    partId: z.string().min(1).max(50),
    warehouseId: z.string().min(1).max(50),
    quantity: z.number().min(0.001),
    lotNumber: z.string().max(50).optional(),
    serialNumber: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal('issue'),
    partId: z.string().min(1).max(50),
    warehouseId: z.string().min(1).max(50),
    quantity: z.number().min(0.001),
    lotNumber: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal('reserve'),
    partId: z.string().min(1).max(50),
    warehouseId: z.string().min(1).max(50),
    quantity: z.number().min(0.001),
    notes: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal('transfer'),
    partId: z.string().min(1).max(50),
    warehouseId: z.string().min(1).max(50),
    toWarehouseId: z.string().min(1).max(50),
    quantity: z.number().min(0.001),
    lotNumber: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal('adjust'),
    partId: z.string().min(1).max(50),
    warehouseId: z.string().min(1).max(50),
    quantity: z.number().min(0),
    lotNumber: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
  }),
]);

// =============================================================================
// BOM SCHEMAS
// =============================================================================

export const BOMFiltersSchema = z.object({
  category: z.string().max(50).optional(),
  bomType: z.enum(['ENGINEERING', 'MANUFACTURING', 'CONFIGURABLE', 'PLANNING', 'SERVICE']).optional(),
  productId: z.string().max(50).optional(),
  includeTree: z.enum(['true', 'false']).default('false'),
});

export const BOMQuerySchema = PaginationSchema
  .merge(SortSchema)
  .merge(SearchSchema)
  .merge(BOMFiltersSchema);

export const BOMLineCreateSchema = z.object({
  productId: z.string().min(1).max(50),
  partId: z.string().min(1).max(50),
  quantity: z.number().min(0.001),
  unit: z.string().max(20).default('pcs'),
  module: z.string().max(50).optional(),
  critical: z.boolean().default(false),
  notes: z.string().max(1000).optional(),

  findNumber: z.number().int().min(0).optional(),
  referenceDesignator: z.string().max(50).optional(),

  scrapPercent: z.number().min(0).max(100).default(0),
  operationSeq: z.number().int().min(0).optional(),

  revision: z.string().max(10).default('A'),
  effectivityDate: z.coerce.date().optional(),

  alternateGroup: z.string().max(20).optional(),
  isPrimary: z.boolean().default(true),

  bomType: z.enum(['ENGINEERING', 'MANUFACTURING', 'CONFIGURABLE', 'PLANNING', 'SERVICE']).default('MANUFACTURING'),
  subAssembly: z.boolean().default(false),
  phantom: z.boolean().default(false),

  sequence: z.number().int().min(0).default(0),

  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionZ: z.number().optional(),
});

export const BOMLineUpdateSchema = BOMLineCreateSchema.partial().extend({
  id: z.string().min(1).max(50),
});

// =============================================================================
// ANALYTICS SCHEMAS
// =============================================================================

export const AnalyticsQuerySchema = z.object({
  tab: z.enum(['overview', 'inventory', 'sales', 'production', 'quality']).default('overview'),
  period: z.coerce.number().int().min(1).max(365).default(30),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// =============================================================================
// VALIDATION HELPER
// =============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  source: 'body' | 'query' = 'body'
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

export function parseSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return validateRequest(schema, params, 'query');
}

// =============================================================================
// EXPORT ALL SCHEMAS
// =============================================================================

export const Schemas = {
  // Common
  Pagination: PaginationSchema,
  Sort: SortSchema,
  Search: SearchSchema,
  Id: IdSchema,
  DateRange: DateRangeSchema,

  // Parts
  PartFilters: PartFiltersSchema,
  PartQuery: PartQuerySchema,
  PartCreate: PartCreateSchema,
  PartUpdate: PartUpdateSchema,

  // Sales
  SalesOrderFilters: SalesOrderFiltersSchema,
  SalesOrderQuery: SalesOrderQuerySchema,
  SalesOrderCreate: SalesOrderCreateSchema,
  SalesOrderUpdate: SalesOrderUpdateSchema,

  // Production
  WorkOrderFilters: WorkOrderFiltersSchema,
  WorkOrderQuery: WorkOrderQuerySchema,
  WorkOrderCreate: WorkOrderCreateSchema,
  WorkOrderUpdate: WorkOrderUpdateSchema,

  // Quality
  NCRFilters: NCRFiltersSchema,
  NCRQuery: NCRQuerySchema,
  NCRCreate: NCRCreateSchema,
  NCRUpdate: NCRUpdateSchema,

  // Inventory
  InventoryFilters: InventoryFiltersSchema,
  InventoryQuery: InventoryQuerySchema,
  InventoryAction: InventoryActionSchema,

  // BOM
  BOMFilters: BOMFiltersSchema,
  BOMQuery: BOMQuerySchema,
  BOMLineCreate: BOMLineCreateSchema,
  BOMLineUpdate: BOMLineUpdateSchema,

  // Analytics
  AnalyticsQuery: AnalyticsQuerySchema,
};

export default Schemas;
