/**
 * L-ERP Dashboard Package - Main entry point
 * Gói Dashboard L-ERP - Điểm vào chính
 */

// Components
export * from './components';
export { DashboardGrid, WidgetContainer, ResponsiveDashboard } from './components/DashboardGrid';

// Hooks
export * from './hooks';
export { useDashboardData } from './hooks/useDashboardData';
export { useChartData } from './hooks/useChartData';

// Types
export * from './types';

// Presets
export * from './presets';
export { executiveDashboard } from './presets/executive';
export { operationsDashboard } from './presets/operations';
export { hrDashboard } from './presets/hr';

// Version
export const version = '1.0.0';

// Re-export for convenience
export {
  KPICard,
  ChartWidget,
  DataTable,
  ModuleStatus,
} from './components';
