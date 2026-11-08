'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/date';

// Note: xlsx and jspdf are now dynamically imported to reduce bundle size

interface BOMLine {
  lineNumber: number;
  partNumber: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  isCritical?: boolean;
  moduleCode?: string;
  moduleName?: string;
  referenceDesignator?: string;
  notes?: string;
}

interface BOMExportButtonProps {
  productSku: string;
  productName: string;
  bomVersion?: string;
  lines: BOMLine[];
}

export function BOMExportButton({ productSku, productName, bomVersion, lines }: BOMExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Dynamically import xlsx only when needed
      const XLSX = await import('xlsx');

      // Prepare data
      const exportData = lines.map((item, index) => ({
        '#': index + 1,
        'Line': item.lineNumber,
        'Part Number': item.partNumber,
        'Part Name': item.name,
        'Qty': item.quantity,
        'Unit': item.unit,
        'Unit Cost ($)': item.unitCost || 0,
        'Extended ($)': (item.quantity || 0) * (item.unitCost || 0),
        'Module': item.moduleCode || '',
        'Reference': item.referenceDesignator || '',
        'Critical': item.isCritical ? 'Yes' : '',
        'Notes': item.notes || '',
      }));

      // Add total row
      const totalCost = lines.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
      exportData.push({
        '#': '',
        'Line': '',
        'Part Number': '',
        'Part Name': 'TOTAL',
        'Qty': '',
        'Unit': '',
        'Unit Cost ($)': '',
        'Extended ($)': totalCost,
        'Module': '',
        'Reference': '',
        'Critical': '',
        'Notes': '',
      } as unknown as typeof exportData[number]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // BOM Info sheet
      const infoData = [
        ['Bill of Materials'],
        [''],
        ['Product SKU', productSku],
        ['Product Name', productName],
        ['BOM Version', bomVersion || 'N/A'],
        ['Total Lines', lines.length.toString()],
        ['Total Cost', formatCurrency(totalCost)],
        ['Generated', formatDate(new Date(), { format: 'shortTime' })],
      ];
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

      // BOM Lines sheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 4 },   // #
        { wch: 6 },   // Line
        { wch: 15 },  // Part Number
        { wch: 35 },  // Part Name
        { wch: 8 },   // Qty
        { wch: 6 },   // Unit
        { wch: 12 },  // Unit Cost
        { wch: 12 },  // Extended
        { wch: 10 },  // Module
        { wch: 12 },  // Reference
        { wch: 8 },   // Critical
        { wch: 25 },  // Notes
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'BOM Lines');

      // Download
      const fileName = `BOM-${productSku}-${bomVersion || 'v1'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
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
      doc.text('Bill of Materials', 14, 20);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Product: ${productName}`, 14, 30);
      doc.text(`SKU: ${productSku}`, 14, 37);
      doc.text(`Version: ${bomVersion || 'N/A'}`, 14, 44);
      doc.text(`Generated: ${formatDate(new Date(), { format: 'shortTime' })}`, 200, 30);

      // Table data
      const tableData = lines.map((item, index) => [
        index + 1,
        item.lineNumber,
        item.partNumber,
        item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name,
        item.quantity,
        item.unit,
        formatCurrency(item.unitCost || 0),
        formatCurrency((item.quantity || 0) * (item.unitCost || 0)),
        item.isCritical ? 'Yes' : '',
      ]);

      // Table
      autoTable(doc, {
        startY: 52,
        head: [['#', 'Line', 'Part Number', 'Part Name', 'Qty', 'Unit', 'Unit Cost', 'Extended', 'Critical']],
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
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 12 },
          2: { cellWidth: 30 },
          3: { cellWidth: 70 },
          4: { cellWidth: 15, halign: 'right' },
          5: { cellWidth: 15 },
          6: { cellWidth: 25, halign: 'right' },
          7: { cellWidth: 25, halign: 'right' },
          8: { cellWidth: 18 },
        },
      });

      // Total
      const totalCost = lines.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total BOM Cost: ${formatCurrency(totalCost)}`, 14, finalY + 12);
      doc.text(`Total Components: ${lines.length}`, 14, finalY + 20);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('L-ERP MRP System', 14, doc.internal.pageSize.height - 10);

      // Download
      const fileName = `BOM-${productSku}-${bomVersion || 'v1'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export to PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
