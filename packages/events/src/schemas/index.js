// ============================================================
// @linkk/events - Event Schemas Index
// Re-export all event schemas
// ============================================================
// CRM Schemas
export { LeadCreatedSchema, LeadScoredSchema, LeadConvertedSchema, DealWonSchema, DealLostSchema, CRMEventSchemas, } from './crm.events';
// Accounting Schemas
export { InvoiceCreatedSchema, InvoiceApprovedSchema, InvoicePaidSchema, PaymentReceivedSchema, JournalEntryPostedSchema, AccountingEventSchemas, } from './accounting.events';
// Ecommerce Schemas
export { OrderPlacedSchema, OrderShippedSchema, OrderDeliveredSchema, OrderCancelledSchema, PaymentCompletedSchema, EcommerceEventSchemas, } from './ecommerce.events';
// MRP Schemas
export { ProductionOrderCreatedSchema, ProductionCompletedSchema, InventoryUpdatedSchema, StockLowSchema, QualityCheckPassedSchema, MRPEventSchemas, } from './mrp.events';
// HRM Schemas
export { EmployeeOnboardedSchema, LeaveRequestedSchema, LeaveApprovedSchema, PayrollProcessedSchema, AttendanceRecordedSchema, HRMEventSchemas, } from './hrm.events';
/**
 * Unified event schema registry
 * Dùng để lookup schema theo event type
 */
export const AllEventSchemas = {
    ...CRMEventSchemas,
    ...AccountingEventSchemas,
    ...EcommerceEventSchemas,
    ...MRPEventSchemas,
    ...HRMEventSchemas,
};
//# sourceMappingURL=index.js.map