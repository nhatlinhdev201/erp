/**
 * Document PDF Generators - L-ERP MRP System
 *
 * Usage:
 *   import { generatePurchaseOrderPDF } from '@/lib/documents';
 *   generatePurchaseOrderPDF(poData);
 */

export { generatePurchaseOrderPDF } from './po-document';
export type { PODocumentData, POLineItem } from './po-document';

export { generateWorkOrderPDF } from './wo-document';
export type { WODocumentData, WOAllocation } from './wo-document';

export { generateInvoicePDF } from './invoice-document';
export type { InvoiceDocumentData, InvoiceLineItem } from './invoice-document';

export { generatePackingListPDF } from './packing-list-document';
export type { PackingListData, PackingLineItem } from './packing-list-document';
