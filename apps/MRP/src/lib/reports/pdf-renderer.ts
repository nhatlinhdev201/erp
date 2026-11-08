// src/lib/reports/pdf-renderer.ts
// Render report data to PDF using pdfkit

import PDFDocument from 'pdfkit';
import { ReportData } from './report-generator';

export async function renderToPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100; // margins

    // --- Header ---
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(data.template.nameVi, { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Ngay tao: ${data.generatedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
        { align: 'center' }
      );
    doc.moveDown(1);

    // --- Summary highlights ---
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('Tom tat:');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    for (const h of data.summary.highlights) {
      doc.text(`  - ${h.label}: ${h.value}`);
    }
    doc.text(`  - Tong dong: ${data.summary.totalRows}`);
    doc.moveDown(1);

    // --- Table ---
    const columns = data.template.columns.slice(0, 6); // max 6 cols for PDF
    const colWidth = pageWidth / columns.length;

    // Table header
    let x = 50;
    let y = doc.y;

    // Header background
    doc.rect(50, y - 2, pageWidth, 16).fill('#1e40af');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');

    for (const col of columns) {
      doc.text(col.labelVi, x + 2, y, { width: colWidth - 4, align: 'left' });
      x += colWidth;
    }

    doc.moveDown(0.8);

    // Table rows
    doc.font('Helvetica').fontSize(7).fillColor('#000000');

    const maxRows = Math.min(data.rows.length, 60);

    for (let i = 0; i < maxRows; i++) {
      const row = data.rows[i];
      x = 50;
      y = doc.y;

      // Check page break
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(50, y - 1, pageWidth, 12).fill('#f3f4f6');
        doc.fillColor('#000000');
      }

      for (const col of columns) {
        let value = row[col.key];

        // Format based on type
        if (col.type === 'currency' && typeof value === 'number') {
          value = `${value.toLocaleString('vi-VN')}`;
        } else if (col.type === 'percent' && typeof value === 'number') {
          value = `${(value as number).toFixed(1)}%`;
        } else if (col.type === 'date' && value) {
          value = new Date(value as string).toLocaleDateString('vi-VN');
        }

        doc.text(String(value ?? '-'), x + 2, y, {
          width: colWidth - 4,
          align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
        });
        x += colWidth;
      }
      doc.moveDown(0.3);
    }

    if (data.rows.length > maxRows) {
      doc.moveDown(1);
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          `... va ${data.rows.length - maxRows} dong khac. Xem file Excel de co day du du lieu.`,
          { align: 'center' }
        );
    }

    // --- Footer on each page ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .fillColor('#999999')
        .text(`L-ERP MRP | ${data.template.nameVi} | Trang ${i + 1}/${range.count}`, 50, doc.page.height - 30, {
          align: 'center',
          width: pageWidth,
        });
    }

    doc.end();
  });
}
