# @erp/events - NATS Event Bus for L-ERP

Thư viện sự kiện (Event Bus) cho hệ thống ERP, sử dụng NATS JetStream để xử lý inter-module messaging với type-safe validation và event flows.

## Tổng quan

Gói này cung cấp:

- **Typed Event Schemas** — Zod-validated event definitions cho 5 modules chính
- **Event Bus Client** — Type-safe publish/subscribe API
- **Inter-module Flows** — Tự động trigger downstream events khi upstream events xảy ra
- **Correlation & Causation IDs** — Tracing sự kiện liên quan để debugging
- **Retry & Dead Letter Queue** — Resilience patterns cho event processing
- **Multi-tenancy** — Hỗ trợ tenant isolation

## Cấu trúc

```
packages/events/
├── src/
│   ├── types.ts                 # Core types: BaseEvent, Module, EventBusConfig
│   ├── event-bus.ts             # EventBus class with publish/subscribe
│   ├── schemas/
│   │   ├── index.ts             # Re-export all schemas
│   │   ├── crm.events.ts        # CRM event definitions
│   │   ├── accounting.events.ts # Accounting event definitions
│   │   ├── ecommerce.events.ts  # Ecommerce event definitions
│   │   ├── mrp.events.ts        # MRP event definitions
│   │   └── hrm.events.ts        # HRM event definitions
│   ├── flows/
│   │   ├── index.ts             # Flow registry and utilities
│   │   ├── crm-to-accounting.ts # CRM DealWon → Accounting Invoice
│   │   ├── ecommerce-to-mrp.ts  # Ecommerce Order → MRP Production
│   │   └── hrm-to-accounting.ts # HRM Payroll → Accounting Journal
│   ├── connection.ts            # NATS connection management
│   ├── publisher.ts             # Legacy publish API
│   ├── subscriber.ts            # Legacy subscribe API
│   ├── dlq.ts                   # Dead Letter Queue implementation
│   └── versioning.ts            # Schema versioning & idempotency
├── package.json
├── tsconfig.json
└── README.md
```

## Module Enum

```typescript
enum Module {
  CRM = 'crm',
  ACCOUNTING = 'accounting',
  ECOMMERCE = 'ecommerce',
  MRP = 'mrp',
  HRM = 'hrm',
  OTB = 'otb',
  TPM = 'tpm',
  PM = 'pm',
}
```

## Event Schemas

### CRM Events

```typescript
import { DealWonSchema } from '@erp/events';

// Event: crm.deal.won
// Triggered: When sales opportunity is marked as won
// Schema:
{
  dealId: string;
  opportunityId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  dealDescription?: string;
  closedDate: string; // ISO 8601
  products?: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}
```

**Sự kiện khác:**
- `crm.lead.created` — Tạo mới lead
- `crm.lead.scored` — Cập nhật lead score
- `crm.lead.converted` — Chuyển đổi lead thành contact/opportunity
- `crm.deal.lost` — Mất thương vụ

### Accounting Events

```typescript
import { InvoiceCreatedSchema } from '@erp/events';

// Event: accounting.invoice.created
// Triggered: When invoice is created (manual or auto from CRM)
// Schema:
{
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  orderRef?: string; // Reference to sales/ecommerce order
  invoiceDate: string; // ISO 8601
  dueDate: string;
  currency: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  lineItems: Array<{
    lineId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    taxCode?: string;
  }>;
  notes?: string;
}
```

**Sự kiện khác:**
- `accounting.invoice.approved` — Hóa đơn được phê duyệt
- `accounting.invoice.paid` — Hóa đơn được thanh toán
- `accounting.payment.received` — Nhận thanh toán từ customer
- `accounting.journal.posted` — Bút toán được ghi nhập

### Ecommerce Events

```typescript
import { OrderPlacedSchema } from '@erp/events';

// Event: ecommerce.order.placed
// Triggered: When customer completes checkout
// Flows to: MRP (inventory check + production order)
// Schema:
{
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: { street, city, province, postalCode, country };
  billingAddress?: { street, city, province, postalCode, country };
  orderDate: string; // ISO 8601
  currency: string;
  subtotal: number;
  shippingCost: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  lineItems: Array<{
    lineId: string;
    productId: string;
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'wallet' | 'cash_on_delivery' | 'other';
  shippingMethod: string;
  notes?: string;
}
```

**Sự kiện khác:**
- `ecommerce.order.shipped` — Đơn hàng được gửi đi
- `ecommerce.order.delivered` — Đơn hàng được giao
- `ecommerce.order.cancelled` — Đơn hàng bị hủy
- `ecommerce.payment.completed` — Thanh toán hoàn tất

### MRP Events

```typescript
import { ProductionOrderCreatedSchema } from '@erp/events';

// Event: mrp.production_order.created
// Triggered: When inventory is low (from ecommerce order) or MRP planning
// Schema:
{
  productionOrderId: string;
  productionOrderNumber: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number; // Số lượng sản xuất
  plannedStartDate: string;
  plannedEndDate: string;
  sourceOrder: 'sales_order' | 'ecommerce_order' | 'forecast' | 'replenishment';
  sourceOrderId?: string;
  routingId?: string;
  bomVersion?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  costCenter?: string;
  notes?: string;
  billOfMaterials?: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    wastagePercent?: number;
  }>;
}
```

**Sự kiện khác:**
- `mrp.production.completed` — Sản xuất hoàn tất → triggers `mrp.inventory.updated`
- `mrp.inventory.updated` — Cập nhật tồn kho
- `mrp.stock.low` — Tồn kho chạm ngưỡng tối thiểu
- `mrp.quality_check.passed` — Kiểm chất lượng đạt yêu cầu

### HRM Events

```typescript
import { PayrollProcessedSchema } from '@erp/events';

// Event: hrm.payroll.processed
// Triggered: When payroll is processed each month
// Flows to: Accounting (journal entries for salary expenses)
// Schema:
{
  payrollId: string;
  payrollNumber: string;
  payrollPeriod: { startDate: string; endDate: string };
  processedDate: string;
  paymentDate?: string;
  currency: string;
  employees: Array<{
    employeeId: string;
    employeeNumber: string;
    employeeName: string;
    baseSalary: number;
    grossSalary: number;
    incomeTax: number;
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    otherDeductions?: number;
    netSalary: number;
    department?: string;
    costCenter?: string;
  }>;
  totalGrossSalary: number;
  totalIncomeTax: number;
  totalSocialContributions: number;
  totalNetSalary: number;
  employerContributions?: number;
  status: 'draft' | 'processed' | 'approved' | 'paid';
  approvedBy?: string;
  notes?: string;
}
```

**Sự kiện khác:**
- `hrm.employee.onboarded` — Nhân viên được tuyển dụng
- `hrm.leave.requested` — Yêu cầu phép
- `hrm.leave.approved` — Phép được phê duyệt
- `hrm.attendance.recorded` — Chấm công

## Sử dụng (Usage)

### 1. Khởi tạo Event Bus

```typescript
import { createEventBus, Module } from '@erp/events';

const eventBus = createEventBus({
  natsUrl: 'nats://localhost:4222',
  module: Module.CRM,
});
```

### 2. Publish Event

```typescript
import { DealWonSchema } from '@erp/events';

const event = await eventBus.publish('crm.deal.won', {
  dealId: 'deal-123',
  opportunityId: 'opp-456',
  customerId: 'cust-789',
  customerEmail: 'john@acme.com',
  customerName: 'John Doe',
  amount: 50000,
  currency: 'VND',
  closedDate: new Date().toISOString(),
  products: [
    {
      productId: 'prod-1',
      name: 'Premium Plan',
      quantity: 1,
      unitPrice: 50000,
      lineTotal: 50000,
    },
  ],
}, {
  tenantId: 'tenant-001',
  userId: 'user-001',
  metadata: { source: 'web-ui' },
});

console.log(`Published: ${event.id}`);
```

### 3. Subscribe to Event

```typescript
import { InvoiceCreatedSchema } from '@erp/events';

// This runs automatically in Accounting module
await eventBus.subscribe('crm.deal.won', async (event) => {
  console.log(`Received: ${event.type} from ${event.source}`);

  // Auto-create invoice from deal
  const invoice = await mapDealWonToInvoice(event);

  // Publish invoice event
  await eventBus.publish('accounting.invoice.created', invoice, {
    tenantId: event.tenantId,
    userId: event.userId,
    correlationId: event.correlationId,
  });
}, {
  consumerGroup: 'accounting-invoice-creator',
});
```

### 4. Event Flows (Automatic)

Event flows định nghĩa các luồng sự kiện tự động:

```typescript
// Flow: CRM DealWon → Accounting Invoice
// When: crm.deal.won event is published
// Then: Automatically create accounting.invoice.created event

// Flow: Ecommerce OrderPlaced → MRP ProductionOrder
// When: ecommerce.order.placed event is published
// Then: Check inventory and create mrp.production_order.created if needed

// Flow: HRM PayrollProcessed → Accounting JournalEntry
// When: hrm.payroll.processed event is published
// Then: Auto-create salary expense accounting.journal.posted entries
```

## Event Flow Diagrams

### CRM → Accounting Flow

```
┌──────────────────────────────────────────────────────────┐
│                      CRM Module                          │
│                                                          │
│  Salesman marks Opportunity as WON                      │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  crm.deal.won event published        │              │
│  │  - dealId, customerId, amount        │              │
│  │  - products, customerEmail           │              │
│  └──────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
                     ↓ NATS JetStream
┌──────────────────────────────────────────────────────────┐
│              Accounting Module                           │
│                                                          │
│  Event Flow: mapDealWonToInvoice                        │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │ accounting.invoice.created           │              │
│  │ - invoiceId, invoiceNumber           │              │
│  │ - lineItems mapped from deal         │              │
│  │ - dueDate = invoiceDate + 30 days    │              │
│  └──────────────────────────────────────┘              │
│          ↓                                               │
│  Invoice stored in Accounting system                    │
│  Ready for approval & payment tracking                  │
└──────────────────────────────────────────────────────────┘
```

### Ecommerce → MRP Flow

```
┌──────────────────────────────────────────────────────────┐
│                  Ecommerce Module                        │
│                                                          │
│  Customer completes checkout                            │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  ecommerce.order.placed              │              │
│  │  - orderId, lineItems with qty       │              │
│  │  - customerId, shippingAddress       │              │
│  └──────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
                     ↓ NATS JetStream
┌──────────────────────────────────────────────────────────┐
│                   MRP Module                             │
│                                                          │
│  Event Flow: checkInventoryAndCreateProductionOrder    │
│          ↓                                               │
│  For each product in order:                             │
│    - Query current stock                                │
│    - If stock < minimum + order qty                     │
│      Then: Create production order                      │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  mrp.production_order.created        │              │
│  │  - productionOrderNumber, productId  │              │
│  │  - quantity with 10% buffer          │              │
│  │  - sourceOrder: 'ecommerce_order'    │              │
│  └──────────────────────────────────────┘              │
│                                                          │
│  Production Completes                                   │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  mrp.production.completed            │              │
│  │  - productionOrderId, producedQty    │              │
│  └──────────────────────────────────────┘              │
│          ↓ (triggers next flow)                         │
│  ┌──────────────────────────────────────┐              │
│  │  mrp.inventory.updated               │              │
│  │  - warehouseId, newQuantity          │              │
│  └──────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### HRM → Accounting Flow

```
┌──────────────────────────────────────────────────────────┐
│                     HRM Module                           │
│                                                          │
│  Payroll Officer runs monthly payroll                   │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  hrm.payroll.processed               │              │
│  │  - payrollNumber, employees[]        │              │
│  │  - totalGrossSalary, taxes, deduct   │              │
│  └──────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
                     ↓ NATS JetStream
┌──────────────────────────────────────────────────────────┐
│              Accounting Module                           │
│                                                          │
│  Event Flow: mapPayrollToJournalEntry                   │
│          ↓                                               │
│  Build Journal Entry Lines:                             │
│    Dr. Salary Expense → Cr. Salaries Payable            │
│    Dr. Income Tax → Cr. Tax Payable                     │
│    Dr. Insurance → Cr. Insurance Payable                │
│          ↓                                               │
│  ┌──────────────────────────────────────┐              │
│  │  accounting.journal.posted           │              │
│  │  - journalNumber, journalDate        │              │
│  │  - lines with debits/credits         │              │
│  │  - balances verified (Dr = Cr)       │              │
│  └──────────────────────────────────────┘              │
│          ↓                                               │
│  Journal Entry posted to General Ledger                 │
│  Ready for reconciliation & reporting                   │
└──────────────────────────────────────────────────────────┘
```

## Correlation & Causation IDs

Mỗi event được tracing bằng IDs để follow events chain:

```typescript
// Event 1: Deal Won
event1 = {
  id: 'evt-1',
  type: 'crm.deal.won',
  correlationId: 'corr-abc123',  // Unique trace ID
  causationId: 'caus-xyz789',    // Caused by what?
}

// Event 2: Invoice Created (triggered by Event 1)
event2 = {
  id: 'evt-2',
  type: 'accounting.invoice.created',
  correlationId: 'corr-abc123',  // Same correlation ID!
  causationId: 'evt-1',          // Caused by event1
}

// Trace: Find all events with correlationId='corr-abc123'
// Result: evt-1 → evt-2 → evt-3 ... (complete flow)
```

## Type Safety

Tất cả events được validate với Zod schemas:

```typescript
import { DealWonSchema } from '@erp/events';

// Runtime validation
try {
  const validated = DealWonSchema.parse(payload);
  // validated is DealWon type
} catch (error) {
  // ZodError with details about invalid fields
  console.error(error.issues);
}
```

## Error Handling

### Retry Policy

```typescript
const eventBus = createEventBus({
  natsUrl: 'nats://localhost:4222',
  module: Module.ACCOUNTING,
  retryPolicy: {
    maxRetries: 3,        // Retry up to 3 times
    backoffMs: 1000,      // Initial backoff: 1 second
    maxBackoffMs: 30000,  // Max backoff: 30 seconds
  },
});
```

### Dead Letter Queue

Failed events after retries go to DLQ:

```typescript
import { getDLQ } from '@erp/events';

const dlq = getDLQ();

// List dead lettered events
const deadEvents = await dlq.listEntries({
  eventType: 'accounting.invoice.created',
  limit: 100,
});

// Retry specific DLQ entry
await dlq.retryEntry('dlq-entry-id');
```

### Custom Error Handler

```typescript
await eventBus.subscribe('crm.deal.won', handler, {
  consumerGroup: 'invoice-creator',
  maxRetries: 3,
  onError: async (error, event) => {
    console.error(`Failed to process ${event.type}:`, error);
    // Send alert, log to external system, etc.
  },
});
```

## Best Practices

1. **Idempotency** — Event handlers must be idempotent (safe to run multiple times)
2. **Validation** — Always validate payloads before processing
3. **Correlation IDs** — Use correlationId for distributed tracing
4. **Error Handling** — Implement proper retry and DLQ strategies
5. **Testing** — Mock EventBus in unit tests
6. **Monitoring** — Track event lag, failed events, DLQ depth

## Ví dụ: Complete Flow

```typescript
// 1. CRM publishes DealWon
const crmBus = createEventBus({
  natsUrl: 'nats://localhost:4222',
  module: Module.CRM,
});

const dealEvent = await crmBus.publish('crm.deal.won', {
  dealId: 'deal-123',
  opportunityId: 'opp-456',
  customerId: 'cust-789',
  customerEmail: 'customer@acme.com',
  customerName: 'ACME Corp',
  amount: 100000,
  currency: 'VND',
  closedDate: new Date().toISOString(),
}, {
  tenantId: 'tenant-001',
  userId: 'user-sales-001',
});

// 2. Accounting automatically subscribes and creates invoice
const accountingBus = createEventBus({
  natsUrl: 'nats://localhost:4222',
  module: Module.ACCOUNTING,
});

await accountingBus.subscribe('crm.deal.won', async (event) => {
  const invoice = await mapDealWonToInvoice(event);

  // Validate before publishing
  const validation = validateInvoiceMapping(invoice);
  if (!validation.valid) {
    throw new Error(`Invalid invoice: ${validation.errors.join(', ')}`);
  }

  // Publish with same correlation ID
  await accountingBus.publish('accounting.invoice.created', invoice, {
    tenantId: event.tenantId,
    userId: event.userId,
    correlationId: event.correlationId,
    causationId: event.id,
  });
}, {
  consumerGroup: 'accounting-invoices',
  maxRetries: 3,
  onError: async (error, event) => {
    console.error(`Invoice creation failed for ${event.type}:`, error);
  },
});

// 3. Trace complete flow using correlationId
const correlationId = dealEvent.correlationId;
// Find all events with this correlationId in NATS history
// Result: crm.deal.won → accounting.invoice.created → ... (complete chain)
```

## Roadmap

- [ ] Event replay from historical timestamps
- [ ] Schema evolution & migrations
- [ ] Event sourcing database backend
- [ ] GraphQL subscription support
- [ ] Event visualizer UI
- [ ] Performance metrics & dashboards
- [ ] Saga pattern for long-running workflows

## Contributing

Các thay đổi đến event schemas phải:
1. Thêm `version` field nếu là breaking change
2. Cập nhật documentation
3. Thêm migration logic trong `versioning.ts`
4. Test event flow mappings

## License

Proprietary - L-ERP Project
