/**
 * @linkk/notifications - Notification templates
 * Bilingual (Vietnamese/English) templates for common events
 */

import { NotificationPayload, NotificationType, NotificationPriority, NotificationChannel } from './types';

type Locale = 'vi' | 'en';

interface Invoice {
  id: string;
  number: string;
  amount: number;
}

interface Order {
  id: string;
  number: string;
  customerName: string;
}

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  title: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface Payment {
  id: string;
  amount: number;
  companyName: string;
}

/**
 * Invoice created notification
 */
export function invoiceCreated(
  invoice: Invoice,
  locale: Locale = 'vi'
): NotificationPayload {
  const formattedAmount = new Intl.NumberFormat(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    { style: 'currency', currency: 'VND' }
  ).format(invoice.amount);

  return {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.MEDIUM,
    title: locale === 'vi' 
      ? `Hoá đơn mới #${invoice.number}`
      : `New Invoice #${invoice.number}`,
    body: locale === 'vi'
      ? `Hoá đơn ${invoice.number} vừa được tạo với số tiền ${formattedAmount}`
      : `Invoice ${invoice.number} has been created for ${formattedAmount}`,
    module: 'accounting',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    actionUrl: `/invoices/${invoice.id}`,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.amount
    }
  };
}

/**
 * Order placed notification
 */
export function orderPlaced(
  order: Order,
  locale: Locale = 'vi'
): NotificationPayload {
  return {
    type: NotificationType.INFO,
    priority: NotificationPriority.MEDIUM,
    title: locale === 'vi'
      ? `Đơn hàng mới #${order.number}`
      : `New Order #${order.number}`,
    body: locale === 'vi'
      ? `Đơn hàng mới #${order.number} từ ${order.customerName}`
      : `New order #${order.number} from ${order.customerName}`,
    module: 'sales',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    actionUrl: `/orders/${order.id}`,
    metadata: {
      orderId: order.id,
      orderNumber: order.number,
      customerName: order.customerName
    }
  };
}

/**
 * Leave approved notification
 */
export function leaveApproved(
  leave: Leave,
  locale: Locale = 'vi'
): NotificationPayload {
  return {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.MEDIUM,
    title: locale === 'vi'
      ? 'Đơn nghỉ phép được duyệt'
      : 'Leave Request Approved',
    body: locale === 'vi'
      ? `Đơn nghỉ phép của bạn từ ${leave.startDate} đến ${leave.endDate} đã được duyệt`
      : `Your leave request from ${leave.startDate} to ${leave.endDate} has been approved`,
    module: 'hr',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    actionUrl: `/leave/${leave.id}`,
    metadata: {
      leaveId: leave.id,
      startDate: leave.startDate,
      endDate: leave.endDate
    }
  };
}

/**
 * Task assigned notification
 */
export function taskAssigned(
  task: Task,
  locale: Locale = 'vi'
): NotificationPayload {
  return {
    type: NotificationType.ACTION_REQUIRED,
    priority: NotificationPriority.HIGH,
    title: locale === 'vi'
      ? 'Bạn được giao task mới'
      : 'New Task Assigned',
    body: locale === 'vi'
      ? `Bạn được giao task: ${task.title}`
      : `You have been assigned a new task: ${task.title}`,
    module: 'projects',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
    actionUrl: `/tasks/${task.id}`,
    metadata: {
      taskId: task.id,
      taskTitle: task.title
    }
  };
}

/**
 * Stock low warning
 */
export function stockLow(
  product: Product,
  locale: Locale = 'vi'
): NotificationPayload {
  return {
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    title: locale === 'vi'
      ? '⚠️ Tồn kho thấp'
      : '⚠️ Low Stock Alert',
    body: locale === 'vi'
      ? `Tồn kho thấp: Sản phẩm ${product.name} còn ${product.stock} đơn vị`
      : `Low stock: Product ${product.name} has only ${product.stock} units remaining`,
    module: 'inventory',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
    actionUrl: `/inventory/${product.id}`,
    metadata: {
      productId: product.id,
      productName: product.name,
      stock: product.stock
    }
  };
}

/**
 * Payment received notification
 */
export function paymentReceived(
  payment: Payment,
  locale: Locale = 'vi'
): NotificationPayload {
  const formattedAmount = new Intl.NumberFormat(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    { style: 'currency', currency: 'VND' }
  ).format(payment.amount);

  return {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.MEDIUM,
    title: locale === 'vi'
      ? 'Thanh toán đã nhận'
      : 'Payment Received',
    body: locale === 'vi'
      ? `Thanh toán ${formattedAmount} từ ${payment.companyName}`
      : `Payment of ${formattedAmount} received from ${payment.companyName}`,
    module: 'accounting',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    actionUrl: `/payments/${payment.id}`,
    metadata: {
      paymentId: payment.id,
      amount: payment.amount,
      companyName: payment.companyName
    }
  };
}

/**
 * Custom notification builder
 */
export class NotificationBuilder {
  private payload: Partial<NotificationPayload> = {};

  setType(type: NotificationType): this {
    this.payload.type = type;
    return this;
  }

  setPriority(priority: NotificationPriority): this {
    this.payload.priority = priority;
    return this;
  }

  setTitle(title: string): this {
    this.payload.title = title;
    return this;
  }

  setBody(body: string): this {
    this.payload.body = body;
    return this;
  }

  setModule(module: string): this {
    this.payload.module = module;
    return this;
  }

  setChannels(channels: NotificationChannel[]): this {
    this.payload.channels = channels;
    return this;
  }

  setActionUrl(url: string): this {
    this.payload.actionUrl = url;
    return this;
  }

  setMetadata(metadata: Record<string, unknown>): this {
    this.payload.metadata = metadata;
    return this;
  }

  build(): NotificationPayload {
    if (!this.payload.type || !this.payload.priority || !this.payload.title 
        || !this.payload.body || !this.payload.module || !this.payload.channels) {
      throw new Error('Missing required notification fields');
    }

    return this.payload as NotificationPayload;
  }
}
