// =============================================================================
// L-ERP MRP - ADDITIONAL VALIDATION SCHEMAS
// Schemas for entities not covered in the main schemas file
// =============================================================================

import { z } from 'zod';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const BaseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const DateFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// =============================================================================
// EQUIPMENT SCHEMAS
// =============================================================================

export const EquipmentQuerySchema = BaseQuerySchema.extend({
  type: z.string().max(50).optional(),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'BREAKDOWN', 'DECOMMISSIONED']).optional(),
  workCenter: z.string().max(50).optional(),
});

export const EquipmentCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  workCenter: z.string().max(50).optional(),
  purchaseDate: z.coerce.date().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// MAINTENANCE SCHEMAS
// =============================================================================

export const MaintenanceQuerySchema = BaseQuerySchema.extend({
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  equipmentId: z.string().max(50).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
}).merge(DateFilterSchema);

export const MaintenanceCreateSchema = z.object({
  equipmentId: z.string().min(1).max(50),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  assignedTo: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// DOWNTIME SCHEMAS
// =============================================================================

export const DowntimeQuerySchema = BaseQuerySchema.extend({
  type: z.enum(['PLANNED', 'UNPLANNED', 'SETUP', 'BREAKDOWN']).optional(),
  equipmentId: z.string().max(50).optional(),
  workCenter: z.string().max(50).optional(),
}).merge(DateFilterSchema);

export const DowntimeCreateSchema = z.object({
  equipmentId: z.string().min(1).max(50),
  type: z.enum(['PLANNED', 'UNPLANNED', 'SETUP', 'BREAKDOWN']),
  reason: z.string().min(1).max(500),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// EMPLOYEE SCHEMAS
// =============================================================================

export const EmployeeQuerySchema = BaseQuerySchema.extend({
  department: z.string().max(50).optional(),
  role: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
  workCenter: z.string().max(50).optional(),
});

export const EmployeeCreateSchema = z.object({
  employeeNumber: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).optional(),
  department: z.string().max(50).optional(),
  role: z.string().max(50).optional(),
  workCenter: z.string().max(50).optional(),
  hireDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// SKILL SCHEMAS
// =============================================================================

export const SkillQuerySchema = BaseQuerySchema.extend({
  category: z.string().max(50).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
});

export const SkillCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

// =============================================================================
// SHIFT SCHEMAS
// =============================================================================

export const ShiftQuerySchema = BaseQuerySchema.extend({
  workCenter: z.string().max(50).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const ShiftCreateSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  workCenter: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

// =============================================================================
// WORK CENTER SCHEMAS
// =============================================================================

export const WorkCenterQuerySchema = BaseQuerySchema.extend({
  type: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export const WorkCenterCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional(),
  capacity: z.number().min(0).optional(),
  efficiency: z.number().min(0).max(100).optional(),
  costPerHour: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// OEE SCHEMAS
// =============================================================================

export const OEEQuerySchema = BaseQuerySchema.extend({
  equipmentId: z.string().max(50).optional(),
  workCenter: z.string().max(50).optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('day'),
}).merge(DateFilterSchema);

export const OEERecordSchema = z.object({
  equipmentId: z.string().min(1).max(50),
  date: z.coerce.date(),
  plannedTime: z.number().min(0),
  actualTime: z.number().min(0),
  goodUnits: z.number().int().min(0),
  totalUnits: z.number().int().min(0),
  idealCycleTime: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

// =============================================================================
// CAPACITY SCHEMAS
// =============================================================================

export const CapacityQuerySchema = BaseQuerySchema.extend({
  workCenter: z.string().max(50).optional(),
  resourceType: z.enum(['MACHINE', 'LABOR', 'BOTH']).optional(),
}).merge(DateFilterSchema);

// =============================================================================
// ALERT SCHEMAS
// =============================================================================

export const AlertQuerySchema = BaseQuerySchema.extend({
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED']).optional(),
  category: z.string().max(50).optional(),
});

export const AlertCreateSchema = z.object({
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  category: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  source: z.string().max(100).optional(),
  entityType: z.string().max(50).optional(),
  entityId: z.string().max(50).optional(),
});

// =============================================================================
// REPORT SCHEMAS
// =============================================================================

export const ReportQuerySchema = z.object({
  type: z.enum(['INVENTORY', 'SALES', 'PRODUCTION', 'QUALITY', 'MRP', 'OEE', 'CUSTOM']),
  format: z.enum(['JSON', 'CSV', 'XLSX', 'PDF']).default('JSON'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// CUSTOMER SCHEMAS
// =============================================================================

export const CustomerQuerySchema = BaseQuerySchema.extend({
  country: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLOCKED']).optional(),
});

export const CustomerCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(50).optional(),
  currency: z.string().length(3).default('USD'),
  paymentTerms: z.string().max(50).optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// SUPPLIER SCHEMAS
// =============================================================================

export const SupplierQuerySchema = BaseQuerySchema.extend({
  country: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED']).optional(),
  isApproved: z.enum(['true', 'false']).optional(),
});

export const SupplierCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(50).optional(),
  currency: z.string().length(3).default('USD'),
  paymentTerms: z.string().max(50).optional(),
  leadTimeDays: z.number().int().min(0).default(0),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// AI CHAT SCHEMAS
// =============================================================================

export const AIChatSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.string().max(2000).optional(),
  conversationId: z.string().max(50).optional(),
});

// =============================================================================
// MOBILE SCHEMAS
// =============================================================================

export const MobileInventoryActionSchema = z.object({
  action: z.enum(['scan', 'count', 'adjust', 'transfer', 'receive', 'pick']),
  partId: z.string().max(50).optional(),
  barcode: z.string().max(100).optional(),
  warehouseId: z.string().max(50).optional(),
  locationId: z.string().max(50).optional(),
  quantity: z.number().optional(),
  lotNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const MobileQualitySchema = z.object({
  action: z.enum(['inspection', 'measurement', 'ncr', 'approve', 'reject']),
  partId: z.string().max(50).optional(),
  workOrderId: z.string().max(50).optional(),
  characteristic: z.string().max(100).optional(),
  measuredValue: z.number().optional(),
  isPass: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

// =============================================================================
// TECHNICIAN SCHEMAS
// =============================================================================

export const TechnicianQuerySchema = BaseQuerySchema.extend({
  status: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']).optional(),
  skill: z.string().max(50).optional(),
});

// =============================================================================
// DASHBOARD SCHEMAS
// =============================================================================

export const DashboardQuerySchema = z.object({
  period: z.coerce.number().int().min(1).max(365).default(30),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  widgets: z.array(z.string()).optional(),
});

// =============================================================================
// MRP RUN SCHEMAS
// =============================================================================

export const MRPRunSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  planningHorizon: z.coerce.number().int().min(1).max(365).default(30),
  includeDemand: z.boolean().default(true),
  includeSupply: z.boolean().default(true),
  includeWIP: z.boolean().default(true),
  includeForecasts: z.boolean().default(false),
});

// =============================================================================
// PART SCHEMAS
// =============================================================================

export const PartQuerySchema = BaseQuerySchema.extend({
  category: z.enum(['FINISHED_GOOD', 'COMPONENT', 'RAW_MATERIAL', 'PACKAGING', 'CONSUMABLE', 'TOOL']).optional(),
  lifecycleStatus: z.enum(['DEVELOPMENT', 'PROTOTYPE', 'ACTIVE', 'PHASE_OUT', 'OBSOLETE', 'EOL']).optional(),
  makeOrBuy: z.enum(['MAKE', 'BUY', 'BOTH']).optional(),
  ndaaCompliant: z.enum(['true', 'false']).optional(),
  includeRelations: z.enum(['true', 'false']).optional(),
  supplierId: z.string().max(50).optional(),
});

export const PartCreateSchema = z.object({
  id: z.string().max(50).nullish(),
  partNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  category: z.enum(['FINISHED_GOOD', 'SEMI_FINISHED', 'COMPONENT', 'RAW_MATERIAL', 'PACKAGING', 'CONSUMABLE', 'TOOL']),
  unit: z.preprocess((v) => v ?? 'EA', z.string().max(10)),
  revision: z.preprocess((v) => v ?? 'A', z.string().max(10)),
  lifecycleStatus: z.preprocess((v) => v ?? 'ACTIVE', z.enum(['DEVELOPMENT', 'PROTOTYPE', 'ACTIVE', 'PHASE_OUT', 'OBSOLETE', 'EOL'])),
  tags: z.array(z.string().max(50)).nullish(),
  // Costs - use nullish() to accept null values from frontend
  unitCost: z.number().min(0).nullish(),
  standardCost: z.number().min(0).nullish(),
  averageCost: z.number().min(0).nullish(),
  landedCost: z.number().min(0).nullish(),
  freightPercent: z.number().min(0).nullish(),
  dutyPercent: z.number().min(0).nullish(),
  overheadPercent: z.number().min(0).nullish(),
  priceBreakQty1: z.number().min(0).nullish(),
  priceBreakCost1: z.number().min(0).nullish(),
  priceBreakQty2: z.number().min(0).nullish(),
  priceBreakCost2: z.number().min(0).nullish(),
  priceBreakQty3: z.number().min(0).nullish(),
  priceBreakCost3: z.number().min(0).nullish(),
  // Planning - use nullish() to accept null values from frontend
  minStockLevel: z.number().int().min(0).nullish(),
  reorderPoint: z.number().int().min(0).nullish(),
  maxStock: z.number().int().min(0).nullish(),
  safetyStock: z.number().int().min(0).nullish(),
  leadTimeDays: z.number().int().min(0).nullish(),
  makeOrBuy: z.preprocess((v) => v ?? 'BUY', z.enum(['MAKE', 'BUY', 'BOTH'])),
  procurementType: z.enum(['STOCK', 'ORDER', 'CONSIGNMENT']).nullish(),
  buyerCode: z.string().max(20).nullish(),
  moq: z.preprocess((v) => v ?? 1, z.number().int().min(1)),
  orderMultiple: z.preprocess((v) => v ?? 1, z.number().int().min(1)),
  standardPack: z.number().int().min(1).nullish(),
  // Specs - use nullish() to accept null values from frontend
  weightKg: z.number().min(0).nullish(),
  lengthMm: z.number().min(0).nullish(),
  widthMm: z.number().min(0).nullish(),
  heightMm: z.number().min(0).nullish(),
  volumeCm3: z.number().min(0).nullish(),
  color: z.string().max(50).nullish(),
  material: z.string().max(100).nullish(),
  drawingNumber: z.string().max(50).nullish(),
  drawingUrl: z.string().max(500).nullish(),
  datasheetUrl: z.string().max(500).nullish(),
  specDocument: z.string().max(500).nullish(),
  manufacturer: z.string().max(100).nullish(),
  manufacturerPn: z.string().max(100).nullish(),
  subCategory: z.string().max(50).nullish(),
  partType: z.string().max(50).nullish(),
  // Compliance - use nullish() to accept null values from frontend
  countryOfOrigin: z.string().max(50).nullish(),
  hsCode: z.string().max(20).nullish(),
  eccn: z.string().max(20).nullish(),
  ndaaCompliant: z.preprocess((v) => v ?? true, z.boolean()),
  itarControlled: z.preprocess((v) => v ?? false, z.boolean()),
  lotControl: z.preprocess((v) => v ?? false, z.boolean()),
  serialControl: z.preprocess((v) => v ?? false, z.boolean()),
  shelfLifeDays: z.number().int().min(0).nullish(),
  inspectionRequired: z.preprocess((v) => v ?? true, z.boolean()),
  inspectionPlan: z.string().max(100).nullish(),
  aqlLevel: z.string().max(10).nullish(),
  certificateRequired: z.preprocess((v) => v ?? false, z.boolean()),
  rohsCompliant: z.preprocess((v) => v ?? true, z.boolean()),
  reachCompliant: z.preprocess((v) => v ?? true, z.boolean()),
  // Additional fields for full compatibility with Update API
  revisionDate: z.string().nullish(), // ISO date string from frontend
  isCritical: z.preprocess((v) => v ?? false, z.boolean()),
  // Supplier
  primarySupplierId: z.string().max(50).nullish(),
  secondarySupplierIds: z.array(z.string()).nullish(),
});

// =============================================================================
// INVENTORY SCHEMAS
// =============================================================================

export const InventoryQuerySchema = BaseQuerySchema.extend({
  partId: z.string().max(50).optional(),
  warehouseId: z.string().max(50).optional(),
  status: z.enum(['critical', 'reorder', 'ok', 'all']).optional(),
});

export const InventoryAdjustSchema = z.object({
  partId: z.string().min(1).max(50),
  warehouseId: z.string().min(1).max(50),
  quantity: z.number(),
  reason: z.enum(['RECEIPT', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', 'SCRAP', 'COUNT']),
  reference: z.string().max(100).optional(),
  lotNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

// =============================================================================
// SALES ORDER SCHEMAS
// =============================================================================

export const SalesOrderQuerySchema = BaseQuerySchema.extend({
  customerId: z.string().max(50).optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
}).merge(DateFilterSchema);

export const SalesOrderCreateSchema = z.object({
  customerId: z.string().min(1).max(50),
  orderNumber: z.string().max(50).optional(),
  orderDate: z.coerce.date().optional(),
  requestedDate: z.coerce.date().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  notes: z.string().max(2000).optional(),
  lines: z.array(z.object({
    partId: z.string().min(1).max(50),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0).optional(),
    requestedDate: z.coerce.date().optional(),
  })).min(1),
});

// =============================================================================
// WORK ORDER / PRODUCTION SCHEMAS
// =============================================================================

export const WorkOrderQuerySchema = BaseQuerySchema.extend({
  partId: z.string().max(50).optional(),
  status: z.enum(['PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  workCenter: z.string().max(50).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
}).merge(DateFilterSchema);

export const WorkOrderCreateSchema = z.object({
  productId: z.string().min(1).max(50),
  quantity: z.number().int().min(1),
  plannedStart: z.coerce.date().optional(),
  plannedEnd: z.coerce.date().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  salesOrderId: z.string().max(50).optional(),
  salesOrderLine: z.number().int().min(1).optional(),
  notes: z.string().max(2000).optional(),
  woType: z.enum(['DISCRETE', 'BATCH']).default('DISCRETE'),
  batchSize: z.number().int().min(1).optional(),
});

// =============================================================================
// EXPORT ALL SCHEMAS
// =============================================================================

export const AdditionalSchemas = {
  // Base
  BaseQuery: BaseQuerySchema,
  DateFilter: DateFilterSchema,
  
  // Equipment
  EquipmentQuery: EquipmentQuerySchema,
  EquipmentCreate: EquipmentCreateSchema,
  
  // Maintenance
  MaintenanceQuery: MaintenanceQuerySchema,
  MaintenanceCreate: MaintenanceCreateSchema,
  
  // Downtime
  DowntimeQuery: DowntimeQuerySchema,
  DowntimeCreate: DowntimeCreateSchema,
  
  // Employee
  EmployeeQuery: EmployeeQuerySchema,
  EmployeeCreate: EmployeeCreateSchema,
  
  // Skill
  SkillQuery: SkillQuerySchema,
  SkillCreate: SkillCreateSchema,
  
  // Shift
  ShiftQuery: ShiftQuerySchema,
  ShiftCreate: ShiftCreateSchema,
  
  // Work Center
  WorkCenterQuery: WorkCenterQuerySchema,
  WorkCenterCreate: WorkCenterCreateSchema,
  
  // OEE
  OEEQuery: OEEQuerySchema,
  OEERecord: OEERecordSchema,
  
  // Capacity
  CapacityQuery: CapacityQuerySchema,
  
  // Alert
  AlertQuery: AlertQuerySchema,
  AlertCreate: AlertCreateSchema,
  
  // Report
  ReportQuery: ReportQuerySchema,
  
  // Customer
  CustomerQuery: CustomerQuerySchema,
  CustomerCreate: CustomerCreateSchema,
  
  // Supplier
  SupplierQuery: SupplierQuerySchema,
  SupplierCreate: SupplierCreateSchema,
  
  // AI
  AIChat: AIChatSchema,
  
  // Mobile
  MobileInventoryAction: MobileInventoryActionSchema,
  MobileQuality: MobileQualitySchema,
  
  // Technician
  TechnicianQuery: TechnicianQuerySchema,
  
  // Dashboard
  DashboardQuery: DashboardQuerySchema,
  
  // MRP
  MRPRun: MRPRunSchema,

  // Part
  PartQuery: PartQuerySchema,
  PartCreate: PartCreateSchema,

  // Inventory
  InventoryQuery: InventoryQuerySchema,
  InventoryAdjust: InventoryAdjustSchema,

  // Sales Order
  SalesOrderQuery: SalesOrderQuerySchema,
  SalesOrderCreate: SalesOrderCreateSchema,

  // Work Order / Production
  WorkOrderQuery: WorkOrderQuerySchema,
  WorkOrderCreate: WorkOrderCreateSchema,
};

export default AdditionalSchemas;
