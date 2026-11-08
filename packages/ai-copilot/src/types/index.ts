// ============================================================
// @linkk/ai-copilot — Type Definitions (LIPHOCO Extended)
// ============================================================

export type CopilotModule =
  | 'hrm'
  | 'crm'
  | 'mrp'
  | 'accounting'
  | 'otb'
  | 'pm'
  | 'tpm'
  | 'excel-ai'
  | 'costing'      // ← NEW: LIPHOCO Costing module
  | 'general';

export interface CopilotConfig {
  apiKey: string;
  model?: string;              // default: claude-sonnet-4-20250514
  maxTokens?: number;          // default: 4096
  temperature?: number;        // default: 0.3 for structured, 0.7 for creative
  language?: 'vi' | 'en';     // default: 'vi'
  enabledModules?: CopilotModule[];
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  tenantId: string;
  tier: 'basic' | 'pro' | 'enterprise';
  module: CopilotModule;
  language: 'vi' | 'en';
  history: ChatMessage[];
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  content: string;
  isError?: boolean;
}

export interface CopilotTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface CopilotModuleDefinition {
  id: CopilotModule;
  name: string;
  description: string;
  tools: CopilotTool[];
  systemPrompt: string;
}

export interface CopilotResponse {
  message: ChatMessage;
  confidence: number;
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'done';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

export interface ModuleAssistant {
  module: CopilotModule;
  systemPrompt: string;
  tools: CopilotTool[];
  contextBuilder: (context: ConversationContext) => Promise<string>;
}

export interface DataCard {
  title: string;
  type: 'metric' | 'table' | 'chart';
  data: unknown;
  source: string;
}

export interface SuggestedAction {
  label: string;
  action: string;
  module?: CopilotModule;
  params?: Record<string, unknown>;
}
