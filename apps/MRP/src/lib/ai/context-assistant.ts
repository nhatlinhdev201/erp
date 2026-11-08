// src/lib/ai/context-assistant.ts
// Context-aware AI assistant for work session recovery

interface ContextAssistantConfig {
  userId: string;
  currentPage?: string;
  currentEntityType?: string;
  currentEntityId?: string;
}

export const CONTEXT_QUERIES: Record<string, string> = {
  'đang làm gì': 'LIST_ACTIVE_SESSIONS',
  'đang làm dở': 'LIST_ACTIVE_SESSIONS',
  'hôm qua': 'YESTERDAY_ACTIVITIES',
  'tuần này': 'WEEK_ACTIVITIES',
  'nhắc tôi': 'PENDING_TASKS',
  'cần làm': 'PENDING_TASKS',
  'tồn kho': 'INVENTORY_QUERY',
  'còn bao nhiêu': 'INVENTORY_QUERY',
  'đơn hàng': 'ORDER_QUERY',
  'mua hàng': 'PO_QUERY',
};

export function detectQueryIntent(query: string): string {
  const lowerQuery = query.toLowerCase();
  for (const [keyword, intent] of Object.entries(CONTEXT_QUERIES)) {
    if (lowerQuery.includes(keyword)) {
      return intent;
    }
  }
  return 'GENERAL';
}

export function buildContextPrompt(
  config: ContextAssistantConfig,
  userQuery: string
): string {
  return `Bạn là trợ lý AI của hệ thống L-ERP MRP. Nhiệm vụ của bạn là giúp người dùng:
1. Nhớ lại context công việc đang dở
2. Tìm thông tin nhanh về parts, PO, SO, inventory
3. Đề xuất bước tiếp theo

THÔNG TIN NGƯỜI DÙNG:
- User ID: ${config.userId}
- Đang ở trang: ${config.currentPage || 'Dashboard'}
${config.currentEntityType ? `- Đang xem: ${config.currentEntityType} ${config.currentEntityId}` : ''}

WORK SESSIONS ĐANG MỞ:
{sessions}

HOẠT ĐỘNG GẦN ĐÂY (24h):
{activities}

CÂU HỎI CỦA NGƯỜI DÙNG:
${userQuery}

HƯỚNG DẪN TRẢ LỜI:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Nếu hỏi về "đang làm gì", liệt kê các session đang mở với context
- Nếu hỏi về part/PO/SO cụ thể, cung cấp thông tin key
- Luôn đề xuất action tiếp theo với button link
- Format response dạng JSON

RESPONSE FORMAT (trả về JSON hợp lệ):
{
  "text": "nội dung trả lời markdown",
  "actions": [
    { "label": "text hiển thị", "url": "/path/to/page" }
  ],
  "suggestions": ["câu hỏi gợi ý 1", "câu hỏi gợi ý 2"]
}`;
}

export interface ContextAssistantResponse {
  text: string;
  actions: { label: string; url: string }[];
  suggestions: string[];
}

/** Build a local response when AI is not available */
export function buildLocalResponse(
  sessions: Array<{
    entityType: string;
    entityNumber: string;
    status: string;
    context: {
      summary?: string;
      pendingActions?: string[];
    };
    resumeUrl: string;
    lastActivityAt: string;
  }>,
  intent: string
): ContextAssistantResponse {
  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'PAUSED');

  if (intent === 'LIST_ACTIVE_SESSIONS' || intent === 'PENDING_TASKS') {
    if (activeSessions.length === 0) {
      return {
        text: 'Bạn không có công việc nào đang dở. Bạn có thể bắt đầu từ Dashboard.',
        actions: [{ label: 'Về Dashboard', url: '/' }],
        suggestions: ['Hôm qua tôi làm gì?', 'Xem tồn kho thấp'],
      };
    }

    const lines = activeSessions.map((s, i) => {
      const status = s.status === 'ACTIVE' ? 'đang làm' : 'tạm dừng';
      const summary = s.context?.summary || '';
      const pending = s.context?.pendingActions?.join(', ') || '';
      return `${i + 1}. **${s.entityNumber}** (${status})\n   ${summary}${pending ? `\n   Cần làm: ${pending}` : ''}`;
    });

    return {
      text: `Bạn đang có **${activeSessions.length} công việc đang dở**:\n\n${lines.join('\n\n')}\n\nBạn muốn tiếp tục với task nào?`,
      actions: activeSessions.map((s) => ({
        label: `Mở ${s.entityNumber}`,
        url: s.resumeUrl,
      })),
      suggestions: ['Hôm qua tôi làm gì?', 'Xem tồn kho thấp'],
    };
  }

  return {
    text: 'Tôi có thể giúp bạn nhớ lại context công việc. Hãy hỏi "Tôi đang làm gì dở?" để xem các công việc đang mở.',
    actions: [{ label: 'Về Dashboard', url: '/' }],
    suggestions: ['Tôi đang làm gì dở?', 'Hôm qua tôi làm gì?', 'Nhắc tôi những việc cần làm'],
  };
}
