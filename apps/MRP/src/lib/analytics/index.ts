// =============================================================================
// L-ERP MRP - ADVANCED ANALYTICS MODULE
// Barrel export for analytics services
// =============================================================================

// Types
export * from './types';

// Services
export { kpiService, SYSTEM_KPIS } from './kpi-service';
export { dashboardService, DEFAULT_LAYOUT, DEFAULT_WIDGET_DISPLAY, DASHBOARD_TEMPLATES } from './dashboard-service';
export { widgetService } from './widget-service';
export { reportService } from './report-service';

// Query Builder
export { QueryBuilder, createQuery, analyticsQueries } from './query-builder';

// Re-export individual services as default
import { kpiService } from './kpi-service';
import { dashboardService } from './dashboard-service';
import { widgetService } from './widget-service';
import { reportService } from './report-service';

export const analytics = {
  kpi: kpiService,
  dashboard: dashboardService,
  widget: widgetService,
  report: reportService,
};

export default analytics;
