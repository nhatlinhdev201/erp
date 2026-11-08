// =============================================================================
// L-ERP MRP - EXPORT SERVICE
// Excel and PDF export functionality
// =============================================================================

import {
  dataService,
  type SalesOrder,
  type Part,
  type Inventory,
  type Supplier,
  type Customer,
  type WorkOrder,
  type QualityRecord,
} from '@/lib/data/data-service';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ExportEntity = 
  | 'sales-orders' 
  | 'parts' 
  | 'inventory' 
  | 'suppliers' 
  | 'customers' 
  | 'work-orders' 
  | 'quality-records'
  | 'mrp-results';

export interface ExportOptions {
  format: ExportFormat;
  entity: ExportEntity;
  filters?: Record<string, any>;
  columns?: string[];
  title?: string;
  includeHeaders?: boolean;
  dateRange?: { from: Date; to: Date };
}

export interface ExportResult {
  success: boolean;
  filename: string;
  data: string; // Base64 encoded
  mimeType: string;
  size: number;
}

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

const columnDefinitions: Record<ExportEntity, { key: string; label: string; width?: number }[]> = {
  'sales-orders': [
    { key: 'orderNumber', label: 'Mã đơn hàng', width: 15 },
    { key: 'customerName', label: 'Khách hàng', width: 25 },
    { key: 'orderDate', label: 'Ngày đặt', width: 12 },
    { key: 'requiredDate', label: 'Ngày yêu cầu', width: 12 },
    { key: 'status', label: 'Trạng thái', width: 15 },
    { key: 'priority', label: 'Độ ưu tiên', width: 12 },
    { key: 'totalAmount', label: 'Tổng tiền', width: 18 },
    { key: 'notes', label: 'Ghi chú', width: 30 },
  ],
  'parts': [
    { key: 'partNumber', label: 'Mã vật tư', width: 15 },
    { key: 'partName', label: 'Tên vật tư', width: 30 },
    { key: 'category', label: 'Phân loại', width: 15 },
    { key: 'unit', label: 'Đơn vị', width: 10 },
    { key: 'unitCost', label: 'Đơn giá', width: 15 },
    { key: 'leadTime', label: 'Lead Time (ngày)', width: 12 },
    { key: 'supplierName', label: 'Nhà cung cấp', width: 20 },
    { key: 'isActive', label: 'Trạng thái', width: 12 },
  ],
  'inventory': [
    { key: 'partNumber', label: 'Mã vật tư', width: 15 },
    { key: 'partName', label: 'Tên vật tư', width: 30 },
    { key: 'onHand', label: 'Tồn kho', width: 12 },
    { key: 'onOrder', label: 'Đang đặt', width: 12 },
    { key: 'allocated', label: 'Đã cấp phát', width: 12 },
    { key: 'available', label: 'Khả dụng', width: 12 },
    { key: 'safetyStock', label: 'Tồn an toàn', width: 12 },
    { key: 'reorderPoint', label: 'Điểm đặt hàng', width: 12 },
    { key: 'warehouseLocation', label: 'Vị trí', width: 15 },
    { key: 'status', label: 'Trạng thái', width: 15 },
  ],
  'suppliers': [
    { key: 'code', label: 'Mã NCC', width: 12 },
    { key: 'name', label: 'Tên nhà cung cấp', width: 25 },
    { key: 'contactPerson', label: 'Người liên hệ', width: 20 },
    { key: 'phone', label: 'Điện thoại', width: 15 },
    { key: 'email', label: 'Email', width: 25 },
    { key: 'city', label: 'Thành phố', width: 15 },
    { key: 'leadTime', label: 'Lead Time (ngày)', width: 12 },
    { key: 'rating', label: 'Đánh giá', width: 10 },
    { key: 'paymentTerms', label: 'Thanh toán', width: 15 },
  ],
  'customers': [
    { key: 'code', label: 'Mã KH', width: 12 },
    { key: 'name', label: 'Tên khách hàng', width: 25 },
    { key: 'contactPerson', label: 'Người liên hệ', width: 20 },
    { key: 'phone', label: 'Điện thoại', width: 15 },
    { key: 'email', label: 'Email', width: 25 },
    { key: 'city', label: 'Thành phố', width: 15 },
    { key: 'taxCode', label: 'Mã số thuế', width: 15 },
    { key: 'creditLimit', label: 'Hạn mức', width: 18 },
    { key: 'paymentTerms', label: 'Thanh toán', width: 15 },
  ],
  'work-orders': [
    { key: 'orderNumber', label: 'Mã lệnh SX', width: 15 },
    { key: 'productPartNumber', label: 'Mã sản phẩm', width: 15 },
    { key: 'quantity', label: 'SL kế hoạch', width: 12 },
    { key: 'completedQty', label: 'SL hoàn thành', width: 12 },
    { key: 'progress', label: 'Tiến độ %', width: 12 },
    { key: 'plannedStart', label: 'Ngày bắt đầu', width: 12 },
    { key: 'plannedEnd', label: 'Ngày kết thúc', width: 12 },
    { key: 'status', label: 'Trạng thái', width: 15 },
    { key: 'workstation', label: 'Trạm làm việc', width: 15 },
  ],
  'quality-records': [
    { key: 'recordNumber', label: 'Mã NCR', width: 15 },
    { key: 'type', label: 'Loại', width: 12 },
    { key: 'status', label: 'Trạng thái', width: 15 },
    { key: 'severity', label: 'Mức độ', width: 12 },
    { key: 'description', label: 'Mô tả', width: 40 },
    { key: 'rootCause', label: 'Nguyên nhân', width: 30 },
    { key: 'correctiveAction', label: 'Hành động khắc phục', width: 30 },
    { key: 'reportedDate', label: 'Ngày báo cáo', width: 12 },
    { key: 'reportedBy', label: 'Người báo cáo', width: 15 },
  ],
  'mrp-results': [
    { key: 'partNumber', label: 'Mã vật tư', width: 15 },
    { key: 'partName', label: 'Tên vật tư', width: 30 },
    { key: 'grossRequirement', label: 'Nhu cầu gộp', width: 12 },
    { key: 'onHand', label: 'Tồn kho', width: 12 },
    { key: 'onOrder', label: 'Đang đặt', width: 12 },
    { key: 'netRequirement', label: 'Nhu cầu ròng', width: 12 },
    { key: 'status', label: 'Trạng thái', width: 15 },
    { key: 'supplierName', label: 'Nhà cung cấp', width: 20 },
    { key: 'suggestedQty', label: 'SL đề xuất', width: 12 },
    { key: 'estimatedCost', label: 'Chi phí ước tính', width: 18 },
  ],
};

// =============================================================================
// STATUS TRANSLATIONS
// =============================================================================

const statusTranslations: Record<string, string> = {
  // Sales Order Status
  DRAFT: 'Nháp',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PRODUCTION: 'Đang sản xuất',
  READY_TO_SHIP: 'Sẵn sàng giao',
  SHIPPED: 'Đã giao',
  DELIVERED: 'Đã nhận',
  CANCELLED: 'Đã hủy',
  
  // Work Order Status
  PLANNED: 'Kế hoạch',
  RELEASED: 'Đã phát hành',
  IN_PROGRESS: 'Đang thực hiện',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  
  // Priority
  URGENT: 'Khẩn cấp',
  HIGH: 'Cao',
  NORMAL: 'Bình thường',
  LOW: 'Thấp',
  
  // Severity
  CRITICAL: 'Nghiêm trọng',
  MAJOR: 'Lớn',
  MINOR: 'Nhỏ',
  OBSERVATION: 'Quan sát',
  
  // Quality Status
  OPEN: 'Mở',
  PENDING_APPROVAL: 'Chờ duyệt',
  CLOSED: 'Đã đóng',
  
  // Part Category
  FINISHED_GOOD: 'Thành phẩm',
  SEMI_FINISHED: 'Bán thành phẩm',
  COMPONENT: 'Linh kiện',
  RAW_MATERIAL: 'Nguyên vật liệu',
  CONSUMABLE: 'Vật tư tiêu hao',
  PACKAGING: 'Bao bì',
  
  // Inventory Status
  STOCK_OK: 'Đủ hàng',
  STOCK_LOW: 'Sắp hết',
  STOCK_CRITICAL: 'Hết hàng',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
}

function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('vi-VN');
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatNumber(value: number | undefined): string {
  if (value === undefined) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
}

function translateStatus(status: string | undefined): string {
  if (!status) return '';
  return statusTranslations[status] || status;
}

function getInventoryStatus(available: number, safetyStock: number, reorderPoint: number): string {
  if (available <= safetyStock) return 'Thiếu nghiêm trọng';
  if (available <= reorderPoint) return 'Sắp hết';
  return 'Đủ hàng';
}

// =============================================================================
// DATA TRANSFORMERS
// =============================================================================

async function transformSalesOrders(): Promise<Record<string, any>[]> {
  const orders = await dataService.getSalesOrders();
  return orders.map(o => ({
    orderNumber: o.orderNumber,
    customerName: o.customer?.name || '',
    orderDate: formatDate(o.orderDate),
    requiredDate: formatDate(o.requiredDate),
    status: translateStatus(o.status),
    priority: translateStatus(o.priority),
    totalAmount: formatCurrency(o.totalAmount),
    notes: o.notes || '',
  }));
}

async function transformParts(): Promise<Record<string, any>[]> {
  const parts = await dataService.getParts();
  const suppliers = await dataService.getSuppliers();
  
  return parts.map(p => {
    const supplier = suppliers.find(s => s.id === p.supplierId);
    return {
      partNumber: p.partNumber,
      partName: p.partName,
      category: translateStatus(p.category),
      unit: p.unit,
      unitCost: formatCurrency(p.unitCost),
      leadTime: p.leadTime,
      supplierName: supplier?.name || '',
      isActive: p.isActive ? 'Đang dùng' : 'Ngừng',
    };
  });
}

async function transformInventory(): Promise<Record<string, any>[]> {
  const inventory = await dataService.getInventory();
  
  return inventory.map(inv => ({
    partNumber: inv.part?.partNumber || '',
    partName: inv.part?.partName || '',
    onHand: formatNumber(inv.onHand),
    onOrder: formatNumber(inv.onOrder),
    allocated: formatNumber(inv.allocated),
    available: formatNumber(inv.available),
    safetyStock: formatNumber(inv.safetyStock),
    reorderPoint: formatNumber(inv.reorderPoint),
    warehouseLocation: inv.warehouseLocation || '',
    status: getInventoryStatus(inv.available, inv.safetyStock, inv.reorderPoint),
  }));
}

async function transformSuppliers(): Promise<Record<string, any>[]> {
  const suppliers = await dataService.getSuppliers();
  
  return suppliers.map(s => ({
    code: s.code,
    name: s.name,
    contactPerson: s.contactPerson || '',
    phone: s.phone || '',
    email: s.email || '',
    city: s.city || '',
    leadTime: s.leadTime,
    rating: s.rating.toFixed(1),
    paymentTerms: s.paymentTerms || '',
  }));
}

async function transformCustomers(): Promise<Record<string, any>[]> {
  const customers = await dataService.getCustomers();
  
  return customers.map(c => ({
    code: c.code,
    name: c.name,
    contactPerson: c.contactPerson || '',
    phone: c.phone || '',
    email: c.email || '',
    city: c.city || '',
    taxCode: c.taxCode || '',
    creditLimit: c.creditLimit ? formatCurrency(c.creditLimit) : '',
    paymentTerms: c.paymentTerms || '',
  }));
}

async function transformWorkOrders(): Promise<Record<string, any>[]> {
  const workOrders = await dataService.getWorkOrders();
  const parts = await dataService.getParts();
  
  return workOrders.map(wo => {
    const part = parts.find(p => p.id === wo.productPartId);
    return {
      orderNumber: wo.orderNumber,
      productPartNumber: part?.partNumber || '',
      quantity: formatNumber(wo.quantity),
      completedQty: formatNumber(wo.completedQty),
      progress: `${wo.progress || 0}%`,
      plannedStart: formatDate(wo.plannedStart),
      plannedEnd: formatDate(wo.plannedEnd),
      status: translateStatus(wo.status),
      workstation: wo.workstation || '',
    };
  });
}

async function transformQualityRecords(): Promise<Record<string, any>[]> {
  const records = await dataService.getQualityRecords();
  
  return records.map(r => ({
    recordNumber: r.recordNumber,
    type: r.type,
    status: translateStatus(r.status),
    severity: translateStatus(r.severity),
    description: r.description,
    rootCause: r.rootCause || '',
    correctiveAction: r.correctiveAction || '',
    reportedDate: formatDate(r.reportedDate),
    reportedBy: r.reportedBy || '',
  }));
}

// =============================================================================
// CSV GENERATOR
// =============================================================================

function generateCSV(data: Record<string, any>[], columns: { key: string; label: string }[]): string {
  const headers = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.key] ?? '';
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  // Add BOM for Excel to recognize UTF-8
  return '\ufeff' + [headers, ...rows].join('\n');
}

// =============================================================================
// XLSX GENERATOR (using simple format without external libraries)
// =============================================================================

function generateXLSXData(data: Record<string, any>[], columns: { key: string; label: string; width?: number }[], title: string): string {
  // Generate XML-based XLSX (SpreadsheetML format that Excel can open)
  const headers = columns.map(c => c.label);
  const rows = data.map(row => columns.map(c => row[c.key] ?? ''));
  
  // Create worksheet XML
  const worksheetRows = [
    // Title row
    `<Row><Cell ss:StyleID="Title" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${title}</Data></Cell></Row>`,
    // Empty row
    `<Row></Row>`,
    // Header row
    `<Row>${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`,
    // Data rows
    ...rows.map(row => 
      `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${escapeXml(String(cell))}</Data></Cell>`).join('')}</Row>`
    )
  ].join('\n');
  
  const columnDefs = columns.map(c => 
    `<Column ss:Width="${(c.width || 15) * 7}"/>`
  ).join('\n');
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default">
      <Font ss:FontName="Arial" ss:Size="10"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Arial" ss:Size="14" ss:Bold="1"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Data">
    <Table>
      ${columnDefs}
      ${worksheetRows}
    </Table>
  </Worksheet>
</Workbook>`;
  
  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =============================================================================
// PDF GENERATOR (using HTML that can be converted to PDF)
// =============================================================================

function generatePDFData(data: Record<string, any>[], columns: { key: string; label: string }[], title: string): string {
  const headerCells = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('');
  const dataRows = data.map(row => 
    `<tr>${columns.map(c => `<td>${escapeHtml(String(row[c.key] ?? ''))}</td>`).join('')}</tr>`
  ).join('\n');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #333; margin-bottom: 20px; }
    .meta { text-align: center; color: #666; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #4F46E5; color: white; padding: 10px 8px; text-align: left; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    tr:hover { background: #f0f0f0; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    Ngày xuất: ${new Date().toLocaleString('vi-VN')}<br>
    Tổng số dòng: ${data.length}
  </div>
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${dataRows}
    </tbody>
  </table>
  <div class="footer">
    L-ERP MRP System - Báo cáo được tạo tự động
  </div>
</body>
</html>`;
  
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =============================================================================
// MAIN EXPORT SERVICE
// =============================================================================

export async function exportData(options: ExportOptions): Promise<ExportResult> {
  const { format, entity, title } = options;
  
  // Get column definitions
  const columns = columnDefinitions[entity] || [];
  
  // Transform data based on entity
  let data: Record<string, any>[];
  let exportTitle: string;
  
  switch (entity) {
    case 'sales-orders':
      data = await transformSalesOrders();
      exportTitle = title || 'Danh sách đơn hàng';
      break;
    case 'parts':
      data = await transformParts();
      exportTitle = title || 'Danh mục vật tư';
      break;
    case 'inventory':
      data = await transformInventory();
      exportTitle = title || 'Báo cáo tồn kho';
      break;
    case 'suppliers':
      data = await transformSuppliers();
      exportTitle = title || 'Danh sách nhà cung cấp';
      break;
    case 'customers':
      data = await transformCustomers();
      exportTitle = title || 'Danh sách khách hàng';
      break;
    case 'work-orders':
      data = await transformWorkOrders();
      exportTitle = title || 'Danh sách lệnh sản xuất';
      break;
    case 'quality-records':
      data = await transformQualityRecords();
      exportTitle = title || 'Báo cáo chất lượng';
      break;
    default:
      throw new Error(`Unknown entity: ${entity}`);
  }
  
  // Generate file based on format
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'csv':
      content = generateCSV(data, columns);
      mimeType = 'text/csv;charset=utf-8';
      extension = 'csv';
      break;
    case 'xlsx':
      content = generateXLSXData(data, columns, exportTitle);
      mimeType = 'application/vnd.ms-excel';
      extension = 'xls'; // Using .xls extension for SpreadsheetML
      break;
    case 'pdf':
      content = generatePDFData(data, columns, exportTitle);
      mimeType = 'text/html;charset=utf-8';
      extension = 'html'; // HTML that can be printed to PDF
      break;
    default:
      throw new Error(`Unknown format: ${format}`);
  }
  
  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `${entity}_${timestamp}.${extension}`;
  
  // Encode to base64
  const base64Data = Buffer.from(content, 'utf-8').toString('base64');
  
  return {
    success: true,
    filename,
    data: base64Data,
    mimeType,
    size: content.length,
  };
}

// =============================================================================
// QUICK EXPORT FUNCTIONS
// =============================================================================

export async function exportSalesOrders(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'sales-orders' });
}

export async function exportParts(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'parts' });
}

export async function exportInventory(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'inventory' });
}

export async function exportSuppliers(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'suppliers' });
}

export async function exportCustomers(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'customers' });
}

export async function exportWorkOrders(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'work-orders' });
}

export async function exportQualityRecords(format: ExportFormat = 'xlsx'): Promise<ExportResult> {
  return exportData({ format, entity: 'quality-records' });
}

// =============================================================================
// DASHBOARD EXPORT (PDF with Charts)
// =============================================================================

export interface DashboardExportOptions {
  dashboardId: string;
  title: string;
  description?: string;
  widgets: {
    id: string;
    title: string;
    type: string;
    imageData?: string; // Base64 encoded chart image
    tableData?: { columns: { key: string; label: string }[]; rows: Record<string, any>[] };
    kpiData?: { value: string; trend?: string; status?: string };
  }[];
  dateRange?: { from: string; to: string };
  generatedBy?: string;
}

export function generateDashboardPDF(options: DashboardExportOptions): string {
  const { title, description, widgets, dateRange, generatedBy } = options;

  // Generate HTML content with embedded chart images
  const widgetContent = widgets.map((widget, index) => {
    let content = '';

    if (widget.kpiData) {
      // KPI Widget
      const statusColor = widget.kpiData.status === 'critical' ? '#EF4444' :
                         widget.kpiData.status === 'warning' ? '#F59E0B' : '#10B981';
      content = `
        <div class="kpi-widget">
          <div class="kpi-value" style="color: ${statusColor}">${escapeHtml(widget.kpiData.value)}</div>
          ${widget.kpiData.trend ? `<div class="kpi-trend">${escapeHtml(widget.kpiData.trend)}</div>` : ''}
        </div>
      `;
    } else if (widget.imageData) {
      // Chart Widget with image
      content = `
        <div class="chart-image">
          <img src="${widget.imageData}" alt="${escapeHtml(widget.title)}" style="max-width: 100%; height: auto;" />
        </div>
      `;
    } else if (widget.tableData) {
      // Table Widget
      const headerCells = widget.tableData.columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('');
      const dataRows = widget.tableData.rows.slice(0, 10).map(row =>
        `<tr>${widget.tableData!.columns.map(c => `<td>${escapeHtml(String(row[c.key] ?? ''))}</td>`).join('')}</tr>`
      ).join('');
      content = `
        <table class="data-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${dataRows}</tbody>
        </table>
        ${widget.tableData.rows.length > 10 ? `<p class="more-rows">...và ${widget.tableData.rows.length - 10} dòng khác</p>` : ''}
      `;
    }

    return `
      <div class="widget" style="page-break-inside: avoid;">
        <h3 class="widget-title">${escapeHtml(widget.title)}</h3>
        ${content}
      </div>
    `;
  }).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .header .description {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    .header .meta {
      color: #999;
      font-size: 12px;
      margin-top: 10px;
    }
    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .widget {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
    }
    .widget-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .kpi-widget {
      text-align: center;
      padding: 20px;
    }
    .kpi-value {
      font-size: 32px;
      font-weight: bold;
    }
    .kpi-trend {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .chart-image {
      text-align: center;
    }
    .chart-image img {
      max-height: 200px;
      object-fit: contain;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .data-table th {
      background: #4F46E5;
      color: white;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
    }
    .data-table td {
      padding: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table tr:nth-child(even) {
      background: #f9fafb;
    }
    .more-rows {
      font-size: 11px;
      color: #666;
      text-align: center;
      margin-top: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #999;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
    <div class="meta">
      ${dateRange ? `Kỳ: ${escapeHtml(dateRange.from)} - ${escapeHtml(dateRange.to)} | ` : ''}
      Xuất lúc: ${new Date().toLocaleString('vi-VN')}
      ${generatedBy ? ` | Bởi: ${escapeHtml(generatedBy)}` : ''}
    </div>
  </div>

  <div class="widgets-grid">
    ${widgetContent}
  </div>

  <div class="footer">
    L-ERP MRP System - Báo cáo Dashboard được tạo tự động
  </div>
</body>
</html>`;

  return html;
}

export interface ChartExportOptions {
  title: string;
  chartElement: HTMLElement;
  format: 'png' | 'jpeg';
  quality?: number;
}

// Note: This function must be called from client-side code with access to DOM
export async function exportChartToImage(options: ChartExportOptions): Promise<string> {
  const { chartElement, format, quality = 1.0 } = options;

  // Dynamic import for client-side only
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher resolution
    logging: false,
    useCORS: true,
  });

  return canvas.toDataURL(`image/${format}`, quality);
}

// Email delivery placeholder (to be implemented with actual email service)
export interface EmailDeliveryOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments: {
    filename: string;
    content: string; // Base64
    contentType: string;
  }[];
}

/**
 * Deliver a report via email using SMTP.
 *
 * Required environment variables:
 *   SMTP_HOST     - SMTP server hostname (e.g. smtp.gmail.com)
 *   SMTP_PORT     - SMTP server port (e.g. 587)
 *   SMTP_USER     - SMTP authentication username
 *   SMTP_PASS     - SMTP authentication password
 *   SMTP_FROM     - Sender address (e.g. "L-ERP MRP <noreply@rtr.vn>")
 */
export async function deliverReportByEmail(options: EmailDeliveryOptions): Promise<{ success: boolean; error?: string }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    logger.warn('Email delivery skipped: SMTP environment variables not configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)', { context: 'export-service' });
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    // Dynamic require to avoid webpack static analysis bundling error
    // nodemailer must be installed separately: pnpm add nodemailer
    let nodemailer: typeof import('nodemailer');
    try {
      const moduleName = 'nodemailer';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodemailer = require(moduleName);
    } catch {
      return { success: false, error: 'nodemailer package not installed. Run: pnpm add nodemailer' };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: options.to.join(', '),
      cc: options.cc?.join(', '),
      bcc: options.bcc?.join(', '),
      subject: options.subject,
      html: options.body,
      attachments: options.attachments.map((att: { filename: string; content: string; contentType: string }) => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64' as const,
        contentType: att.contentType,
      })),
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Email delivery failed', { context: 'export-service', error: message });
    return { success: false, error: message };
  }
}

export default {
  exportData,
  exportSalesOrders,
  exportParts,
  exportInventory,
  exportSuppliers,
  exportCustomers,
  exportWorkOrders,
  exportQualityRecords,
  generateDashboardPDF,
  exportChartToImage,
  deliverReportByEmail,
};
