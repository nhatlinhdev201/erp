// ============================================================
// @linkk/master-data — Master Data Service
// Single source of truth for shared entities across the ERP
//
// Architecture:
//   Module (HRM/CRM/MRP) → NATS Event → Master Data Handler → DB
//   Master Data API → NATS Event → Module Subscribers
//
// Usage:
//   // 1. Start sync engine at app startup
//   import { startMasterDataSync } from '@linkk/master-data';
//   await startMasterDataSync();
//
//   // 2. Use services directly
//   import { customerService, productService } from '@linkk/master-data';
//   const customer = await customerService.get(id, tenantId);
//
//   // 3. Create Next.js API routes instantly
//   import { createEntityRoutes } from '@linkk/master-data/api';
//   export const { GET, POST, PUT, DELETE } = createEntityRoutes('customer');
// ============================================================

// Services
export {
  customerService,
  productService,
  employeeService,
  supplierService,
  CustomerService,
  ProductService,
  EmployeeService,
  SupplierService,
  BaseMasterDataService,
  MasterDataError,
} from './services';

// Event Handlers (sync engine)
export { startMasterDataSync } from './handlers';

// API Handlers
export {
  handleList,
  handleGet,
  handleGetByCode,
  handleCreate,
  handleUpdate,
  handleDelete,
  handleRestore,
  handleBulk,
  handleStats,
  createEntityRoutes,
} from './api';

// Types
export type {
  Supplier,
  Warehouse,
  UnitOfMeasure,
  MasterDataEntity,
  SyncAction,
  SyncEvent,
  SyncResult,
  SyncConflict,
  MasterDataQuery,
  BulkOperation,
  BulkResult,
  ChangeRecord,
} from './types';
