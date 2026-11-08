// =============================================================================
// L-ERP MRP - EVENT SIMULATOR
// Simulates real-time events for development/demo
// =============================================================================

import {
  type RTREventType,
  type DashboardStatsPayload,
  type OrderEventPayload,
  type InventoryEventPayload,
  type ProductionEventPayload,
  type QualityEventPayload,
  type NotificationPayload,
  createEvent,
  createNotification,
} from './events';
import { globalEmitter } from './use-socket';

// =============================================================================
// SIMULATOR CLASS
// =============================================================================

class EventSimulator {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  // Sample data for simulation
  private sampleParts = [
    { id: 'p1', number: 'CMP-BRG-002', name: 'Bạc đạn bi 6201-2RS' },
    { id: 'p2', number: 'CMP-MOT-001', name: 'Motor DC 12V 50W' },
    { id: 'p3', number: 'CMP-GBX-001', name: 'Hộp số giảm tốc 1:10' },
    { id: 'rm1', number: 'RM-STL-002', name: 'Thép tấm carbon 3mm' },
    { id: 'rm2', number: 'RM-ALU-001', name: 'Nhôm tấm 1.5mm' },
  ];

  private sampleCustomers = [
    'ABC Manufacturing',
    'XYZ Industries',
    'Đông Á Group',
    'AgriTech Corp',
    'Tech Solutions',
  ];

  private sampleUsers = [
    'Nguyễn Văn A',
    'Trần Thị B',
    'Lê Văn C',
    'Phạm Thị D',
    'Hoàng Văn E',
  ];

  private orderCounter = 156;
  private ncrCounter = 5;

  // Start simulation
  start(options?: { 
    dashboardInterval?: number;
    orderInterval?: number;
    inventoryInterval?: number;
    productionInterval?: number;
    notificationInterval?: number;
  }) {
    if (this.isRunning) return;
    this.isRunning = true;

    const {
      dashboardInterval = 30000,    // 30s
      orderInterval = 45000,        // 45s
      inventoryInterval = 20000,    // 20s
      productionInterval = 15000,   // 15s
      notificationInterval = 60000, // 60s
    } = options || {};

    // Dashboard stats updates
    this.intervals.push(
      setInterval(() => this.emitDashboardUpdate(), dashboardInterval)
    );

    // Order events
    this.intervals.push(
      setInterval(() => this.emitOrderEvent(), orderInterval)
    );

    // Inventory events
    this.intervals.push(
      setInterval(() => this.emitInventoryEvent(), inventoryInterval)
    );

    // Production events
    this.intervals.push(
      setInterval(() => this.emitProductionEvent(), productionInterval)
    );

    // Random notifications
    this.intervals.push(
      setInterval(() => this.emitRandomNotification(), notificationInterval)
    );

  }

  // Stop simulation
  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  // Check if running
  get running() {
    return this.isRunning;
  }

  // Manual triggers
  triggerDashboardUpdate() {
    this.emitDashboardUpdate();
  }

  triggerNewOrder() {
    this.emitNewOrder();
  }

  triggerLowStock(partId?: string) {
    this.emitLowStock(partId);
  }

  triggerNCR() {
    this.emitNCR();
  }

  // =============================================================================
  // EMIT FUNCTIONS
  // =============================================================================

  private emitDashboardUpdate() {
    const payload: DashboardStatsPayload = {
      revenue: {
        current: 3450000000 + Math.floor(Math.random() * 100000000),
        growth: 15.3 + (Math.random() - 0.5) * 2,
      },
      orders: {
        total: 156 + Math.floor(Math.random() * 3),
        pending: 12 + Math.floor(Math.random() * 5) - 2,
      },
      production: {
        efficiency: 94.5 + (Math.random() - 0.5) * 3,
        running: 8 + Math.floor(Math.random() * 3) - 1,
      },
    };

    globalEmitter.emit(createEvent('dashboard:stats_updated', payload));
  }

  private emitOrderEvent() {
    const eventTypes: RTREventType[] = ['order:created', 'order:status_changed', 'order:updated'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    if (eventType === 'order:created') {
      this.emitNewOrder();
    } else {
      const statuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED'];
      const payload: OrderEventPayload = {
        orderId: `so${Math.floor(Math.random() * 100)}`,
        orderNumber: `SO-2025-${String(150 + Math.floor(Math.random() * 10)).padStart(3, '0')}`,
        type: 'sales',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        customer: this.sampleCustomers[Math.floor(Math.random() * this.sampleCustomers.length)],
        updatedBy: this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)],
        timestamp: new Date().toISOString(),
      };

      globalEmitter.emit(createEvent(eventType, payload));
    }
  }

  private emitNewOrder() {
    this.orderCounter++;
    const customer = this.sampleCustomers[Math.floor(Math.random() * this.sampleCustomers.length)];
    const amount = Math.floor(50000000 + Math.random() * 200000000);

    const payload: OrderEventPayload = {
      orderId: `so-new-${Date.now()}`,
      orderNumber: `SO-2025-${String(this.orderCounter).padStart(3, '0')}`,
      type: 'sales',
      status: 'PENDING',
      customer,
      totalAmount: amount,
      timestamp: new Date().toISOString(),
    };

    globalEmitter.emit(createEvent('order:created', payload));

    // Also send notification
    const notification = createNotification(
      'info',
      'Đơn hàng mới',
      `${payload.orderNumber} - ${customer} - ${new Intl.NumberFormat('vi-VN').format(amount)} VND`,
      { link: `/orders/${payload.orderId}`, icon: 'ShoppingCart' }
    );
    globalEmitter.emit(createEvent('notification:new', notification));
  }

  private emitInventoryEvent() {
    const part = this.sampleParts[Math.floor(Math.random() * this.sampleParts.length)];
    const changeType = Math.random() > 0.5 ? 'receive' : 'issue';
    const previousQty = Math.floor(50 + Math.random() * 200);
    const change = Math.floor(10 + Math.random() * 50);
    const newQty = changeType === 'receive' ? previousQty + change : previousQty - change;

    const payload: InventoryEventPayload = {
      partId: part.id,
      partNumber: part.number,
      partName: part.name,
      previousQty,
      newQty,
      changeType,
      location: 'WH-01',
      updatedBy: this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)],
      timestamp: new Date().toISOString(),
    };

    globalEmitter.emit(createEvent('inventory:updated', payload));

    // Check for low stock
    if (newQty < 30 && Math.random() > 0.7) {
      this.emitLowStock(part.id);
    }
  }

  private emitLowStock(partId?: string) {
    const part = partId 
      ? this.sampleParts.find(p => p.id === partId) || this.sampleParts[0]
      : this.sampleParts[Math.floor(Math.random() * this.sampleParts.length)];

    const isOutOfStock = Math.random() > 0.7;
    const eventType: RTREventType = isOutOfStock ? 'inventory:out_of_stock' : 'inventory:low_stock';

    const payload: InventoryEventPayload = {
      partId: part.id,
      partNumber: part.number,
      partName: part.name,
      previousQty: isOutOfStock ? 5 : 25,
      newQty: isOutOfStock ? 0 : 15,
      changeType: 'issue',
      timestamp: new Date().toISOString(),
    };

    globalEmitter.emit(createEvent(eventType, payload));

    // Send alert notification
    const notification = createNotification(
      isOutOfStock ? 'error' : 'warning',
      isOutOfStock ? 'Hết hàng!' : 'Tồn kho thấp',
      `${part.number} - ${part.name}`,
      { link: `/inventory/${part.id}`, icon: 'Package' }
    );
    globalEmitter.emit(createEvent('notification:new', notification));
  }

  private emitProductionEvent() {
    const events: { type: RTREventType; status: string }[] = [
      { type: 'production:progress', status: 'IN_PROGRESS' },
      { type: 'production:progress', status: 'IN_PROGRESS' },
      { type: 'production:completed', status: 'COMPLETED' },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    const progress = event.type === 'production:completed' ? 100 : Math.floor(30 + Math.random() * 60);

    const payload: ProductionEventPayload = {
      workOrderId: `wo${Math.floor(Math.random() * 10)}`,
      orderNumber: `WO-2025-${String(Math.floor(Math.random() * 20)).padStart(3, '0')}`,
      productName: 'Sản phẩm Model A1',
      quantity: 10,
      completedQty: Math.floor(progress / 10),
      progress,
      status: event.status,
      workstation: `Line-0${Math.floor(Math.random() * 3) + 1}`,
      timestamp: new Date().toISOString(),
    };

    globalEmitter.emit(createEvent(event.type, payload));

    if (event.type === 'production:completed') {
      const notification = createNotification(
        'success',
        'Hoàn thành sản xuất',
        `${payload.orderNumber} - ${payload.productName}`,
        { link: `/production/${payload.workOrderId}`, icon: 'Factory' }
      );
      globalEmitter.emit(createEvent('notification:new', notification));
    }
  }

  private emitNCR() {
    this.ncrCounter++;
    const severities: ('CRITICAL' | 'MAJOR' | 'MINOR')[] = ['MAJOR', 'MINOR', 'MINOR'];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const part = this.sampleParts[Math.floor(Math.random() * this.sampleParts.length)];

    const descriptions = [
      `Phát hiện lỗi kích thước trên ${part.name}`,
      `Vật liệu không đạt tiêu chuẩn - ${part.name}`,
      `Lỗi lắp ráp - cần kiểm tra lại quy trình`,
    ];

    const payload: QualityEventPayload = {
      recordId: `ncr-${Date.now()}`,
      recordNumber: `NCR-2025-${String(this.ncrCounter).padStart(3, '0')}`,
      type: 'NCR',
      severity,
      status: 'OPEN',
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      reportedBy: this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)],
      timestamp: new Date().toISOString(),
    };

    globalEmitter.emit(createEvent('quality:ncr_created', payload));

    const notification = createNotification(
      severity === 'CRITICAL' ? 'error' : 'warning',
      `NCR mới - ${severity}`,
      payload.description,
      { link: `/quality/${payload.recordId}`, icon: 'AlertTriangle' }
    );
    globalEmitter.emit(createEvent('notification:new', notification));
  }

  private emitRandomNotification() {
    const notifications = [
      { type: 'info' as const, title: 'Nhắc nhở', message: 'Có 3 PO cần duyệt' },
      { type: 'success' as const, title: 'Báo cáo sẵn sàng', message: 'Báo cáo tồn kho tháng 1 đã xuất xong' },
      { type: 'info' as const, title: 'MRP hoàn tất', message: 'Đã tính toán xong MRP cho 5 đơn hàng' },
      { type: 'warning' as const, title: 'Deadline gần', message: 'SO-2025-152 cần giao trong 2 ngày' },
    ];

    const notif = notifications[Math.floor(Math.random() * notifications.length)];
    const notification = createNotification(notif.type, notif.title, notif.message);
    globalEmitter.emit(createEvent('notification:new', notification));
  }
}

// Export singleton instance
export const eventSimulator = new EventSimulator();
export default eventSimulator;
