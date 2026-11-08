/**
 * Lazy Export Utilities
 * Dynamically imports heavy libraries (xlsx, jspdf) only when needed
 * Reduces initial bundle size significantly
 */

import { formatCurrency, Currency } from './currency';
import { formatDate } from './date';

// =============================================================================
// TYPES
// =============================================================================

export interface ExportColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: number;
  pdfWidth?: number;
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown, row: T) => string;
}

export interface ExportConfig {
  title: string;
  subtitle?: string;
  filename: string;
  sheetName?: string;
  currency?: Currency;
}

// =============================================================================
// LAZY EXCEL EXPORT
// =============================================================================

export async function lazyExportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  config: ExportConfig,
  infoRows?: string[][]
): Promise<void> {
  // Dynamically import xlsx only when needed
  const XLSX = await import('xlsx');

  // Prepare export data
  const exportData = data.map((row, index) => {
    const rowData: Record<string, any> = { '#': index + 1 };

    columns.forEach((col) => {
      const value = row[col.key];
      if (col.format) {
        rowData[col.header] = col.format(value, row);
      } else if (col.type === 'currency') {
        rowData[col.header] = formatCurrency(value, { currency: config.currency, showSymbol: false });
      } else if (col.type === 'date') {
        rowData[col.header] = formatDate(value);
      } else if (col.type === 'boolean') {
        rowData[col.header] = value ? 'Yes' : '';
      } else {
        rowData[col.header] = value ?? '';
      }
    });

    return rowData;
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Info sheet
  const infoData = [
    [config.title],
    [''],
    ...(config.subtitle ? [[config.subtitle], ['']] : []),
    ['Total Records', data.length.toString()],
    ['Generated', formatDate(new Date(), { format: 'shortTime' })],
    ...(infoRows || []),
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

  // Data sheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = [
    { wch: 4 }, // #
    ...columns.map((col) => ({ wch: col.width || 15 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, config.sheetName || 'Data');

  // Download
  const fileName = `${config.filename}-${formatDate(new Date(), { format: 'iso' })}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// =============================================================================
// LAZY PDF EXPORT
// =============================================================================

export async function lazyExportToPDF<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  config: ExportConfig
): Promise<void> {
  // Dynamically import jspdf and autoTable only when needed
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF('landscape');

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if (config.subtitle) {
    doc.text(config.subtitle, 14, 30);
  }
  doc.text(`Generated: ${formatDate(new Date(), { format: 'shortTime' })}`, 200, 20);
  doc.text(`Total: ${data.length} records`, 200, 27);

  // Prepare table data
  const tableData = data.map((row, index) => {
    const rowArray: (string | number)[] = [index + 1];

    columns.forEach((col) => {
      const value = row[col.key];
      if (col.format) {
        rowArray.push(col.format(value, row));
      } else if (col.type === 'currency') {
        rowArray.push(formatCurrency(value, { currency: config.currency }));
      } else if (col.type === 'date') {
        rowArray.push(formatDate(value));
      } else if (col.type === 'boolean') {
        rowArray.push(value ? 'Yes' : '');
      } else {
        rowArray.push(value ?? '-');
      }
    });

    return rowArray;
  });

  // Table headers
  const headers = ['#', ...columns.map((col) => col.header)];

  // Column styles for alignment
  const columnStyles: Record<number, { halign?: 'left' | 'center' | 'right'; cellWidth?: number }> = {
    0: { cellWidth: 8 }, // #
  };

  columns.forEach((col, index) => {
    columnStyles[index + 1] = {
      halign: col.align || (col.type === 'number' || col.type === 'currency' ? 'right' : 'left'),
      cellWidth: col.pdfWidth,
    };
  });

  // Generate table
  autoTable(doc, {
    startY: config.subtitle ? 40 : 35,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [45, 49, 57],
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles,
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('L-ERP MRP System', 14, doc.internal.pageSize.height - 10);

  // Download
  const fileName = `${config.filename}-${formatDate(new Date(), { format: 'iso' })}.pdf`;
  doc.save(fileName);
}
