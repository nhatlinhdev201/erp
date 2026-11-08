/**
 * Base PDF Document Generator
 * Shared layout, company header, and footer for all document types.
 * L-ERP MRP System
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Re-export for convenience
export { jsPDF, autoTable };

// Company info
const COMPANY = {
  name: 'L-ERP, Inc.',
  address: 'Ho Chi Minh City, Vietnam',
  phone: '+84 (0) 28 1234 5678',
  email: 'info@your-domain.com',
  website: 'www.your-domain.com',
};

// Colors
export const COLORS = {
  primary: [30, 64, 175] as [number, number, number],       // blue-700
  primaryLight: [219, 234, 254] as [number, number, number], // blue-100
  dark: [31, 41, 55] as [number, number, number],            // gray-800
  muted: [107, 114, 128] as [number, number, number],        // gray-500
  border: [209, 213, 219] as [number, number, number],       // gray-300
  white: [255, 255, 255] as [number, number, number],
  bgLight: [249, 250, 251] as [number, number, number],      // gray-50
  success: [22, 163, 74] as [number, number, number],        // green-600
  warning: [217, 119, 6] as [number, number, number],        // amber-600
  danger: [220, 38, 38] as [number, number, number],         // red-600
};

export interface DocumentMeta {
  documentNumber: string;
  documentDate: string;
  title: string;
  status?: string;
}

/**
 * Create a new jsPDF instance with standard page setup
 */
export function createDocument(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  return new jsPDF({ orientation, unit: 'mm', format: 'a4' });
}

/**
 * Draw company header on the document
 * Returns the Y position after the header
 */
export function drawCompanyHeader(doc: jsPDF, meta: DocumentMeta): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Company name (left)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(COMPANY.name, 14, y);

  // Document title (right-aligned)
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(meta.title, pageWidth - 14, y, { align: 'right' });

  y += 5;

  // Company address
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(COMPANY.address, 14, y);

  // Document number (right)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`# ${meta.documentNumber}`, pageWidth - 14, y, { align: 'right' });

  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`, 14, y);

  // Date (right)
  doc.setFontSize(9);
  doc.text(`Date: ${meta.documentDate}`, pageWidth - 14, y, { align: 'right' });

  // Status badge if provided
  if (meta.status) {
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`Status: ${meta.status.toUpperCase()}`, pageWidth - 14, y, { align: 'right' });
  }

  // Separator line
  y += 4;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  return y + 6;
}

/**
 * Draw an info section with label-value pairs in two columns
 */
export function drawInfoSection(
  doc: jsPDF,
  y: number,
  leftTitle: string,
  leftFields: [string, string][],
  rightTitle: string,
  rightFields: [string, string][]
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const midX = pageWidth / 2;

  // Left section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(leftTitle, 14, y);

  let leftY = y + 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  for (const [label, value] of leftFields) {
    doc.setTextColor(...COLORS.muted);
    doc.text(`${label}:`, 14, leftY);
    doc.setTextColor(...COLORS.dark);
    doc.text(value || '-', 50, leftY);
    leftY += 4.5;
  }

  // Right section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(rightTitle, midX + 5, y);

  let rightY = y + 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  for (const [label, value] of rightFields) {
    doc.setTextColor(...COLORS.muted);
    doc.text(`${label}:`, midX + 5, rightY);
    doc.setTextColor(...COLORS.dark);
    doc.text(value || '-', midX + 40, rightY);
    rightY += 4.5;
  }

  return Math.max(leftY, rightY) + 4;
}

/**
 * Draw totals section (right-aligned table for subtotal, tax, total)
 */
export function drawTotals(
  doc: jsPDF,
  y: number,
  items: [string, string][],
  highlightLast = true
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - 14;
  const labelX = rightEdge - 70;
  const valueX = rightEdge;

  for (let i = 0; i < items.length; i++) {
    const [label, value] = items[i];
    const isLast = i === items.length - 1 && highlightLast;

    if (isLast) {
      // Draw highlight background
      doc.setFillColor(...COLORS.primaryLight);
      doc.rect(labelX - 3, y - 3.5, 73, 6, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
    }

    doc.text(label, labelX, y);
    doc.text(value, valueX, y, { align: 'right' });
    y += isLast ? 7 : 5;
  }

  return y + 2;
}

/**
 * Draw notes section
 */
export function drawNotes(doc: jsPDF, y: number, notes: string): number {
  if (!notes) return y;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Notes:', 14, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  const lines = doc.splitTextToSize(notes, doc.internal.pageSize.getWidth() - 28);
  doc.text(lines, 14, y);
  y += lines.length * 4 + 4;

  return y;
}

/**
 * Draw terms and conditions
 */
export function drawTerms(doc: jsPDF, y: number, terms: string): number {
  if (!terms) return y;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Terms & Conditions:', 14, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  const lines = doc.splitTextToSize(terms, doc.internal.pageSize.getWidth() - 28);
  doc.text(lines, 14, y);
  y += lines.length * 3.5 + 4;

  return y;
}

/**
 * Add page footers to all pages
 */
export function addPageFooters(doc: jsPDF, documentNumber: string): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Separator line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    // Left footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(`${COMPANY.name} | ${documentNumber}`, 14, pageHeight - 10);

    // Center footer
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Right footer
    doc.text(
      `Generated: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: 'right' }
    );
  }
}

/**
 * Format currency for PDF
 */
export function fmtCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '$0.00';
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for PDF
 */
export function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Save or return blob
 */
export function saveDocument(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function documentToBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}
