// =============================================================================
// L-ERP MRP - DATA SERVICE LAYER
// Abstraction layer for database operations
// Can switch between mock data and Prisma
// =============================================================================

// =============================================================================
// TYPES (matching Prisma schema)
// =============================================================================

export type PartCategory = 
  | 'FINISHED_GOOD' 
  | 'SEMI_FINISHED' 
  | 'COMPONENT' 
  | 'RAW_MATERIAL' 
  | 'CONSUMABLE' 
  | 'PACKAGING';

export type SalesOrderStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PRODUCTION' 
  | 'READY_TO_SHIP' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type PurchaseOrderStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'SENT' 
  | 'PARTIALLY_RECEIVED' 
  | 'RECEIVED' 
  | 'CANCELLED';

export type WorkOrderStatus = 
  | 'PLANNED' 
  | 'RELEASED' 
  | 'IN_PROGRESS' 
  | 'ON_HOLD' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type Priority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION';
export type QualityStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'CLOSED' | 'CANCELLED';
export type MRPRequirementStatus = 'OK' | 'LOW' | 'CRITICAL';

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

export interface Part {
  id: string;
  partNumber: string;
  partName: string;
  description?: string;
  category: PartCategory;
  unit: string;
  unitCost: number;
  sellingPrice?: number;
  leadTime: number;
  minOrderQty: number;
  isActive: boolean;
  supplierId?: string;
  supplier?: Supplier;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  leadTime: number;
  rating: number;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  taxCode?: string;
  creditLimit?: number;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BOMItem {
  id: string;
  parentPartId: string;
  parentPart?: Part;
  childPartId: string;
  childPart?: Part;
  quantity: number;
  unit: string;
  scrapRate: number;
  notes?: string;
}

export interface Inventory {
  id: string;
  partId: string;
  part?: Part;
  onHand: number;
  onOrder: number;
  allocated: number;
  available: number;
  safetyStock: number;
  reorderPoint: number;
  maxStock?: number;
  warehouseLocation?: string;
  binLocation?: string;
  lastCountDate?: Date;
  lastMovementDate?: Date;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  orderDate: Date;
  requiredDate: Date;
  promisedDate?: Date;
  shippedDate?: Date;
  status: SalesOrderStatus;
  priority: Priority;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  shippingAddress?: string;
  notes?: string;
  items?: SalesOrderItem[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  orderDate: Date;
  requiredDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  status: PurchaseOrderStatus;
  priority: Priority;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paymentTerms?: string;
  notes?: string;
  mrpRunId?: string;
  items?: PurchaseOrderItem[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  partId: string;
  part?: Part;
  quantity: number;
  receivedQty: number;
  unitCost: number;
  lineTotal: number;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  salesOrderId?: string;
  productPartId: string;
  quantity: number;
  completedQty: number;
  scrapQty: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: WorkOrderStatus;
  priority: Priority;
  workstation?: string;
  notes?: string;
  progress?: number; // computed percentage
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityRecord {
  id: string;
  recordNumber: string;
  type: 'NCR' | 'CAPA' | 'INSPECTION' | 'AUDIT';
  status: QualityStatus;
  severity: Severity;
  workOrderId?: string;
  partId?: string;
  lotNumber?: string;
  quantity?: number;
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  reportedBy?: string;
  reportedDate: Date;
  closedBy?: string;
  closedDate?: Date;
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardStats {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    currency: string;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    growth: number;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStock: number;
    outOfStock: number;
    healthy: number;
  };
  production: {
    efficiency: number;
    running: number;
    waiting: number;
    completed: number;
    onHold: number;
  };
  quality: {
    passRate: number;
    openNCRs: number;
    inspectionsToday: number;
    criticalNCRs: number;
  };
  purchasing: {
    pendingPOs: number;
    pendingValue: number;
    overdueDeliveries: number;
  };
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  userId?: string;
  userName: string;
  createdAt: Date;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const now = new Date();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

// Suppliers
export const mockSuppliers: Supplier[] = [
  { id: 's1', code: 'SKF-VN', name: 'SKF Vietnam', contactPerson: 'Nguyễn Văn Nam', email: 'nam@skf.vn', phone: '028-1234-5678', address: '123 Lê Lợi, Q1', city: 'Hồ Chí Minh', country: 'Vietnam', leadTime: 7, rating: 4.8, paymentTerms: 'Net 30', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 's2', code: 'OMV', name: 'Oriental Motor VN', contactPerson: 'Trần Thị Hoa', email: 'hoa@oriental.vn', phone: '028-2345-6789', address: '456 Nguyễn Huệ, Q1', city: 'Hồ Chí Minh', country: 'Vietnam', leadTime: 14, rating: 4.5, paymentTerms: 'Net 45', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 's3', code: 'TVN-STEEL', name: 'Thép Việt Nam Steel', contactPerson: 'Lê Văn Cường', email: 'cuong@thepvn.com', phone: '028-3456-7890', address: '789 Võ Văn Tần, Q3', city: 'Hồ Chí Minh', country: 'Vietnam', leadTime: 7, rating: 4.2, paymentTerms: 'Net 30', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 's4', code: 'OV-TT', name: 'Ốc vít Tân Tiến', contactPerson: 'Phạm Văn Đức', email: 'duc@tantienv.com', phone: '028-4567-8901', address: '321 Cách Mạng Tháng 8, Q10', city: 'Hồ Chí Minh', country: 'Vietnam', leadTime: 3, rating: 4.0, paymentTerms: 'COD', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 's5', code: 'NHOM-DA', name: 'Nhôm Đông Á', contactPerson: 'Hoàng Thị Mai', email: 'mai@nhomdonga.vn', phone: '028-5678-9012', address: '654 Điện Biên Phủ, Bình Thạnh', city: 'Hồ Chí Minh', country: 'Vietnam', leadTime: 10, rating: 4.3, paymentTerms: 'Net 30', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
];

// Customers
export const mockCustomers: Customer[] = [
  { id: 'c1', code: 'ABC-MFG', name: 'ABC Manufacturing', contactPerson: 'Nguyễn Minh Tuấn', email: 'tuan@abcmfg.com', phone: '028-1111-2222', address: '100 KCN Tân Bình', city: 'Hồ Chí Minh', country: 'Vietnam', taxCode: '0123456789', creditLimit: 500000000, paymentTerms: 'Net 30', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'c2', code: 'XYZ-IND', name: 'XYZ Industries', contactPerson: 'Trần Thị Lan', email: 'lan@xyzind.com', phone: '028-3333-4444', address: '200 KCN Biên Hòa', city: 'Đồng Nai', country: 'Vietnam', taxCode: '0987654321', creditLimit: 800000000, paymentTerms: 'Net 45', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'c3', code: 'DONG-A', name: 'Đông Á Group', contactPerson: 'Lê Hoàng Nam', email: 'nam@dongagroup.vn', phone: '028-5555-6666', address: '300 KCN Long Thành', city: 'Đồng Nai', country: 'Vietnam', taxCode: '0112233445', creditLimit: 1000000000, paymentTerms: 'Net 30', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'c4', code: 'AGRI-TECH', name: 'AgriTech Corp', contactPerson: 'Phạm Văn Hùng', email: 'hung@agritech.vn', phone: '028-7777-8888', address: '400 KCN Củ Chi', city: 'Hồ Chí Minh', country: 'Vietnam', taxCode: '0556677889', creditLimit: 300000000, paymentTerms: 'COD', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'c5', code: 'TECH-SOL', name: 'Tech Solutions', contactPerson: 'Hoàng Thị Nga', email: 'nga@techsol.vn', phone: '028-9999-0000', address: '500 Quang Trung, Gò Vấp', city: 'Hồ Chí Minh', country: 'Vietnam', taxCode: '0998877665', creditLimit: 600000000, paymentTerms: 'Net 30', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
];

// Parts
export const mockParts: Part[] = [
  // Finished Goods
  { id: 'fg1', partNumber: 'FG-PRD-A1', partName: 'Sản phẩm Model A1', category: 'FINISHED_GOOD', unit: 'pcs', unitCost: 12000000, sellingPrice: 15000000, leadTime: 7, minOrderQty: 1, isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'fg2', partNumber: 'FG-PRD-A2', partName: 'Sản phẩm Model A2', category: 'FINISHED_GOOD', unit: 'pcs', unitCost: 15000000, sellingPrice: 18500000, leadTime: 10, minOrderQty: 1, isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'fg3', partNumber: 'FG-PRD-B1', partName: 'Sản phẩm Model B1', category: 'FINISHED_GOOD', unit: 'pcs', unitCost: 9500000, sellingPrice: 12000000, leadTime: 5, minOrderQty: 1, isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  
  // Components
  { id: 'p1', partNumber: 'CMP-BRG-002', partName: 'Bạc đạn bi 6201-2RS', category: 'COMPONENT', unit: 'pcs', unitCost: 42000, leadTime: 7, minOrderQty: 10, supplierId: 's1', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'p2', partNumber: 'CMP-MOT-001', partName: 'Motor DC 12V 50W', category: 'COMPONENT', unit: 'pcs', unitCost: 250000, leadTime: 14, minOrderQty: 5, supplierId: 's2', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'p3', partNumber: 'CMP-GBX-001', partName: 'Hộp số giảm tốc 1:10', category: 'COMPONENT', unit: 'pcs', unitCost: 450000, leadTime: 21, minOrderQty: 5, supplierId: 's2', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'p4', partNumber: 'CMP-SCR-001', partName: 'Vít lục giác M4x10 inox', category: 'COMPONENT', unit: 'pcs', unitCost: 500, leadTime: 3, minOrderQty: 100, supplierId: 's4', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'p5', partNumber: 'CMP-NUT-001', partName: 'Đai ốc M4 inox', category: 'COMPONENT', unit: 'pcs', unitCost: 300, leadTime: 3, minOrderQty: 100, supplierId: 's4', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'p6', partNumber: 'CMP-WSH-001', partName: 'Vòng đệm M4 inox', category: 'COMPONENT', unit: 'pcs', unitCost: 200, leadTime: 3, minOrderQty: 100, supplierId: 's4', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  
  // Raw Materials
  { id: 'rm1', partNumber: 'RM-STL-002', partName: 'Thép tấm carbon 3mm', category: 'RAW_MATERIAL', unit: 'kg', unitCost: 26000, leadTime: 7, minOrderQty: 50, supplierId: 's3', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'rm2', partNumber: 'RM-ALU-001', partName: 'Nhôm tấm 1.5mm', category: 'RAW_MATERIAL', unit: 'kg', unitCost: 85000, leadTime: 10, minOrderQty: 20, supplierId: 's5', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'rm3', partNumber: 'RM-STL-001', partName: 'Thép ống phi 25', category: 'RAW_MATERIAL', unit: 'kg', unitCost: 28000, leadTime: 7, minOrderQty: 30, supplierId: 's3', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
];

// BOM Items
export const mockBOMItems: BOMItem[] = [
  // FG-PRD-A1 BOM
  { id: 'bom1', parentPartId: 'fg1', childPartId: 'p1', quantity: 2, unit: 'pcs', scrapRate: 0.02 },
  { id: 'bom2', parentPartId: 'fg1', childPartId: 'p2', quantity: 1, unit: 'pcs', scrapRate: 0 },
  { id: 'bom3', parentPartId: 'fg1', childPartId: 'p3', quantity: 1, unit: 'pcs', scrapRate: 0 },
  { id: 'bom4', parentPartId: 'fg1', childPartId: 'p4', quantity: 20, unit: 'pcs', scrapRate: 0.05 },
  { id: 'bom5', parentPartId: 'fg1', childPartId: 'rm1', quantity: 5, unit: 'kg', scrapRate: 0.1 },
  { id: 'bom6', parentPartId: 'fg1', childPartId: 'rm2', quantity: 2, unit: 'kg', scrapRate: 0.08 },
  
  // FG-PRD-A2 BOM
  { id: 'bom7', parentPartId: 'fg2', childPartId: 'p1', quantity: 4, unit: 'pcs', scrapRate: 0.02 },
  { id: 'bom8', parentPartId: 'fg2', childPartId: 'p2', quantity: 2, unit: 'pcs', scrapRate: 0 },
  { id: 'bom9', parentPartId: 'fg2', childPartId: 'p3', quantity: 2, unit: 'pcs', scrapRate: 0 },
  { id: 'bom10', parentPartId: 'fg2', childPartId: 'p4', quantity: 30, unit: 'pcs', scrapRate: 0.05 },
  { id: 'bom11', parentPartId: 'fg2', childPartId: 'rm1', quantity: 8, unit: 'kg', scrapRate: 0.1 },
  { id: 'bom12', parentPartId: 'fg2', childPartId: 'rm2', quantity: 3, unit: 'kg', scrapRate: 0.08 },
  
  // FG-PRD-B1 BOM
  { id: 'bom13', parentPartId: 'fg3', childPartId: 'p1', quantity: 2, unit: 'pcs', scrapRate: 0.02 },
  { id: 'bom14', parentPartId: 'fg3', childPartId: 'p2', quantity: 1, unit: 'pcs', scrapRate: 0 },
  { id: 'bom15', parentPartId: 'fg3', childPartId: 'p4', quantity: 15, unit: 'pcs', scrapRate: 0.05 },
  { id: 'bom16', parentPartId: 'fg3', childPartId: 'rm1', quantity: 4, unit: 'kg', scrapRate: 0.1 },
];

// Inventory
export const mockInventory: Inventory[] = [
  { id: 'inv1', partId: 'p1', onHand: 25, onOrder: 0, allocated: 0, available: 25, safetyStock: 30, reorderPoint: 50, warehouseLocation: 'WH-01', binLocation: 'A-01-01' },
  { id: 'inv2', partId: 'p2', onHand: 15, onOrder: 10, allocated: 5, available: 20, safetyStock: 10, reorderPoint: 20, warehouseLocation: 'WH-01', binLocation: 'A-02-01' },
  { id: 'inv3', partId: 'p3', onHand: 18, onOrder: 5, allocated: 3, available: 20, safetyStock: 5, reorderPoint: 15, warehouseLocation: 'WH-01', binLocation: 'A-02-02' },
  { id: 'inv4', partId: 'p4', onHand: 2500, onOrder: 0, allocated: 200, available: 2300, safetyStock: 500, reorderPoint: 1000, warehouseLocation: 'WH-01', binLocation: 'B-01-01' },
  { id: 'inv5', partId: 'p5', onHand: 3000, onOrder: 0, allocated: 100, available: 2900, safetyStock: 500, reorderPoint: 1000, warehouseLocation: 'WH-01', binLocation: 'B-01-02' },
  { id: 'inv6', partId: 'p6', onHand: 2800, onOrder: 500, allocated: 100, available: 3200, safetyStock: 500, reorderPoint: 1000, warehouseLocation: 'WH-01', binLocation: 'B-01-03' },
  { id: 'inv7', partId: 'rm1', onHand: 120, onOrder: 0, allocated: 30, available: 90, safetyStock: 40, reorderPoint: 100, warehouseLocation: 'WH-02', binLocation: 'C-01-01' },
  { id: 'inv8', partId: 'rm2', onHand: 85, onOrder: 50, allocated: 15, available: 120, safetyStock: 30, reorderPoint: 60, warehouseLocation: 'WH-02', binLocation: 'C-02-01' },
  { id: 'inv9', partId: 'rm3', onHand: 200, onOrder: 0, allocated: 0, available: 200, safetyStock: 50, reorderPoint: 80, warehouseLocation: 'WH-02', binLocation: 'C-01-02' },
  // Finished goods
  { id: 'inv10', partId: 'fg1', onHand: 5, onOrder: 0, allocated: 2, available: 3, safetyStock: 3, reorderPoint: 5, warehouseLocation: 'WH-FG', binLocation: 'FG-01' },
  { id: 'inv11', partId: 'fg2', onHand: 3, onOrder: 0, allocated: 1, available: 2, safetyStock: 2, reorderPoint: 3, warehouseLocation: 'WH-FG', binLocation: 'FG-02' },
  { id: 'inv12', partId: 'fg3', onHand: 8, onOrder: 0, allocated: 5, available: 3, safetyStock: 5, reorderPoint: 8, warehouseLocation: 'WH-FG', binLocation: 'FG-03' },
];

// Sales Orders
export const mockSalesOrders: SalesOrder[] = [
  {
    id: 'so1', orderNumber: 'SO-2025-001', customerId: 'c1', orderDate: new Date('2025-01-02'), requiredDate: new Date('2025-01-15'),
    status: 'CONFIRMED', priority: 'NORMAL', subtotal: 136363636, taxAmount: 13636364, discount: 0, totalAmount: 150000000,
    notes: 'Giao hàng tại KCN Tân Bình', createdBy: 'admin', createdAt: new Date('2025-01-02'), updatedAt: now,
    items: [
      { id: 'soi1', salesOrderId: 'so1', partId: 'fg1', quantity: 10, unitPrice: 15000000, discount: 0, taxRate: 0.1, lineTotal: 150000000 }
    ]
  },
  {
    id: 'so2', orderNumber: 'SO-2025-002', customerId: 'c2', orderDate: new Date('2025-01-02'), requiredDate: new Date('2025-01-20'),
    status: 'PENDING', priority: 'HIGH', subtotal: 84090909, taxAmount: 8409091, discount: 0, totalAmount: 92500000,
    notes: 'Khách VIP - ưu tiên', createdBy: 'admin', createdAt: new Date('2025-01-02'), updatedAt: now,
    items: [
      { id: 'soi2', salesOrderId: 'so2', partId: 'fg2', quantity: 5, unitPrice: 18500000, discount: 0, taxRate: 0.1, lineTotal: 92500000 }
    ]
  },
  {
    id: 'so3', orderNumber: 'SO-2025-003', customerId: 'c3', orderDate: new Date('2025-01-03'), requiredDate: new Date('2025-01-25'),
    status: 'CONFIRMED', priority: 'NORMAL', subtotal: 163636364, taxAmount: 16363636, discount: 0, totalAmount: 180000000,
    createdBy: 'admin', createdAt: new Date('2025-01-03'), updatedAt: now,
    items: [
      { id: 'soi3', salesOrderId: 'so3', partId: 'fg3', quantity: 15, unitPrice: 12000000, discount: 0, taxRate: 0.1, lineTotal: 180000000 }
    ]
  },
  {
    id: 'so4', orderNumber: 'SO-2024-155', customerId: 'c4', orderDate: new Date('2024-12-28'), requiredDate: new Date('2025-01-10'),
    status: 'IN_PRODUCTION', priority: 'NORMAL', subtotal: 116363636, taxAmount: 11636364, discount: 0, totalAmount: 128000000,
    createdBy: 'admin', createdAt: new Date('2024-12-28'), updatedAt: now,
    items: [
      { id: 'soi4', salesOrderId: 'so4', partId: 'fg1', quantity: 8, unitPrice: 15000000, discount: 5000000, taxRate: 0.1, lineTotal: 128000000 }
    ]
  },
  {
    id: 'so5', orderNumber: 'SO-2024-154', customerId: 'c5', orderDate: new Date('2024-12-25'), requiredDate: new Date('2025-01-05'),
    status: 'SHIPPED', priority: 'NORMAL', subtotal: 86363636, taxAmount: 8636364, discount: 0, totalAmount: 95000000,
    shippedDate: new Date('2025-01-04'), createdBy: 'admin', createdAt: new Date('2024-12-25'), updatedAt: now,
    items: [
      { id: 'soi5', salesOrderId: 'so5', partId: 'fg2', quantity: 5, unitPrice: 18500000, discount: 2500000, taxRate: 0.1, lineTotal: 95000000 }
    ]
  },
];

// Work Orders
export const mockWorkOrders: WorkOrder[] = [
  { id: 'wo1', orderNumber: 'WO-2025-001', salesOrderId: 'so1', productPartId: 'fg1', quantity: 10, completedQty: 0, scrapQty: 0, plannedStart: new Date('2025-01-05'), plannedEnd: new Date('2025-01-12'), status: 'RELEASED', priority: 'NORMAL', workstation: 'Line-01', progress: 0, createdAt: oneWeekAgo, updatedAt: now },
  { id: 'wo2', orderNumber: 'WO-2025-002', salesOrderId: 'so4', productPartId: 'fg1', quantity: 8, completedQty: 5, scrapQty: 0, plannedStart: new Date('2025-01-02'), plannedEnd: new Date('2025-01-08'), actualStart: new Date('2025-01-02'), status: 'IN_PROGRESS', priority: 'NORMAL', workstation: 'Line-01', progress: 62.5, createdAt: oneWeekAgo, updatedAt: now },
  { id: 'wo3', orderNumber: 'WO-2024-048', productPartId: 'fg2', quantity: 5, completedQty: 5, scrapQty: 0, plannedStart: new Date('2024-12-28'), plannedEnd: new Date('2025-01-03'), actualStart: new Date('2024-12-28'), actualEnd: new Date('2025-01-02'), status: 'COMPLETED', priority: 'NORMAL', workstation: 'Line-02', progress: 100, createdAt: oneMonthAgo, updatedAt: now },
  { id: 'wo4', orderNumber: 'WO-2025-003', salesOrderId: 'so3', productPartId: 'fg3', quantity: 15, completedQty: 0, scrapQty: 0, plannedStart: new Date('2025-01-10'), plannedEnd: new Date('2025-01-20'), status: 'PLANNED', priority: 'NORMAL', workstation: 'Line-03', progress: 0, createdAt: now, updatedAt: now },
];

// Quality Records (NCRs)
export const mockQualityRecords: QualityRecord[] = [
  { id: 'ncr1', recordNumber: 'NCR-2025-001', type: 'NCR', status: 'OPEN', severity: 'MAJOR', workOrderId: 'wo2', partId: 'p1', quantity: 2, description: 'Bạc đạn bị rỉ sét từ lô hàng mới nhập', reportedBy: 'QC Team', reportedDate: now },
  { id: 'ncr2', recordNumber: 'NCR-2024-042', type: 'NCR', status: 'CLOSED', severity: 'MINOR', partId: 'rm1', quantity: 5, description: 'Thép không đúng độ dày quy cách', rootCause: 'Lỗi từ nhà cung cấp', correctiveAction: 'Đổi lô hàng', closedBy: 'QC Manager', closedDate: oneWeekAgo, reportedBy: 'QC Team', reportedDate: oneWeekAgo },
  { id: 'ncr3', recordNumber: 'NCR-2025-002', type: 'NCR', status: 'IN_PROGRESS', severity: 'MINOR', workOrderId: 'wo3', description: 'Sai kích thước lắp ráp', rootCause: 'Jig bị mòn', correctiveAction: 'Thay thế jig mới', reportedBy: 'Production', reportedDate: now },
];

// Activity Log
export const mockActivityLog: ActivityLog[] = [
  { id: 'act1', entityType: 'SalesOrder', entityId: 'so2', action: 'CREATE', description: 'Tạo đơn hàng SO-2025-002 - XYZ Industries', userName: 'Nguyễn Văn A', createdAt: new Date(now.getTime() - 30 * 60000) },
  { id: 'act2', entityType: 'Inventory', entityId: 'inv2', action: 'UPDATE', description: 'Nhập kho CMP-MOT-001 - 10 pcs', userName: 'Trần Thị B', createdAt: new Date(now.getTime() - 60 * 60000) },
  { id: 'act3', entityType: 'WorkOrder', entityId: 'wo3', action: 'UPDATE', description: 'Hoàn thành WO-2024-048 - Model A2', userName: 'Lê Văn C', createdAt: new Date(now.getTime() - 90 * 60000) },
  { id: 'act4', entityType: 'QualityRecord', entityId: 'ncr2', action: 'UPDATE', description: 'Đóng NCR-2024-042 - Đã khắc phục', userName: 'Phạm Thị D', createdAt: new Date(now.getTime() - 120 * 60000) },
  { id: 'act5', entityType: 'MRPRun', entityId: 'mrp1', action: 'CREATE', description: 'Chạy MRP cho 3 đơn hàng mới', userName: 'System', createdAt: new Date(now.getTime() - 150 * 60000) },
];

// =============================================================================
// DATA SERVICE
// =============================================================================

class DataService {
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return mockSuppliers;
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    return mockSuppliers.find(s => s.id === id) || null;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return mockCustomers;
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return mockCustomers.find(c => c.id === id) || null;
  }

  // Parts
  async getParts(category?: PartCategory): Promise<Part[]> {
    if (category) {
      return mockParts.filter(p => p.category === category);
    }
    return mockParts;
  }

  async getPartById(id: string): Promise<Part | null> {
    return mockParts.find(p => p.id === id) || null;
  }

  async getPartByNumber(partNumber: string): Promise<Part | null> {
    return mockParts.find(p => p.partNumber === partNumber) || null;
  }

  // BOM
  async getBOMForPart(partId: string): Promise<BOMItem[]> {
    return mockBOMItems.filter(b => b.parentPartId === partId).map(b => ({
      ...b,
      childPart: mockParts.find(p => p.id === b.childPartId)
    }));
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return mockInventory.map(inv => ({
      ...inv,
      part: mockParts.find(p => p.id === inv.partId)
    }));
  }

  async getInventoryByPartId(partId: string): Promise<Inventory | null> {
    const inv = mockInventory.find(i => i.partId === partId);
    if (inv) {
      return { ...inv, part: mockParts.find(p => p.id === inv.partId) };
    }
    return null;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return mockInventory.filter(inv => inv.available <= inv.reorderPoint).map(inv => ({
      ...inv,
      part: mockParts.find(p => p.id === inv.partId)
    }));
  }

  async getCriticalStockItems(): Promise<Inventory[]> {
    return mockInventory.filter(inv => inv.available <= inv.safetyStock).map(inv => ({
      ...inv,
      part: mockParts.find(p => p.id === inv.partId)
    }));
  }

  // Sales Orders
  async getSalesOrders(status?: SalesOrderStatus): Promise<SalesOrder[]> {
    let orders = mockSalesOrders;
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    return orders.map(o => ({
      ...o,
      customer: mockCustomers.find(c => c.id === o.customerId)
    }));
  }

  async getSalesOrderById(id: string): Promise<SalesOrder | null> {
    const order = mockSalesOrders.find(o => o.id === id);
    if (order) {
      return {
        ...order,
        customer: mockCustomers.find(c => c.id === order.customerId),
        items: order.items?.map(item => ({
          ...item,
          part: mockParts.find(p => p.id === item.partId)
        }))
      };
    }
    return null;
  }

  // Work Orders
  async getWorkOrders(status?: WorkOrderStatus): Promise<WorkOrder[]> {
    let orders = mockWorkOrders;
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    return orders;
  }

  // Quality
  async getQualityRecords(status?: QualityStatus): Promise<QualityRecord[]> {
    if (status) {
      return mockQualityRecords.filter(r => r.status === status);
    }
    return mockQualityRecords;
  }

  async getOpenNCRs(): Promise<QualityRecord[]> {
    return mockQualityRecords.filter(r => r.type === 'NCR' && r.status !== 'CLOSED' && r.status !== 'CANCELLED');
  }

  // Activity
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return mockActivityLog.slice(0, limit);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const orders = mockSalesOrders;
    const inventory = mockInventory;
    const workOrders = mockWorkOrders;
    const ncrs = mockQualityRecords.filter(r => r.type === 'NCR');

    // Revenue calculation
    const currentMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    });
    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const previousRevenue = currentRevenue * 0.87; // Mock 15% growth

    // Order stats
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const processingOrders = orders.filter(o => ['CONFIRMED', 'IN_PRODUCTION'].includes(o.status)).length;
    const completedOrders = orders.filter(o => ['SHIPPED', 'DELIVERED'].includes(o.status)).length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    // Inventory stats
    const lowStock = inventory.filter(i => i.available <= i.reorderPoint && i.available > i.safetyStock).length;
    const outOfStock = inventory.filter(i => i.available <= i.safetyStock).length;
    const totalValue = inventory.reduce((sum, i) => {
      const part = mockParts.find(p => p.id === i.partId);
      return sum + (i.onHand * (part?.unitCost || 0));
    }, 0);

    // Production stats
    const runningWO = workOrders.filter(wo => wo.status === 'IN_PROGRESS').length;
    const waitingWO = workOrders.filter(wo => ['PLANNED', 'RELEASED'].includes(wo.status)).length;
    const completedWO = workOrders.filter(wo => wo.status === 'COMPLETED').length;
    const onHoldWO = workOrders.filter(wo => wo.status === 'ON_HOLD').length;
    const efficiency = workOrders.filter(wo => wo.status === 'COMPLETED')
      .reduce((sum, wo) => sum + (wo.completedQty / wo.quantity), 0) / (completedWO || 1) * 100;

    // Quality stats
    const openNCRs = ncrs.filter(r => r.status !== 'CLOSED' && r.status !== 'CANCELLED').length;
    const criticalNCRs = ncrs.filter(r => r.severity === 'CRITICAL' && r.status !== 'CLOSED').length;

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
        currency: 'VND'
      },
      orders: {
        total: orders.length,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        growth: 8.2
      },
      inventory: {
        totalItems: inventory.length,
        totalValue,
        lowStock,
        outOfStock,
        healthy: inventory.length - lowStock - outOfStock
      },
      production: {
        efficiency: Math.round(efficiency * 10) / 10 || 94.5,
        running: runningWO,
        waiting: waitingWO,
        completed: completedWO,
        onHold: onHoldWO
      },
      quality: {
        passRate: 98.2,
        openNCRs,
        inspectionsToday: 24,
        criticalNCRs
      },
      purchasing: {
        pendingPOs: 3,
        pendingValue: 45000000,
        overdueDeliveries: 1
      }
    };
  }
}

// Export singleton
export const dataService = new DataService();
export default dataService;
