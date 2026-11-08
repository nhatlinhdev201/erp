// ============================================================
// @linkk/shared - Constants
// ============================================================

// ==================== Module Registry ====================

export const ERP_MODULES = {
  MRP: { id: 'mrp', name: 'Material Requirements Planning', port: 3001, path: '/mrp' },
  HRM: { id: 'hrm', name: 'Human Resource Management', port: 3002, path: '/hrm' },
  CRM: { id: 'crm', name: 'Customer Relationship Management', port: 3003, path: '/crm' },
  TPM: { id: 'tpm', name: 'Trade Promotion Management', port: 3004, path: '/tpm' },
  OTB: { id: 'otb', name: 'Order-to-Bill', port: 3005, path: '/otb' },
  PM:  { id: 'pm', name: 'Project Management', port: 3006, path: '/pm' },
  ACC: { id: 'acc', name: 'Accounting & Finance', port: 3007, path: '/acc' },
  XAI: { id: 'xai', name: 'ExcelAI', port: 3008, path: '/excel-ai' },
} as const;

// ==================== Event Subjects (NATS) ====================

export const EVENT_SUBJECTS = {
  CUSTOMER: {
    CREATED: 'lerp.customer.created',
    UPDATED: 'lerp.customer.updated',
    DELETED: 'lerp.customer.deleted',
  },
  PRODUCT: {
    CREATED: 'lerp.product.created',
    UPDATED: 'lerp.product.updated',
    DELETED: 'lerp.product.deleted',
  },
  EMPLOYEE: {
    CREATED: 'lerp.employee.created',
    UPDATED: 'lerp.employee.updated',
    TERMINATED: 'lerp.employee.terminated',
  },
  SUPPLIER: {
    CREATED: 'lerp.supplier.created',
    UPDATED: 'lerp.supplier.updated',
    DELETED: 'lerp.supplier.deleted',
  },
  ORDER: {
    CREATED: 'lerp.order.created',
    CONFIRMED: 'lerp.order.confirmed',
    SHIPPED: 'lerp.order.shipped',
    COMPLETED: 'lerp.order.completed',
    CANCELLED: 'lerp.order.cancelled',
  },
  INVENTORY: {
    UPDATED: 'lerp.inventory.updated',
    LOW_STOCK: 'lerp.inventory.low_stock',
    TRANSFER: 'lerp.inventory.transfer',
  },
  PRODUCTION: {
    STARTED: 'lerp.production.started',
    COMPLETED: 'lerp.production.completed',
    FAILED: 'lerp.production.failed',
  },
  INVOICE: {
    CREATED: 'lerp.invoice.created',
    SENT: 'lerp.invoice.sent',
    PAID: 'lerp.invoice.paid',
    OVERDUE: 'lerp.invoice.overdue',
  },
  ACCOUNTING: {
    JOURNAL_POSTED: 'lerp.accounting.journal_posted',
    PAYMENT_RECEIVED: 'lerp.accounting.payment_received',
    PAYMENT_MADE: 'lerp.accounting.payment_made',
  },
} as const;

// ==================== API Paths ====================

export const API_BASE = '/api/v1';
export const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';
export const SSO_URL = process.env.SSO_URL || 'http://localhost:8080';
export const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

// ==================== Vietnamese Accounting ====================

export const VAS_ACCOUNT_TYPES = {
  ASSET: '1',           // Tài sản
  LIABILITY: '3',       // Nợ phải trả
  EQUITY: '4',          // Vốn chủ sở hữu
  REVENUE: '5',         // Doanh thu
  OTHER_REVENUE: '7',   // Thu nhập khác
  EXPENSE: '6',         // Chi phí
  OTHER_EXPENSE: '8',   // Chi phí khác
  COST: '6',            // Giá vốn
} as const;

export const TAX_RATES = {
  VAT_STANDARD: 0.10,   // 10% VAT chuẩn
  VAT_REDUCED: 0.05,    // 5% VAT ưu đãi
  VAT_EXEMPT: 0,        // Miễn thuế
  CIT_STANDARD: 0.20,   // 20% Thuế TNDN
  PIT_RATES: [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35], // Thuế TNCN luỹ tiến
} as const;

// ==================== Pagination Defaults ====================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ==================== Date Formats ====================

export const DATE_FORMAT_VN = 'dd/MM/yyyy';
export const DATETIME_FORMAT_VN = 'dd/MM/yyyy HH:mm';
export const DATE_FORMAT_ISO = 'yyyy-MM-dd';
