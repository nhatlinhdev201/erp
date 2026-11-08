/**
 * Work Order PDF Document Generator
 * Generates a WO traveler/document with product info, schedule, and material checklist.
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

export interface WOAllocation {
  part: {
    partNumber: string;
    name: string;
  };
  requiredQty: number;
  allocatedQty: number;
  issuedQty: number;
  status: string;
}

export interface WODocumentData {
  id: string;
  woNumber: string;
  status: string;
  quantity: number;
  completedQty: number;
  scrapQty: number;
  priority: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  notes?: string | null;
  product: {
    sku: string;
    name: string;
  };
  salesOrder?: {
    orderNumber: string;
    requiredDate: string;
    customer: {
      name: string;
    };
  } | null;
  allocations: WOAllocation[];
}

export function generateWorkOrderPDF(data: WODocumentData): void {
  const doc = createDocument('portrait');

  // Header
  let y = drawCompanyHeader(doc, {
    documentNumber: data.woNumber,
    documentDate: fmtDate(new Date()),
    title: 'WORK ORDER',
    status: data.status,
  });

  // Product & Order Info
  const rightFields: [string, string][] = [
    ['WO Number', data.woNumber],
    ['Priority', data.priority.toUpperCase()],
    ['Status', data.status.toUpperCase().replace('_', ' ')],
    ['Quantity', `${data.quantity} units`],
    ['Completed', `${data.completedQty} units`],
    ['Scrap', `${data.scrapQty} units`],
  ];

  const leftFields: [string, string][] = [
    ['Product', data.product.name],
    ['SKU', data.product.sku],
    ['Planned Start', fmtDate(data.plannedStart)],
    ['Planned End', fmtDate(data.plannedEnd)],
    ['Actual Start', fmtDate(data.actualStart)],
    ['Actual End', fmtDate(data.actualEnd)],
  ];

  y = drawInfoSection(doc, y, 'Product & Schedule', leftFields, 'Work Order Details', rightFields);

  // Sales Order info if linked
  if (data.salesOrder) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Linked Sales Order', 14, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `SO# ${data.salesOrder.orderNumber} | Customer: ${data.salesOrder.customer.name} | Required: ${fmtDate(data.salesOrder.requiredDate)}`,
      14,
      y
    );
    y += 8;
  }

  // Progress bar
  const progressPercent = data.quantity > 0 ? Math.round((data.completedQty / data.quantity) * 100) : 0;
  const pageWidth = doc.internal.pageSize.getWidth();
  const barWidth = pageWidth - 28;
  const barHeight = 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Production Progress: ${progressPercent}%`, 14, y);
  y += 4;

  // Background
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(14, y, barWidth, barHeight, 1.5, 1.5, 'F');

  // Progress fill
  if (progressPercent > 0) {
    const fillColor = progressPercent === 100 ? COLORS.success : COLORS.primary;
    doc.setFillColor(...fillColor);
    doc.roundedRect(14, y, (barWidth * progressPercent) / 100, barHeight, 1.5, 1.5, 'F');
  }

  y += barHeight + 8;

  // Material Checklist
  if (data.allocations.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Material Checklist', 14, y);
    y += 2;

    const materialData = data.allocations.map((a) => [
      a.part.partNumber,
      a.part.name,
      a.requiredQty,
      a.allocatedQty,
      a.issuedQty,
      a.allocatedQty >= a.requiredQty ? 'READY' : 'PARTIAL',
      '', // Checkbox column for shop floor
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Part No.', 'Description', 'Required', 'Allocated', 'Issued', 'Status', 'Checked']],
      body: materialData,
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
        0: { cellWidth: 28 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: COLORS.bgLight,
      },
      didDrawCell: (hookData) => {
        // Draw checkbox in "Checked" column body cells
        if (hookData.column.index === 6 && hookData.section === 'body') {
          const cell = hookData.cell;
          const size = 3;
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
  }

  // Notes
  if (data.notes) {
    y = drawNotes(doc, y, data.notes);
  }

  // Shop floor sign-off section
  y += 4;
  if (y > doc.internal.pageSize.getHeight() - 50) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Sign-Off', 14, y);
  y += 6;

  doc.setDrawColor(...COLORS.border);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  const signoffs = [
    ['Released By', 'Quality Check'],
    ['Production Lead', 'Completed By'],
  ];

  for (const row of signoffs) {
    for (let i = 0; i < row.length; i++) {
      const x = 14 + i * (pageWidth / 2 - 12);
      doc.line(x, y + 8, x + 66, y + 8);
      doc.text(row[i], x, y + 12);
      doc.text('Date: ____________', x, y + 17);
    }
    y += 22;
  }

  // Footers
  addPageFooters(doc, data.woNumber);

  // Save
  doc.save(`WO-${data.woNumber}-${fmtDate(new Date())}.pdf`);
}
