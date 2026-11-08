/**
 * Purchase Order PDF Document Generator
 * Generates a formal PO document with supplier info, line items, and totals.
 * L-ERP MRP System
 */

import {
  createDocument,
  drawCompanyHeader,
  drawInfoSection,
  drawTotals,
  drawNotes,
  addPageFooters,
  autoTable,
  COLORS,
  fmtCurrency,
  fmtDate,
} from './pdf-base';

export interface POLineItem {
  lineNumber: number;
  part: {
    partNumber: string;
    name: string;
    unit: string;
  };
  quantity: number;
  unitPrice: number;
  receivedQty: number;
}

export interface PODocumentData {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDate: string;
  currency?: string;
  notes?: string | null;
  supplier: {
    name: string;
    code?: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    taxId?: string | null;
  };
  lines: POLineItem[];
}

export function generatePurchaseOrderPDF(data: PODocumentData): void {
  const doc = createDocument('portrait');
  const currency = data.currency || 'USD';

  // Header
  let y = drawCompanyHeader(doc, {
    documentNumber: data.poNumber,
    documentDate: fmtDate(data.orderDate),
    title: 'PURCHASE ORDER',
    status: data.status,
  });

  // Supplier & Order Info
  y = drawInfoSection(
    doc,
    y,
    'Supplier',
    [
      ['Name', data.supplier.name],
      ['Code', data.supplier.code || '-'],
      ['Tax ID', data.supplier.taxId || '-'],
      ['Contact', data.supplier.contactName || '-'],
      ['Email', data.supplier.contactEmail || '-'],
      ['Phone', data.supplier.contactPhone || '-'],
    ],
    'Order Details',
    [
      ['PO Number', data.poNumber],
      ['Order Date', fmtDate(data.orderDate)],
      ['Expected', fmtDate(data.expectedDate)],
      ['Currency', currency],
      ['Status', data.status.toUpperCase().replace('_', ' ')],
    ]
  );

  // Line items table
  const tableData = data.lines.map((line) => [
    line.lineNumber,
    line.part.partNumber,
    line.part.name,
    line.part.unit,
    line.quantity,
    line.receivedQty,
    fmtCurrency(line.unitPrice, currency),
    fmtCurrency(line.quantity * line.unitPrice, currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Part No.', 'Description', 'Unit', 'Qty', 'Received', 'Unit Price', 'Total']],
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
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
    didDrawPage: () => {
      // Re-draw header on new pages if table spans
    },
  });

  // Get Y after table
  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  y += 6;

  // Totals
  const subtotal = data.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  y = drawTotals(doc, y, [
    ['Subtotal:', fmtCurrency(subtotal, currency)],
    ['Tax (0%):', fmtCurrency(0, currency)],
    ['TOTAL:', fmtCurrency(subtotal, currency)],
  ]);

  // Notes
  if (data.notes) {
    y = drawNotes(doc, y, data.notes);
  }

  // Signature lines
  const pageWidth = doc.internal.pageSize.getWidth();
  y += 10;
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  // Authorized by
  doc.setDrawColor(...COLORS.border);
  doc.line(14, y + 8, 80, y + 8);
  doc.text('Authorized Signature', 14, y + 12);
  doc.text('Date: ____________________', 14, y + 17);

  // Supplier acknowledgment
  doc.line(pageWidth - 80, y + 8, pageWidth - 14, y + 8);
  doc.text('Supplier Acknowledgment', pageWidth - 80, y + 12);
  doc.text('Date: ____________________', pageWidth - 80, y + 17);

  // Footers
  addPageFooters(doc, data.poNumber);

  // Save
  doc.save(`PO-${data.poNumber}-${fmtDate(new Date())}.pdf`);
}
