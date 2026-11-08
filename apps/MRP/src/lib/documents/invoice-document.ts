/**
 * Invoice PDF Document Generator
 * Generates Sales Invoice and Purchase Invoice documents.
 * L-ERP MRP System
 */

import {
  createDocument,
  drawCompanyHeader,
  drawInfoSection,
  drawTotals,
  drawNotes,
  drawTerms,
  addPageFooters,
  autoTable,
  COLORS,
  fmtCurrency,
  fmtDate,
} from './pdf-base';

export interface InvoiceLineItem {
  lineNumber: number;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  lineAmount: number;
  taxAmount: number;
  totalAmount: number;
  part?: { partNumber: string; name: string } | null;
  product?: { sku: string; name: string } | null;
}

export interface InvoiceDocumentData {
  type: 'sales' | 'purchase';
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  currencyCode?: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue: number;
  paymentTerms?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  // Sales invoice fields
  customer?: {
    code: string;
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    billingAddress?: string | null;
  };
  salesOrder?: { orderNumber: string } | null;
  shipDate?: string | null;
  // Purchase invoice fields
  supplier?: {
    code: string;
    name: string;
    taxId?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
  };
  purchaseOrder?: { poNumber: string } | null;
  vendorInvoiceNo?: string | null;
  // Line items
  lines: InvoiceLineItem[];
}

export function generateInvoicePDF(data: InvoiceDocumentData): void {
  const doc = createDocument('portrait');
  const currency = data.currencyCode || 'USD';
  const isSales = data.type === 'sales';
  const title = isSales ? 'INVOICE' : 'PURCHASE INVOICE';

  // Header
  let y = drawCompanyHeader(doc, {
    documentNumber: data.invoiceNumber,
    documentDate: fmtDate(data.invoiceDate),
    title,
    status: data.status,
  });

  // Entity info
  if (isSales && data.customer) {
    y = drawInfoSection(
      doc,
      y,
      'Bill To',
      [
        ['Customer', data.customer.name],
        ['Code', data.customer.code],
        ['Contact', data.customer.contactName || '-'],
        ['Email', data.customer.contactEmail || '-'],
        ['Phone', data.customer.contactPhone || '-'],
        ['Address', data.customer.billingAddress || '-'],
      ],
      'Invoice Details',
      [
        ['Invoice #', data.invoiceNumber],
        ['Invoice Date', fmtDate(data.invoiceDate)],
        ['Due Date', fmtDate(data.dueDate)],
        ['Ship Date', fmtDate(data.shipDate)],
        ['SO Reference', data.salesOrder?.orderNumber || '-'],
        ['Payment Terms', data.paymentTerms || 'Net 30'],
      ]
    );
  } else if (!isSales && data.supplier) {
    y = drawInfoSection(
      doc,
      y,
      'Vendor',
      [
        ['Supplier', data.supplier.name],
        ['Code', data.supplier.code],
        ['Tax ID', data.supplier.taxId || '-'],
        ['Contact', data.supplier.contactName || '-'],
        ['Email', data.supplier.contactEmail || '-'],
        ['Address', data.supplier.address || '-'],
      ],
      'Invoice Details',
      [
        ['Invoice #', data.invoiceNumber],
        ['Vendor Inv #', data.vendorInvoiceNo || '-'],
        ['Invoice Date', fmtDate(data.invoiceDate)],
        ['Due Date', fmtDate(data.dueDate)],
        ['PO Reference', data.purchaseOrder?.poNumber || '-'],
        ['Payment Terms', data.paymentTerms || 'Net 30'],
      ]
    );
  }

  // Line items table
  const tableData = data.lines.map((line) => {
    const partRef = line.part?.partNumber || line.product?.sku || '';
    return [
      line.lineNumber,
      partRef,
      line.description,
      line.quantity,
      line.uom,
      fmtCurrency(line.unitPrice, currency),
      fmtCurrency(line.taxAmount, currency),
      fmtCurrency(line.totalAmount, currency),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Ref', 'Description', 'Qty', 'UOM', 'Unit Price', 'Tax', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'right' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
  });

  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  y += 6;

  // Totals
  const totalItems: [string, string][] = [
    ['Subtotal:', fmtCurrency(data.subtotal, currency)],
  ];

  if (data.discountAmount > 0) {
    totalItems.push(['Discount:', `-${fmtCurrency(data.discountAmount, currency)}`]);
  }
  if (data.taxAmount > 0) {
    totalItems.push(['Tax:', fmtCurrency(data.taxAmount, currency)]);
  }
  if (data.shippingAmount > 0) {
    totalItems.push(['Shipping:', fmtCurrency(data.shippingAmount, currency)]);
  }
  totalItems.push(['TOTAL:', fmtCurrency(data.totalAmount, currency)]);

  if (data.paidAmount && data.paidAmount > 0) {
    totalItems.push(['Paid:', fmtCurrency(data.paidAmount, currency)]);
    totalItems.push(['BALANCE DUE:', fmtCurrency(data.balanceDue, currency)]);
  }

  y = drawTotals(doc, y, totalItems);

  // Notes
  if (data.notes) {
    y = drawNotes(doc, y, data.notes);
  }

  // Terms
  if (data.termsAndConditions) {
    y = drawTerms(doc, y, data.termsAndConditions);
  }

  // Payment instructions for sales invoices
  if (isSales) {
    y += 4;
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Payment Instructions:', 14, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text('Please include invoice number on all payments.', 14, y);
    y += 3.5;
    doc.text('Bank: [Bank Name] | Account: [Account Number] | SWIFT: [SWIFT Code]', 14, y);
  }

  // Footers
  addPageFooters(doc, data.invoiceNumber);

  // Save
  const prefix = isSales ? 'INV' : 'PINV';
  doc.save(`${prefix}-${data.invoiceNumber}-${fmtDate(new Date())}.pdf`);
}
