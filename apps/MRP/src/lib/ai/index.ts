// =============================================================================
// AI LIBRARY - INDEX
// L-ERP MRP AI Integration with OpenAI + Anthropic Fallback
// =============================================================================

// Forecast Module
export * from './forecast';
export { default as ForecastModule } from './forecast';

// Provider Service
export {
  AIProviderService,
  getAIProvider,
  resetAIProvider,
  createSystemMessage,
  createUserMessage,
  createAssistantMessage,
  type AIProvider,
  type AIMessage,
  type AIRequestOptions,
  type AIResponse,
  type AIProviderConfig,
  type AIProviderStatus,
} from './provider';

// Prompts & Context
export {
  MRP_SYSTEM_CONTEXT,
  detectIntent,
  buildPrompt,
  RESPONSE_TEMPLATES,
  type QueryIntent,
  type DetectedIntent,
  type PromptContext,
} from './prompts';

// Query Executor
export {
  QueryExecutor,
  getQueryExecutor,
  type QueryResult,
  type DataFetcher,
} from './query-executor';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { getAIProvider, AIMessage } from './provider';
import { detectIntent, buildPrompt } from './prompts';
import { getQueryExecutor } from './query-executor';

/**
 * Quick chat function for simple queries
 */
export async function quickChat(message: string): Promise<{
  response: string;
  provider: string;
  intent: string;
}> {
  const intent = detectIntent(message);
  const executor = getQueryExecutor();
  const queryResult = await executor.execute(intent);
  
  const messages = buildPrompt({
    intent: intent.intent,
    query: message,
    data: queryResult.data,
  });

  const provider = getAIProvider();
  const response = await provider.chat({ messages });

  return {
    response: response.content,
    provider: response.provider,
    intent: intent.intent,
  };
}

/**
 * Check if AI services are available
 */
export async function checkAIHealth(): Promise<{
  openai: boolean;
  anthropic: boolean;
  anyAvailable: boolean;
}> {
  const provider = getAIProvider();
  const health = await provider.healthCheck();
  
  return {
    openai: health.openai.available,
    anthropic: health.anthropic.available,
    anyAvailable: health.openai.available || health.anthropic.available,
  };
}
