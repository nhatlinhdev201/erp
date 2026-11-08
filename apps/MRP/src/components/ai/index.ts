// =============================================================================
// AI COMPONENTS - INDEX
// Trợ lý AI thông minh cho L-ERP MRP
// =============================================================================

// Original widget (mock data)
export {
  AIAssistantWidget,
  AIHelpTooltip,
  AIInsightCard,
} from './assistant-widget';

// V2 widget (real API integration)
export { AIAssistantWidgetV2 } from './assistant-widget-v2';

// Default export - use V2 in production
export { AIAssistantWidgetV2 as default } from './assistant-widget-v2';
