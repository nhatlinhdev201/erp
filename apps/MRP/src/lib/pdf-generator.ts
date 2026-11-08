// lib/pdf-generator.ts

interface ReportColumn {
  header: string;
  dataKey: string;
  width?: number;
}

interface ReportConfig {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary?: { label: string; value: string }[];
  footer?: string;
}

export async function generatePdfReport(config: ReportConfig): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(config.title, pageWidth / 2, 20, { align: "center" });

  if (config.subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(config.subtitle, pageWidth / 2, 28, { align: "center" });
  }

  // Company info
  doc.setFontSize(10);
  doc.text("L-ERP, Inc.", 14, 15);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 20);

  // Summary section
  let yPos = 40;
  if (config.summary && config.summary.length > 0) {
    doc.setFillColor(245, 245, 245);
    doc.rect(14, yPos - 5, pageWidth - 28, config.summary.length * 8 + 10, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 18, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    config.summary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 18, yPos);
      yPos += 7;
    });
    yPos += 10;
  }

  // Data table
  autoTable(doc, {
    startY: yPos,
    head: [config.columns.map((c) => c.header)],
    body: config.data.map((row) =>
      config.columns.map((c) => String(row[c.dataKey] ?? ""))
    ),
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: config.columns.reduce(
      (acc, col, i) => {
        if (col.width) acc[i] = { cellWidth: col.width };
        return acc;
      },
      {} as Record<number, { cellWidth: number }>
    ),
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    if (config.footer) {
      doc.text(
        config.footer,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: "center" }
      );
    }
  }

  return doc.output("blob");
}

// Inventory Report Generator
export async function generateInventoryReport(
  data: Array<{
    partNumber: string;
    name: string;
    category: string;
    quantity: number;
    value: number;
    status: string;
  }>
): Promise<Blob> {
  const totalValue = data.reduce((s, d) => s + d.value, 0);
  const lowStockItems = data.filter((d) => d.status !== "OK").length;

  return generatePdfReport({
    title: "Inventory Report",
    subtitle: `As of ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Part #", dataKey: "partNumber", width: 30 },
      { header: "Name", dataKey: "name", width: 50 },
      { header: "Category", dataKey: "category", width: 30 },
      { header: "Qty", dataKey: "quantity", width: 20 },
      { header: "Value", dataKey: "value", width: 25 },
      { header: "Status", dataKey: "status", width: 25 },
    ],
    data,
    summary: [
      { label: "Total SKUs", value: data.length.toString() },
      { label: "Total Value", value: `$${totalValue.toLocaleString()}` },
      { label: "Low Stock Items", value: lowStockItems.toString() },
    ],
    footer: "Confidential - L-ERP, Inc.",
  });
}

// Orders Report Generator
export async function generateOrdersReport(
  data: Array<{
    orderNumber: string;
    customer: string;
    orderDate: string;
    requiredDate: string;
    status: string;
    total: number;
  }>
): Promise<Blob> {
  const totalValue = data.reduce((s, d) => s + d.total, 0);
  const pendingOrders = data.filter(
    (d) => d.status === "draft" || d.status === "confirmed"
  ).length;

  return generatePdfReport({
    title: "Sales Orders Report",
    subtitle: `Generated ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Order #", dataKey: "orderNumber", width: 30 },
      { header: "Customer", dataKey: "customer", width: 50 },
      { header: "Order Date", dataKey: "orderDate", width: 25 },
      { header: "Required", dataKey: "requiredDate", width: 25 },
      { header: "Status", dataKey: "status", width: 25 },
      { header: "Total", dataKey: "total", width: 25 },
    ],
    data,
    summary: [
      { label: "Total Orders", value: data.length.toString() },
      { label: "Total Value", value: `$${totalValue.toLocaleString()}` },
      { label: "Pending Orders", value: pendingOrders.toString() },
    ],
    footer: "Confidential - L-ERP, Inc.",
  });
}

// Supplier Performance Report Generator
export async function generateSupplierReport(
  data: Array<{
    code: string;
    name: string;
    country: string;
    leadTime: number;
    rating: number;
    onTimeDelivery: number;
    riskLevel: string;
  }>
): Promise<Blob> {
  const avgRating =
    data.reduce((s, d) => s + d.rating, 0) / data.length || 0;
  const avgLeadTime =
    data.reduce((s, d) => s + d.leadTime, 0) / data.length || 0;

  return generatePdfReport({
    title: "Supplier Performance Report",
    subtitle: `Generated ${new Date().toLocaleDateString()}`,
    columns: [
      { header: "Code", dataKey: "code", width: 25 },
      { header: "Name", dataKey: "name", width: 45 },
      { header: "Country", dataKey: "country", width: 25 },
      { header: "Lead Time", dataKey: "leadTime", width: 20 },
      { header: "Rating", dataKey: "rating", width: 20 },
      { header: "On-Time %", dataKey: "onTimeDelivery", width: 20 },
      { header: "Risk", dataKey: "riskLevel", width: 25 },
    ],
    data,
    summary: [
      { label: "Total Suppliers", value: data.length.toString() },
      { label: "Avg Rating", value: avgRating.toFixed(1) },
      { label: "Avg Lead Time", value: `${avgLeadTime.toFixed(0)} days` },
    ],
    footer: "Confidential - L-ERP, Inc.",
  });
}
