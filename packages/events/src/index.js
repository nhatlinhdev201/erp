// ============================================================
// @linkk/events - Main Entry Point
// TIP-019: NATS Inter-module Event Flows
// RRI-T Upgraded: DLQ + Versioning + Idempotency
// ============================================================
// ─── Core Types ─────────────────────────────────────────────
export { Module, EventBus, createEventBus, } from './types';
// ─── Event Schemas ──────────────────────────────────────────
export { AllEventSchemas } from './schemas';
// CRM Event Schemas
export { LeadCreatedSchema, LeadScoredSchema, LeadConvertedSchema, DealWonSchema, DealLostSchema, CRMEventSchemas, } from './schemas/crm.events';
// Accounting Event Schemas
export { InvoiceCreatedSchema, InvoiceApprovedSchema, InvoicePaidSchema, PaymentReceivedSchema, JournalEntryPostedSchema, AccountingEventSchemas, } from './schemas/accounting.events';
// Ecommerce Event Schemas
export { OrderPlacedSchema, OrderShippedSchema, OrderDeliveredSchema, OrderCancelledSchema, PaymentCompletedSchema, EcommerceEventSchemas, } from './schemas/ecommerce.events';
// MRP Event Schemas
export { ProductionOrderCreatedSchema, ProductionCompletedSchema, InventoryUpdatedSchema, StockLowSchema, QualityCheckPassedSchema, MRPEventSchemas, } from './schemas/mrp.events';
// HRM Event Schemas
export { EmployeeOnboardedSchema, LeaveRequestedSchema, LeaveApprovedSchema, PayrollProcessedSchema, AttendanceRecordedSchema, HRMEventSchemas, } from './schemas/hrm.events';
// ─── Event Bus ──────────────────────────────────────────────
export { EventBus, createEventBus } from './event-bus';
// ─── Event Flows ────────────────────────────────────────────
export { mapDealWonToInvoice, CRMToAccountingFlow, validateInvoiceMapping, } from './flows/crm-to-accounting';
export { checkInventoryAndCreateProductionOrder, mapProductionCompletedToInventory, EcommerceToMRPFlows, validateProductionOrder, validateInventoryUpdate, } from './flows/ecommerce-to-mrp';
export { mapPayrollToJournalEntry, HRMToAccountingFlow, validatePayrollJournal, getAccountReconciliation, } from './flows/hrm-to-accounting';
export { AllEventFlows, getFlowsByTrigger, FlowRegistry, } from './flows';
// ─── Legacy API (backward compatibility) ────────────────────
export { publish, publishBatch } from './publisher';
export { subscribe } from './subscriber';
export { getConnection, getJetStream, ensureStreams, closeConnection, } from './connection';
// ─── DLQ (Dead Letter Queue) ────────────────────────────────
export { DeadLetterQueue, getDLQ, calculateRetryDelay, shouldRetry, RETRY_POLICIES, } from './dlq';
// ─── Event Versioning + Idempotency ────────────────────────
export { getSchemaRegistry, IdempotencyStore, getIdempotencyStore, createVersionedEnvelope, processIncomingEvent, generateCorrelationId, generateCausationId, } from './versioning';
//# sourceMappingURL=index.js.map