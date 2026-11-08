// =============================================================================
// L-ERP MRP - REAL-TIME SERVICE
// WebSocket event types and server-side utilities
// =============================================================================

// =============================================================================
// EVENT TYPES
// =============================================================================

export type RTREventType =
  // Dashboard events
  | 'dashboard:stats_updated'
  | 'dashboard:kpi_changed'
  
  // Order events
  | 'order:created'
  | 'order:updated'
  | 'order:status_changed'
  | 'order:deleted'
  
  // Inventory events
  | 'inventory:updated'
  | 'inventory:low_stock'
  | 'inventory:out_of_stock'
  | 'inventory:received'
  
  // Production events
  | 'production:started'
  | 'production:progress'
  | 'production:completed'
  | 'production:issue'
  
  // Quality events
  | 'quality:ncr_created'
  | 'quality:ncr_updated'
  | 'quality:ncr_closed'
  
  // MRP events
  | 'mrp:run_started'
  | 'mrp:run_completed'
  | 'mrp:suggestions_ready'
  
  // System events
  | 'system:user_connected'
  | 'system:user_disconnected'
  | 'system:broadcast'
  | 'system:maintenance'
  
  // Notification events
  | 'notification:new'
  | 'notification:read'
  | 'notification:clear';

// =============================================================================
// EVENT PAYLOADS
// =============================================================================

export interface DashboardStatsPayload {
  revenue?: { current: number; growth: number };
  orders?: { total: number; pending: number };
  inventory?: { lowStock: number; outOfStock: number };
  production?: { efficiency: number; running: number };
  quality?: { passRate: number; openNCRs: number };
}

export interface OrderEventPayload {
  orderId: string;
  orderNumber: string;
  type: 'sales' | 'purchase' | 'work';
  status?: string;
  previousStatus?: string;
  customer?: string;
  totalAmount?: number;
  updatedBy?: string;
  timestamp: string;
}

export interface InventoryEventPayload {
  partId: string;
  partNumber: string;
  partName: string;
  previousQty: number;
  newQty: number;
  changeType: 'receive' | 'issue' | 'adjust' | 'transfer';
  location?: string;
  reference?: string;
  updatedBy?: string;
  timestamp: string;
}

export interface ProductionEventPayload {
  workOrderId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  completedQty: number;
  progress: number;
  status: string;
  workstation?: string;
  timestamp: string;
}

export interface QualityEventPayload {
  recordId: string;
  recordNumber: string;
  type: 'NCR' | 'CAPA' | 'INSPECTION';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  status: string;
  description: string;
  reportedBy?: string;
  timestamp: string;
}

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  icon?: string;
  timestamp: string;
  read: boolean;
}

export interface SystemEventPayload {
  userId?: string;
  userName?: string;
  message?: string;
  timestamp: string;
}

// =============================================================================
// GENERIC EVENT INTERFACE
// =============================================================================

export interface RTREvent<T = unknown> {
  type: RTREventType;
  payload: T;
  timestamp: string;
  source?: string;
  userId?: string;
}

// =============================================================================
// ROOM/CHANNEL TYPES
// =============================================================================

export type RTRRoom =
  | 'dashboard'
  | 'orders'
  | 'inventory'
  | 'production'
  | 'quality'
  | 'mrp'
  | 'notifications'
  | `user:${string}`;

// =============================================================================
// CONNECTION STATUS
// =============================================================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function createEvent<T>(
  type: RTREventType,
  payload: T,
  options?: { source?: string; userId?: string }
): RTREvent<T> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    source: options?.source,
    userId: options?.userId,
  };
}

export function createNotification(
  type: NotificationPayload['type'],
  title: string,
  message: string,
  options?: { link?: string; icon?: string }
): NotificationPayload {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    link: options?.link,
    icon: options?.icon,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// =============================================================================
// EVENT PRIORITY (for sorting/filtering)
// =============================================================================

export const eventPriority: Record<string, number> = {
  'inventory:out_of_stock': 100,
  'quality:ncr_created': 90,
  'production:issue': 85,
  'inventory:low_stock': 80,
  'order:created': 70,
  'production:completed': 60,
  'order:status_changed': 50,
  'inventory:received': 40,
  'production:progress': 30,
  'dashboard:stats_updated': 20,
  'system:broadcast': 10,
};

export function getEventPriority(eventType: RTREventType): number {
  return eventPriority[eventType] || 0;
}

// =============================================================================
// VIETNAMESE LABELS
// =============================================================================

export const eventLabels: Record<RTREventType, string> = {
  'dashboard:stats_updated': 'Cập nhật Dashboard',
  'dashboard:kpi_changed': 'KPI thay đổi',
  'order:created': 'Đơn hàng mới',
  'order:updated': 'Cập nhật đơn hàng',
  'order:status_changed': 'Trạng thái đơn hàng',
  'order:deleted': 'Xóa đơn hàng',
  'inventory:updated': 'Cập nhật tồn kho',
  'inventory:low_stock': 'Tồn kho thấp',
  'inventory:out_of_stock': 'Hết hàng',
  'inventory:received': 'Nhập kho',
  'production:started': 'Bắt đầu sản xuất',
  'production:progress': 'Tiến độ sản xuất',
  'production:completed': 'Hoàn thành sản xuất',
  'production:issue': 'Sự cố sản xuất',
  'quality:ncr_created': 'NCR mới',
  'quality:ncr_updated': 'Cập nhật NCR',
  'quality:ncr_closed': 'Đóng NCR',
  'mrp:run_started': 'Bắt đầu MRP',
  'mrp:run_completed': 'Hoàn thành MRP',
  'mrp:suggestions_ready': 'Đề xuất MRP sẵn sàng',
  'system:user_connected': 'Người dùng kết nối',
  'system:user_disconnected': 'Người dùng ngắt kết nối',
  'system:broadcast': 'Thông báo hệ thống',
  'system:maintenance': 'Bảo trì hệ thống',
  'notification:new': 'Thông báo mới',
  'notification:read': 'Đã đọc thông báo',
  'notification:clear': 'Xóa thông báo',
};

export function getEventLabel(eventType: RTREventType): string {
  return eventLabels[eventType] || eventType;
}

// =============================================================================
// EVENT ICONS (Lucide icon names)
// =============================================================================

export const eventIcons: Record<string, string> = {
  'dashboard': 'LayoutDashboard',
  'order': 'ShoppingCart',
  'inventory': 'Package',
  'production': 'Factory',
  'quality': 'CheckCircle',
  'mrp': 'Calculator',
  'system': 'Settings',
  'notification': 'Bell',
};

export function getEventIcon(eventType: RTREventType): string {
  const category = eventType.split(':')[0];
  return eventIcons[category] || 'Info';
}
