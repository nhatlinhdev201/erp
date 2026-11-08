// =============================================================================
// L-ERP MRP - UI COMPONENTS INDEX
// Export all UI components for easy importing
// =============================================================================

// Buttons
export { Button, IconButton, ButtonGroup } from './button';
export type { ButtonProps, IconButtonProps, ButtonGroupProps } from './button';

// Inputs
export { Input, SearchInput, Textarea } from './input';
export type { InputProps, SearchInputProps, TextareaProps } from './input';

// Select
export { Select, NativeSelect } from './select';
export type { SelectProps, SelectOption, NativeSelectProps } from './select';

// Badges
export { Badge, Tag, StatusBadge } from './badge';
export type { BadgeProps, TagProps, StatusBadgeProps } from './badge';

// Cards
export { Card, CardHeader, CardBody, CardFooter, StatCard, LinkCard, SectionCard } from './card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps, StatCardProps, LinkCardProps, SectionCardProps } from './card';

// KPI Cards
export { KPICard, KPICardGroup, Sparkline, ProgressBar, ChangeIndicator } from './kpi-card';
export type { KPICardProps, KPICardGroupProps, SparklineProps } from './kpi-card';

// Data Table
export { DataTable, TablePagination } from './data-table';
export type { DataTableProps, Column } from './data-table';

// Modals
export { Modal, ConfirmDialog, AlertDialog, Drawer } from './modal';
export type { ModalProps, ConfirmDialogProps, AlertDialogProps, DrawerProps } from './modal';

// Tabs
export { Tabs, Tab, TabList, TabPanels, TabPanel } from './tabs';
export type { TabsProps, TabItem } from './tabs';

// Toast
export { ToastContainer, ToastProvider, useToast, toast } from './toast';
export type { Toast, ToastType } from './toast';

// Charts
export {
  ChartWrapper,
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  ComposedChart,
  Sparkline as ChartSparkline,
  chartTheme,
} from './charts';
export type {
  ChartWrapperProps,
  AreaChartProps,
  BarChartProps,
  LineChartProps,
  DonutChartProps,
  ComposedChartProps,
} from './charts';

// Command Palette
export {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPalette,
  defaultNavigationItems,
  defaultActionItems,
} from './command-palette';
export type {
  CommandItem,
  CommandGroup,
  CommandPaletteProps,
} from './command-palette';

// Loading & Empty States - moved to @/components/ui/skeleton-variants
// Import from '@/components/ui/skeleton-variants' for: TableSkeleton, StatsSkeleton, ChartSkeleton, etc.
