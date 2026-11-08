// =============================================================================
// RTR AI COPILOT - AI SERVICE LAYER
// Claude API integration with safety guardrails and audit logging
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

// Types
export interface AIContext {
  page: string;
  module: string;
  userId: string;
  userName: string;
  userRole: string;
  selectedItems?: Record<string, unknown>[];
  filters?: Record<string, unknown>;
  recentActions?: string[];
  language: 'en' | 'vi';
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestedActions?: AIAction[];
    dataUsed?: string[];
  };
}

export interface AIAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'navigate' | 'export' | 'notify';
  label: string;
  labelVi: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  payload?: Record<string, unknown>;
  endpoint?: string;
}

export interface AIResponse {
  message: string;
  confidence: number;
  suggestedActions: AIAction[];
  dataUsed: string[];
  reasoning?: string;
  warnings?: string[];
  relatedQueries?: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  input: {
    type: 'text' | 'voice' | 'action';
    content: string;
    context: AIContext;
  };
  processing: {
    intent: string;
    agent: string;
    tokensUsed: number;
    latencyMs: number;
  };
  output: {
    confidence: number;
    suggestedActions: string[];
    responseLength: number;
  };
  userAction?: 'approved' | 'rejected' | 'modified' | 'ignored';
  feedback?: {
    rating: number;
    comment?: string;
  };
}

// Safety Guardrails Configuration
const SAFETY_CONFIG = {
  // Minimum confidence to show suggestions
  minConfidenceForSuggestion: 0.5,
  // Minimum confidence for auto-draft
  minConfidenceForAutoDraft: 0.85,
  // Actions that always require human approval
  criticalActions: [
    'delete_order',
    'delete_customer',
    'delete_supplier',
    'change_pricing',
    'approve_po_over_limit',
    'modify_compliance_status',
    'bulk_update',
    'export_sensitive_data',
  ],
  // Financial thresholds
  financialLimits: {
    autoApprove: 1000, // USD
    requireManagerApproval: 10000,
    requireDirectorApproval: 50000,
  },
  // Rate limiting
  rateLimits: {
    messagesPerMinute: 20,
    actionsPerHour: 100,
  },
  // Blocked patterns (prompt injection prevention)
  blockedPatterns: [
    /ignore previous instructions/i,
    /disregard all prior/i,
    /you are now/i,
    /pretend to be/i,
    /act as if/i,
    /bypass/i,
    /override safety/i,
  ],
};

// MRP-specific system prompt
const MRP_SYSTEM_PROMPT = `You are RTR AI Copilot, an intelligent assistant for L-ERP MRP (Manufacturing Resource Planning) system.

CORE PRINCIPLES:
1. ACCURACY: Always base responses on actual data. Never make up numbers or facts.
2. SAFETY: Recommend human approval for any action that could cause financial loss or data corruption.
3. TRANSPARENCY: Explain your reasoning and confidence level for every recommendation.
4. HELPFULNESS: Proactively suggest relevant actions and insights.

YOUR CAPABILITIES:
- Inventory Management: Stock levels, reorder points, demand forecasting
- Sales & Orders: Order status, customer insights, revenue analysis
- Procurement: Supplier management, PO creation, price analysis
- Production: Work orders, capacity planning, scheduling
- Quality: NCR/CAPA tracking, quality metrics, supplier quality
- Analytics: KPIs, trends, comparisons, forecasting

RESPONSE FORMAT:
Always structure your responses with:
1. Direct answer to the user's question
2. Relevant data/metrics (if applicable)
3. Confidence level and reasoning
4. Suggested actions (if applicable)
5. Related insights or warnings

LANGUAGE:
- Respond in the same language as the user's query
- For Vietnamese: Use natural, professional Vietnamese
- For English: Use clear, concise business English

SAFETY RULES:
- Never execute actions without explicit user approval
- Always warn about potential risks
- Flag any data inconsistencies
- Recommend verification for critical decisions

CURRENT CONTEXT:
The user is working in the L-ERP MRP system. Use the provided context to give relevant, contextual responses.`;

// Module-specific prompts
const MODULE_PROMPTS: Record<string, string> = {
  inventory: `
INVENTORY MODULE CONTEXT:
- You have access to real-time inventory data
- Key metrics: stock levels, reorder points, turnover rates
- Can analyze: low stock, overstock, dead stock
- Can suggest: reorder quantities, safety stock adjustments
- Compliance: Track NDAA, ITAR, RoHS status of parts`,

  sales: `
SALES MODULE CONTEXT:
- You have access to sales orders and customer data
- Key metrics: revenue, order value, conversion rates
- Can analyze: sales trends, customer segments, product performance
- Can suggest: pricing, promotions, customer follow-ups`,

  procurement: `
PROCUREMENT MODULE CONTEXT:
- You have access to purchase orders and supplier data
- Key metrics: spend, lead times, supplier performance
- Can analyze: price trends, supplier risks, cost savings
- Can suggest: reorder timing, alternative suppliers, bulk buying`,

  production: `
PRODUCTION MODULE CONTEXT:
- You have access to work orders and production data
- Key metrics: efficiency, on-time delivery, capacity utilization
- Can analyze: bottlenecks, scheduling conflicts, material availability
- Can suggest: schedule optimization, resource allocation`,

  quality: `
QUALITY MODULE CONTEXT:
- You have access to NCR, CAPA, and quality metrics
- Key metrics: defect rates, FPY, supplier quality scores
- Can analyze: quality trends, root causes, recurring issues
- Can suggest: corrective actions, process improvements`,

  analytics: `
ANALYTICS MODULE CONTEXT:
- You have access to all system data for analysis
- Can perform: trend analysis, comparisons, forecasting
- Can generate: reports, charts, insights
- Focus on: actionable insights and business impact`,
};

// AI Service Class
export class AIService {
  private client: Anthropic | null = null;
  private auditLogs: AuditLogEntry[] = [];
  private messageCount: Map<string, number> = new Map();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initClient();
  }

  private initClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Safety: Check for prompt injection
  private checkPromptSafety(input: string): { safe: boolean; reason?: string } {
    for (const pattern of SAFETY_CONFIG.blockedPatterns) {
      if (pattern.test(input)) {
        return { safe: false, reason: 'Blocked pattern detected' };
      }
    }
    
    // Check for excessive length (potential attack)
    if (input.length > 10000) {
      return { safe: false, reason: 'Input too long' };
    }

    return { safe: true };
  }

  // Safety: Rate limiting
  private checkRateLimit(userId: string): boolean {
    const key = `${userId}_${Math.floor(Date.now() / 60000)}`;
    const count = this.messageCount.get(key) || 0;
    
    if (count >= SAFETY_CONFIG.rateLimits.messagesPerMinute) {
      return false;
    }
    
    this.messageCount.set(key, count + 1);
    return true;
  }

  // Safety: Validate AI response
  private validateResponse(response: string, context: AIContext): {
    valid: boolean;
    confidence: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let confidence = 0.8; // Base confidence

    // Check for hallucination indicators
    const hallucIndicators = [
      /I don't have access to/i,
      /I cannot verify/i,
      /I'm not sure/i,
      /approximately/i,
      /roughly/i,
    ];

    for (const indicator of hallucIndicators) {
      if (indicator.test(response)) {
        confidence -= 0.1;
      }
    }

    // Check for specific data mentions (increases confidence)
    const dataIndicators = [
      /\d+\s*(pcs|units|items)/i,
      /\$[\d,]+/,
      /\d+%/,
      /PO-\d+/,
      /WO-\d+/,
      /PRT-[A-Z]+-\d+/,
    ];

    for (const indicator of dataIndicators) {
      if (indicator.test(response)) {
        confidence += 0.05;
      }
    }

    // Cap confidence
    confidence = Math.max(0.3, Math.min(0.98, confidence));

    // Add warnings for low confidence
    if (confidence < 0.6) {
      warnings.push('Low confidence - please verify this information');
    }

    return { valid: true, confidence, warnings };
  }

  // Build context-aware prompt
  private buildPrompt(context: AIContext, query: string, history: AIMessage[]): string {
    const modulePrompt = MODULE_PROMPTS[context.module] || '';
    
    const contextInfo = `
CURRENT USER CONTEXT:
- User: ${context.userName} (${context.userRole})
- Current Page: ${context.page}
- Module: ${context.module}
- Language: ${context.language === 'vi' ? 'Vietnamese' : 'English'}
${context.selectedItems?.length ? `- Selected Items: ${context.selectedItems.length} items` : ''}
${context.filters ? `- Active Filters: ${JSON.stringify(context.filters)}` : ''}
${context.recentActions?.length ? `- Recent Actions: ${context.recentActions.join(', ')}` : ''}
`;

    const historyText = history.slice(-10).map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n');

    return `${MRP_SYSTEM_PROMPT}

${modulePrompt}

${contextInfo}

CONVERSATION HISTORY:
${historyText}

USER QUERY: ${query}

Please provide a helpful, accurate, and safe response.`;
  }

  // Parse AI response for structured data
  private parseResponse(rawResponse: string): AIResponse {
    // Extract confidence if mentioned
    let confidence = 0.75;
    const confMatch = rawResponse.match(/confidence[:\s]+(\d+)%/i);
    if (confMatch) {
      confidence = parseInt(confMatch[1]) / 100;
    }

    // Extract suggested actions
    const suggestedActions: AIAction[] = [];
    
    // Look for action patterns in response
    const actionPatterns = [
      { pattern: /tạo PO|create PO/i, type: 'create' as const, label: 'Create PO', labelVi: 'Tạo PO' },
      { pattern: /tạo WO|create WO|create work order/i, type: 'create' as const, label: 'Create Work Order', labelVi: 'Tạo Work Order' },
      { pattern: /xem chi tiết|view details/i, type: 'navigate' as const, label: 'View Details', labelVi: 'Xem chi tiết' },
      { pattern: /xuất báo cáo|export report/i, type: 'export' as const, label: 'Export Report', labelVi: 'Xuất báo cáo' },
      { pattern: /cập nhật|update/i, type: 'update' as const, label: 'Update', labelVi: 'Cập nhật' },
    ];

    actionPatterns.forEach((ap, index) => {
      if (ap.pattern.test(rawResponse)) {
        suggestedActions.push({
          id: `action_${index}`,
          type: ap.type,
          label: ap.label,
          labelVi: ap.labelVi,
          description: '',
          riskLevel: ap.type === 'create' ? 'medium' : 'low',
          requiresApproval: ap.type === 'create' || ap.type === 'update',
        });
      }
    });

    // Extract data sources mentioned
    const dataUsed: string[] = [];
    const dataPatterns = [
      { pattern: /inventory data/i, source: 'Inventory' },
      { pattern: /sales data|order data/i, source: 'Sales Orders' },
      { pattern: /supplier data/i, source: 'Suppliers' },
      { pattern: /production data|work order/i, source: 'Production' },
      { pattern: /quality data|NCR|CAPA/i, source: 'Quality' },
    ];

    dataPatterns.forEach(dp => {
      if (dp.pattern.test(rawResponse)) {
        dataUsed.push(dp.source);
      }
    });

    return {
      message: rawResponse,
      confidence,
      suggestedActions,
      dataUsed,
    };
  }

  // Main chat method
  async chat(
    query: string,
    context: AIContext,
    history: AIMessage[] = []
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // Safety checks
    const safetyCheck = this.checkPromptSafety(query);
    if (!safetyCheck.safe) {
      return {
        message: context.language === 'vi' 
          ? 'Xin lỗi, tôi không thể xử lý yêu cầu này vì lý do an toàn.'
          : 'Sorry, I cannot process this request for safety reasons.',
        confidence: 0,
        suggestedActions: [],
        dataUsed: [],
        warnings: [safetyCheck.reason || 'Safety check failed'],
      };
    }

    // Rate limiting
    if (!this.checkRateLimit(context.userId)) {
      return {
        message: context.language === 'vi'
          ? 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng đợi một chút.'
          : 'You are sending too many messages. Please wait a moment.',
        confidence: 0,
        suggestedActions: [],
        dataUsed: [],
        warnings: ['Rate limit exceeded'],
      };
    }

    // Build prompt
    const fullPrompt = this.buildPrompt(context, query, history);

    try {
      // Call Claude API
      if (!this.client) {
        // Fallback response if no API key
        return this.getFallbackResponse(query, context);
      }

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          { role: 'user', content: fullPrompt }
        ],
      });

      const rawResponse = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      // Validate response
      const validation = this.validateResponse(rawResponse, context);

      // Parse structured response
      const parsedResponse = this.parseResponse(rawResponse);
      parsedResponse.confidence = validation.confidence;
      parsedResponse.warnings = validation.warnings;

      // Audit logging
      const latencyMs = Date.now() - startTime;
      this.logAudit({
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        userId: context.userId,
        sessionId: this.sessionId,
        input: {
          type: 'text',
          content: query,
          context,
        },
        processing: {
          intent: this.detectIntent(query),
          agent: context.module,
          tokensUsed: response.usage?.input_tokens || 0 + (response.usage?.output_tokens || 0),
          latencyMs,
        },
        output: {
          confidence: parsedResponse.confidence,
          suggestedActions: parsedResponse.suggestedActions.map(a => a.id),
          responseLength: rawResponse.length,
        },
      });

      return parsedResponse;

    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'ai-service' });
      return {
        message: context.language === 'vi'
          ? 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.'
          : 'Sorry, an error occurred. Please try again.',
        confidence: 0,
        suggestedActions: [],
        dataUsed: [],
        warnings: ['Service error'],
      };
    }
  }

  // Detect user intent
  private detectIntent(query: string): string {
    const intents = [
      { pattern: /bao nhiêu|how many|số lượng|count/i, intent: 'count_query' },
      { pattern: /hết hàng|out of stock|low stock|sắp hết/i, intent: 'stock_alert_query' },
      { pattern: /doanh thu|revenue|sales/i, intent: 'revenue_query' },
      { pattern: /so sánh|compare|vs/i, intent: 'comparison_query' },
      { pattern: /dự báo|forecast|predict/i, intent: 'forecast_query' },
      { pattern: /tạo|create|thêm|add/i, intent: 'create_action' },
      { pattern: /cập nhật|update|sửa|edit/i, intent: 'update_action' },
      { pattern: /xóa|delete|remove/i, intent: 'delete_action' },
      { pattern: /báo cáo|report|xuất/i, intent: 'report_query' },
      { pattern: /tại sao|why|nguyên nhân|reason/i, intent: 'analysis_query' },
    ];

    for (const { pattern, intent } of intents) {
      if (pattern.test(query)) {
        return intent;
      }
    }

    return 'general_query';
  }

  // Fallback response when API is not available
  private getFallbackResponse(query: string, context: AIContext): AIResponse {
    const intent = this.detectIntent(query);
    
    const fallbackMessages: Record<string, { en: string; vi: string }> = {
      stock_alert_query: {
        en: 'To check low stock items, I would analyze your inventory data. Based on typical patterns, you should review items where current stock is below the reorder point. Would you like me to show you the low stock report?',
        vi: 'Để kiểm tra hàng sắp hết, tôi sẽ phân tích dữ liệu tồn kho của bạn. Dựa trên các mẫu điển hình, bạn nên xem xét các mặt hàng có tồn kho dưới điểm đặt hàng lại. Bạn có muốn tôi hiển thị báo cáo tồn kho thấp không?',
      },
      revenue_query: {
        en: 'I can help analyze your revenue data. To provide accurate insights, I would look at your sales orders, compare periods, and identify trends. What specific timeframe or comparison would you like?',
        vi: 'Tôi có thể giúp phân tích dữ liệu doanh thu của bạn. Để cung cấp thông tin chính xác, tôi sẽ xem xét đơn hàng, so sánh các kỳ và xác định xu hướng. Bạn muốn xem khoảng thời gian hoặc so sánh cụ thể nào?',
      },
      general_query: {
        en: 'I\'m here to help you with the MRP system. I can assist with inventory management, sales analysis, procurement, production planning, and quality management. What would you like to know?',
        vi: 'Tôi ở đây để giúp bạn với hệ thống MRP. Tôi có thể hỗ trợ quản lý tồn kho, phân tích bán hàng, mua hàng, lập kế hoạch sản xuất và quản lý chất lượng. Bạn muốn biết điều gì?',
      },
    };

    const message = fallbackMessages[intent] || fallbackMessages.general_query;

    return {
      message: context.language === 'vi' ? message.vi : message.en,
      confidence: 0.6,
      suggestedActions: [],
      dataUsed: [],
      warnings: ['Running in demo mode - connect API for full capabilities'],
    };
  }

  // Audit logging
  private logAudit(entry: AuditLogEntry) {
    this.auditLogs.push(entry);

    // In production, send to logging service
  }

  // Get audit logs
  getAuditLogs(userId?: string, limit = 100): AuditLogEntry[] {
    let logs = this.auditLogs;
    
    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }
    
    return logs.slice(-limit);
  }

  // Record user feedback
  recordFeedback(auditId: string, rating: number, comment?: string) {
    const log = this.auditLogs.find(l => l.id === auditId);
    if (log) {
      log.feedback = { rating, comment };
    }
  }

  // Record user action on AI suggestion
  recordUserAction(auditId: string, action: 'approved' | 'rejected' | 'modified' | 'ignored') {
    const log = this.auditLogs.find(l => l.id === auditId);
    if (log) {
      log.userAction = action;
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

// Types are already exported via 'export interface' declarations above
