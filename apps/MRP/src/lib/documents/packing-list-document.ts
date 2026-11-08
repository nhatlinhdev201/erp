/**
 * Packing List PDF Document Generator
 * Generates a packing list for shipments based on Sales Orders.
 * L-ERP MRP System
 */

import {
  createDocument,
  drawCompanyHeader,
  drawInfoSection,
  drawNotes,
  addPageFooters,
  autoTable,
  COLORS,
  fmtDate,
} from './pdf-base';

export interface PackingLineItem {
  lineNumber: number;
  product?: { sku: string; name: string } | null;
  part?: { partNumber: string; name: string } | null;
  description?: string;
  quantity: number;
  unit?: string;
  weight?: number;
}

export interface PackingListData {
  orderNumber: string;
  orderDate: string;
  shipDate?: string | null;
  customer: {
    code: string;
    name: string;
    contactName?: string | null;
    contactPhone?: string | null;
    billingAddress?: string | null;
  };
  shipToAddress?: string | null;
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string | null;
  lines: PackingLineItem[];
}

export function generatePackingListPDF(data: PackingListData): void {
  const doc = createDocument('portrait');

  // Header
  let y = drawCompanyHeader(doc, {
    documentNumber: data.orderNumber,
    documentDate: fmtDate(data.shipDate || new Date()),
    title: 'PACKING LIST',
  });

  // Ship To & Order Info
  y = drawInfoSection(
    doc,
    y,
    'Ship To',
    [
      ['Customer', data.customer.name],
      ['Code', data.customer.code],
      ['Contact', data.customer.contactName || '-'],
      ['Phone', data.customer.contactPhone || '-'],
      ['Address', data.shipToAddress || data.customer.billingAddress || '-'],
    ],
    'Shipment Details',
    [
      ['Order #', data.orderNumber],
      ['Order Date', fmtDate(data.orderDate)],
      ['Ship Date', fmtDate(data.shipDate)],
      ['Method', data.shippingMethod || '-'],
      ['Tracking', data.trackingNumber || '-'],
    ]
  );

  // Items table
  const tableData = data.lines.map((line) => {
    const ref = line.product?.sku || line.part?.partNumber || '-';
    const desc = line.description || line.product?.name || line.part?.name || '-';
    return [
      line.lineNumber,
      ref,
      desc,
      line.unit || 'pcs',
      line.quantity,
      line.weight ? `${line.weight.toFixed(2)} kg` : '-',
      '', // Checked column
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Part/SKU', 'Description', 'Unit', 'Qty', 'Weight', 'Checked']],
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
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
    didDrawCell: (hookData) => {
      // Draw checkbox in "Checked" column body cells
      if (hookData.column.index === 6 && hookData.section === 'body') {
        const cell = hookData.cell;
        const size = 3.5;
        const x = cell.x + cell.width / 2 - size / 2;
        const boxY = cell.y + cell.height / 2 - size / 2;
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.rect(x, boxY, size, size);
      }
    },
  });

  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  y += 6;

  // Summary
  const totalItems = data.lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalWeight = data.lines.reduce((sum, l) => sum + (l.weight || 0), 0);
  const totalLines = data.lines.length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Total: ${totalLines} line items | ${totalItems} units`, 14, y);
  if (totalWeight > 0) {
    doc.text(`Total Weight: ${totalWeight.toFixed(2)} kg`, 14, y + 5);
    y += 5;
  }
  y += 8;

  // Notes
  if (data.notes) {
    y = drawNotes(doc, y, data.notes);
  }

  // Sign-off
  const pageWidth = doc.internal.pageSize.getWidth();
  y += 6;
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(...COLORS.border);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  // Packed by
  doc.line(14, y + 8, 80, y + 8);
  doc.text('Packed By', 14, y + 12);
  doc.text('Date: ____________________', 14, y + 17);

  // Received by
  doc.line(pageWidth - 80, y + 8, pageWidth - 14, y + 8);
  doc.text('Received By', pageWidth - 80, y + 12);
  doc.text('Date: ____________________', pageWidth - 80, y + 17);

  // Footers
  addPageFooters(doc, `PL-${data.orderNumber}`);

  // Save
  doc.save(`PackingList-${data.orderNumber}-${fmtDate(new Date())}.pdf`);
}
