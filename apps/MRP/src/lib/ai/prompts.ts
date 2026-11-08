// =============================================================================
// AI CONTEXT & PROMPT TEMPLATES
// System prompts and context management for L-ERP MRP AI Assistant
// =============================================================================

import { AIMessage, createSystemMessage, createUserMessage } from './provider';

// =============================================================================
// INTERNAL TYPES FOR DATA FORMATTING
// =============================================================================

/** Inventory alert item in data context */
interface InventoryAlertItem {
  partNumber: string;
  partName: string;
  onHand: number;
  minStock: number;
}

/** Inventory item in data context */
interface InventoryItem {
  partNumber: string;
  partName: string;
  onHand: number;
  unit: string;
  status: string;
}

/** Order item in data context */
interface OrderDataItem {
  orderNumber: string;
  customer: string;
  value: number;
  requiredDate?: string;
  status?: string;
}

/** Work order item in data context */
interface WorkOrderItem {
  orderNumber: string;
  product: string;
  status: string;
  progress: number;
}

/** Production issue in data context */
interface ProductionIssue {
  type: string;
  description: string;
}

/** MRP shortage item */
interface MRPShortageItem {
  partNumber: string;
  partName: string;
  shortage: number;
  safetyStock: number;
  unit: string;
}

/** MRP purchase suggestion */
interface MRPSuggestionItem {
  partNumber: string;
  quantity: number;
  unit: string;
  supplier: string;
  totalCost: number;
}

/** Purchase data by-supplier info */
interface PurchaseBySupplierInfo {
  items: number;
  total: number;
}

/** Purchase suggestion item */
interface PurchaseSuggestionItem {
  partNumber: string;
  quantity: number;
  unit: string;
  supplier: string;
  totalCost: number;
  priority: string;
}

/** NCR item in quality data */
interface QualityNCRItem {
  ncrNumber: string;
  description: string;
  status: string;
}

/** Analytics trend data point */
interface TrendDataPoint {
  period: string;
  value: number;
}

// =============================================================================
// SYSTEM CONTEXT
// =============================================================================

export const MRP_SYSTEM_CONTEXT = `Bạn là Trợ lý AI thông minh của hệ thống L-ERP MRP (Manufacturing Resource Planning).

## VAI TRÒ CỦA BẠN:
- Hỗ trợ người dùng truy vấn và phân tích dữ liệu sản xuất, kho hàng, đơn hàng
- Cung cấp insights và đề xuất dựa trên dữ liệu
- Trả lời câu hỏi bằng tiếng Việt một cách thân thiện và chuyên nghiệp
- Giải thích các khái niệm MRP/ERP khi được hỏi

## NĂNG LỰC:
- Phân tích tồn kho và cảnh báo thiếu hụt
- Tổng hợp đơn hàng và tình trạng sản xuất
- Tính toán nhu cầu vật tư (MRP)
- Đề xuất mua hàng và tối ưu tồn kho
- Báo cáo chất lượng và NCR

## QUY TẮC:
1. Luôn trả lời bằng tiếng Việt
2. Sử dụng emoji phù hợp để tăng tính trực quan
3. Định dạng số tiền theo VND (ví dụ: 1.500.000 VND)
4. Khi không có dữ liệu, nói rõ và đề xuất cách lấy dữ liệu
5. Tóm tắt ngắn gọn trước, chi tiết sau nếu được yêu cầu
6. Sử dụng bullet points cho danh sách
7. Highlight các items quan trọng (critical/warning)

## ĐỊNH DẠNG TRẢ LỜI:
- Sử dụng **bold** cho tiêu đề và từ khóa quan trọng
- Sử dụng emoji màu sắc: 🔴 (critical), 🟡 (warning), 🟢 (ok), 🔵 (info)
- Kết thúc bằng 💡 đề xuất hành động nếu cần`;

// =============================================================================
// INTENT DETECTION
// =============================================================================

export type QueryIntent = 
  | 'inventory_status'      // Hỏi về tồn kho
  | 'inventory_shortage'    // Vật tư thiếu
  | 'order_status'          // Tình trạng đơn hàng
  | 'order_summary'         // Tổng hợp đơn hàng
  | 'production_status'     // Tình trạng sản xuất
  | 'mrp_calculation'       // Tính toán MRP
  | 'purchase_suggestion'   // Đề xuất mua hàng
  | 'quality_report'        // Báo cáo chất lượng
  | 'supplier_info'         // Thông tin nhà cung cấp
  | 'analytics'             // Phân tích, xu hướng
  | 'help'                  // Trợ giúp
  | 'general';              // Câu hỏi chung

export interface DetectedIntent {
  intent: QueryIntent;
  confidence: number;
  entities: {
    partNumbers?: string[];
    orderNumbers?: string[];
    suppliers?: string[];
    dateRange?: { from?: string; to?: string };
    quantity?: number;
    status?: string[];
  };
}

// Keyword patterns for intent detection
const intentPatterns: Record<QueryIntent, RegExp[]> = {
  inventory_status: [
    /tồn kho/i,
    /còn bao nhiêu/i,
    /số lượng.*kho/i,
    /inventory/i,
    /stock/i,
  ],
  inventory_shortage: [
    /thiếu/i,
    /hết hàng/i,
    /sắp hết/i,
    /shortage/i,
    /cần đặt/i,
    /low stock/i,
    /critical/i,
  ],
  order_status: [
    /đơn hàng.*số/i,
    /SO-\d+/i,
    /tình trạng.*đơn/i,
    /order.*status/i,
    /đơn.*đang/i,
  ],
  order_summary: [
    /tổng.*đơn hàng/i,
    /bao nhiêu đơn/i,
    /đơn hàng.*tuần/i,
    /đơn hàng.*tháng/i,
    /doanh thu/i,
    /revenue/i,
  ],
  production_status: [
    /sản xuất/i,
    /tiến độ/i,
    /work order/i,
    /WO-\d+/i,
    /lệnh sản xuất/i,
    /production/i,
  ],
  mrp_calculation: [
    /mrp/i,
    /nhu cầu vật tư/i,
    /tính toán/i,
    /planning/i,
    /hoạch định/i,
  ],
  purchase_suggestion: [
    /đề xuất.*mua/i,
    /cần mua/i,
    /purchase/i,
    /đặt hàng/i,
    /tạo PO/i,
    /nhà cung cấp/i,
  ],
  quality_report: [
    /chất lượng/i,
    /quality/i,
    /NCR/i,
    /lỗi/i,
    /defect/i,
    /kiểm tra/i,
    /inspection/i,
  ],
  supplier_info: [
    /nhà cung cấp/i,
    /supplier/i,
    /vendor/i,
    /lead time/i,
  ],
  analytics: [
    /phân tích/i,
    /xu hướng/i,
    /trend/i,
    /so sánh/i,
    /báo cáo/i,
    /report/i,
    /thống kê/i,
  ],
  help: [
    /giúp/i,
    /help/i,
    /hướng dẫn/i,
    /làm sao/i,
    /cách.*sử dụng/i,
    /có thể làm gì/i,
  ],
  general: [],
};

export function detectIntent(query: string): DetectedIntent {
  let bestIntent: QueryIntent = 'general';
  let bestScore = 0;

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as QueryIntent;
    }
  }

  // Extract entities
  const entities: DetectedIntent['entities'] = {};

  // Part numbers (e.g., CMP-BRG-002)
  const partMatches = query.match(/[A-Z]{2,4}-[A-Z]{2,4}-\d{3}/g);
  if (partMatches) entities.partNumbers = partMatches;

  // Order numbers (e.g., SO-2025-001)
  const orderMatches = query.match(/SO-\d{4}-\d{3}/g);
  if (orderMatches) entities.orderNumbers = orderMatches;

  // Work order numbers
  const woMatches = query.match(/WO-\d{4}-\d{3}/g);
  if (woMatches) entities.orderNumbers = [...(entities.orderNumbers || []), ...woMatches];

  return {
    intent: bestIntent,
    confidence: bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.5,
    entities,
  };
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

export interface PromptContext {
  intent: QueryIntent;
  query: string;
  data?: Record<string, unknown>;
  context?: string; // Legacy context from old AI Copilot
  ragContext?: string; // RAG knowledge context
  language?: 'vi' | 'en';
}

export function buildPrompt(context: PromptContext): AIMessage[] {
  const messages: AIMessage[] = [
    createSystemMessage(MRP_SYSTEM_CONTEXT),
  ];

  // Add RAG knowledge context if available
  if (context.ragContext) {
    messages.push(createSystemMessage(context.ragContext));
  }

  // Add legacy context if provided (from old AI Copilot)
  if (context.context) {
    messages.push(createSystemMessage(`## CONTEXT:\n${context.context}`));
  }

  // Add context based on intent
  if (context.data) {
    const dataContext = buildDataContext(context.intent, context.data);
    if (dataContext) {
      messages.push(createSystemMessage(`## DỮ LIỆU HIỆN TẠI:\n${dataContext}`));
    }
  }

  // Add user query
  messages.push(createUserMessage(context.query));

  return messages;
}

function buildDataContext(intent: QueryIntent, data: Record<string, unknown>): string {
  switch (intent) {
    case 'inventory_status':
    case 'inventory_shortage':
      return formatInventoryData(data);
    
    case 'order_status':
    case 'order_summary':
      return formatOrderData(data);
    
    case 'production_status':
      return formatProductionData(data);
    
    case 'mrp_calculation':
      return formatMRPData(data);
    
    case 'purchase_suggestion':
      return formatPurchaseData(data);
    
    case 'quality_report':
      return formatQualityData(data);
    
    case 'analytics':
      return formatAnalyticsData(data);
    
    default:
      return JSON.stringify(data, null, 2);
  }
}

// =============================================================================
// DATA FORMATTERS
// =============================================================================

function formatInventoryData(data: Record<string, unknown>): string {
  const summary = data.summary as Record<string, number> | undefined;
  const items = data.items as InventoryItem[] | undefined;
  const alerts = data.alerts as InventoryAlertItem[] | undefined;

  let context = '### Tổng quan tồn kho:\n';

  if (summary) {
    context += `- Tổng vật tư: ${summary.totalItems || 0}\n`;
    context += `- Đủ hàng: ${summary.okCount || 0}\n`;
    context += `- Sắp hết: ${summary.lowCount || 0}\n`;
    context += `- Hết hàng: ${summary.outCount || 0}\n`;
    context += `- Giá trị tồn kho: ${formatCurrency(summary.totalValue || 0)}\n`;
  }

  if (alerts && alerts.length > 0) {
    context += '\n### Cảnh báo:\n';
    alerts.slice(0, 10).forEach((alert) => {
      context += `- ${alert.partNumber}: ${alert.partName} - Tồn: ${alert.onHand}, Min: ${alert.minStock}\n`;
    });
  }

  if (items && items.length > 0) {
    context += '\n### Chi tiết vật tư:\n';
    items.slice(0, 20).forEach((item) => {
      context += `- ${item.partNumber}: ${item.partName} | Tồn: ${item.onHand} ${item.unit} | Trạng thái: ${item.status}\n`;
    });
  }

  return context;
}

function formatOrderData(data: Record<string, unknown>): string {
  const summary = data.summary as Record<string, number> | undefined;
  const orders = data.orders as OrderDataItem[] | undefined;
  const pending = data.pending as OrderDataItem[] | undefined;

  let context = '### Tổng quan đơn hàng:\n';

  if (summary) {
    context += `- Tổng đơn: ${summary.totalOrders || 0}\n`;
    context += `- Chờ xác nhận: ${summary.pendingCount || 0}\n`;
    context += `- Đang xử lý: ${summary.processingCount || 0}\n`;
    context += `- Hoàn thành: ${summary.completedCount || 0}\n`;
    context += `- Doanh thu tháng: ${formatCurrency(summary.monthlyRevenue || 0)}\n`;
  }

  if (pending && pending.length > 0) {
    context += '\n### Đơn hàng chờ xử lý:\n';
    pending.forEach((order) => {
      context += `- ${order.orderNumber}: ${order.customer} | ${formatCurrency(order.value)} | Giao: ${order.requiredDate}\n`;
    });
  }

  if (orders && orders.length > 0) {
    context += '\n### Danh sách đơn hàng:\n';
    orders.slice(0, 10).forEach((order) => {
      context += `- ${order.orderNumber}: ${order.customer} | ${order.status} | ${formatCurrency(order.value)}\n`;
    });
  }

  return context;
}

function formatProductionData(data: Record<string, unknown>): string {
  const summary = data.summary as Record<string, number> | undefined;
  const workOrders = data.workOrders as WorkOrderItem[] | undefined;
  const issues = data.issues as ProductionIssue[] | undefined;

  let context = '### Tổng quan sản xuất:\n';

  if (summary) {
    context += `- Hiệu suất: ${summary.efficiency || 0}%\n`;
    context += `- Đang chạy: ${summary.runningCount || 0} lệnh\n`;
    context += `- Chờ vật tư: ${summary.waitingCount || 0} lệnh\n`;
    context += `- Hoàn thành hôm nay: ${summary.completedToday || 0} lệnh\n`;
  }

  if (workOrders && workOrders.length > 0) {
    context += '\n### Lệnh sản xuất:\n';
    workOrders.slice(0, 10).forEach((wo) => {
      context += `- ${wo.orderNumber}: ${wo.product} | ${wo.status} | ${wo.progress}%\n`;
    });
  }

  if (issues && issues.length > 0) {
    context += '\n### Vấn đề cần chú ý:\n';
    issues.forEach((issue) => {
      context += `- ${issue.type}: ${issue.description}\n`;
    });
  }

  return context;
}

function formatMRPData(data: Record<string, unknown>): string {
  const shortages = data.shortages as MRPShortageItem[] | undefined;
  const suggestions = data.suggestions as MRPSuggestionItem[] | undefined;

  let context = '### Kết quả MRP:\n';

  if (shortages && shortages.length > 0) {
    context += '\n### Vật tư thiếu hụt:\n';
    shortages.forEach((item) => {
      const status = item.shortage > item.safetyStock ? '\u{1F534}' : '\u{1F7E1}';
      context += `${status} ${item.partNumber}: ${item.partName} | Thiếu: ${item.shortage} ${item.unit}\n`;
    });
  }

  if (suggestions && suggestions.length > 0) {
    context += '\n### Đề xuất mua hàng:\n';
    suggestions.forEach((s) => {
      context += `- ${s.partNumber}: Mua ${s.quantity} ${s.unit} từ ${s.supplier} | ${formatCurrency(s.totalCost)}\n`;
    });
  }

  return context;
}

function formatPurchaseData(data: Record<string, unknown>): string {
  const suggestions = data.suggestions as PurchaseSuggestionItem[] | undefined;
  const bySupplier = data.bySupplier as Record<string, PurchaseBySupplierInfo> | undefined;
  const totalValue = data.totalValue as number | undefined;

  let context = '### Đề xuất mua hàng:\n';
  context += `Tổng giá trị: ${formatCurrency(totalValue || 0)}\n`;

  if (bySupplier) {
    context += '\n### Theo nhà cung cấp:\n';
    Object.entries(bySupplier).forEach(([supplier, info]) => {
      context += `- ${supplier}: ${info.items} items | ${formatCurrency(info.total)}\n`;
    });
  }

  if (suggestions && suggestions.length > 0) {
    context += '\n### Chi tiết:\n';
    suggestions.forEach((s) => {
      const priority = s.priority === 'URGENT' ? '\u{1F534}' : s.priority === 'HIGH' ? '\u{1F7E1}' : '\u{1F535}';
      context += `${priority} ${s.partNumber}: ${s.quantity} ${s.unit} | ${s.supplier} | ${formatCurrency(s.totalCost)}\n`;
    });
  }

  return context;
}

function formatQualityData(data: Record<string, unknown>): string {
  const summary = data.summary as Record<string, number> | undefined;
  const ncrs = data.ncrs as QualityNCRItem[] | undefined;

  let context = '### Báo cáo chất lượng:\n';

  if (summary) {
    context += `- Tỷ lệ đạt: ${summary.passRate || 0}%\n`;
    context += `- NCR mở: ${summary.openNCRs || 0}\n`;
    context += `- Kiểm tra hôm nay: ${summary.inspectionsToday || 0}\n`;
  }

  if (ncrs && ncrs.length > 0) {
    context += '\n### NCR mở:\n';
    ncrs.forEach((ncr) => {
      context += `- ${ncr.ncrNumber}: ${ncr.description} | ${ncr.status}\n`;
    });
  }

  return context;
}

function formatAnalyticsData(data: Record<string, unknown>): string {
  const revenue = data.revenue as Record<string, number> | undefined;
  const trends = data.trends as TrendDataPoint[] | undefined;

  let context = '### Phân tích:\n';

  if (revenue) {
    context += `\n#### Doanh thu:\n`;
    context += `- Tháng này: ${formatCurrency(revenue.thisMonth || 0)}\n`;
    context += `- Tháng trước: ${formatCurrency(revenue.lastMonth || 0)}\n`;
    context += `- Tăng trưởng: ${revenue.growth || 0}%\n`;
  }

  if (trends) {
    context += `\n#### Xu hướng:\n`;
    context += trends.map((t) => `- ${t.period}: ${formatCurrency(t.value)}`).join('\n');
  }

  return context;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

// =============================================================================
// RESPONSE TEMPLATES
// =============================================================================

export const RESPONSE_TEMPLATES = {
  no_data: `Xin lỗi, tôi chưa có dữ liệu để trả lời câu hỏi này.

Đề xuất:
• Kiểm tra kết nối với cơ sở dữ liệu
• Chạy đồng bộ dữ liệu
• Thử lại sau ít phút`,

  error: `Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.

Bạn có thể thử:
• Diễn đạt lại câu hỏi
• Hỏi câu hỏi đơn giản hơn
• Liên hệ quản trị viên nếu lỗi tiếp tục`,

  help: `Xin chào! Tôi là Trợ lý AI của hệ thống L-ERP MRP.

Tôi có thể giúp bạn:

[SECTION:inventory]
Tồn kho - "Những vật tư nào sắp hết?", "Tồn kho vật tư CMP-BRG-002"

[SECTION:orders]
Đơn hàng - "Tổng hợp đơn hàng tuần này", "Tình trạng SO-2025-001"

[SECTION:production]
Sản xuất - "Tiến độ sản xuất hôm nay", "Lệnh WO-2025-001 đang ở đâu?"

[SECTION:mrp]
MRP - "Chạy MRP cho đơn hàng mới", "Vật tư nào cần đặt gấp?"

[SECTION:analytics]
Phân tích - "So sánh doanh thu với tháng trước", "Xu hướng tồn kho"

Mẹo: Hỏi cụ thể để có câu trả lời chính xác hơn!`,

  greeting: `Xin chào! Tôi sẵn sàng hỗ trợ bạn. Hãy hỏi tôi về tồn kho, đơn hàng, sản xuất hoặc bất kỳ điều gì liên quan đến MRP!`,
};

export default {
  MRP_SYSTEM_CONTEXT,
  detectIntent,
  buildPrompt,
  RESPONSE_TEMPLATES,
};
