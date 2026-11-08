/**
 * @linkk/notifications
 * Real-time notification system for L-ERP
 */

// Types
export {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  Notification,
  NotificationPayload
} from './types';

// Server
export { NotificationServer } from './server';

// Client
export {
  NotificationClient,
  useNotifications,
  UseNotificationsResult
} from './client';

// Store
export {
  NotificationStore,
  InMemoryStore,
  RedisStore
} from './store';

// Templates
export {
  invoiceCreated,
  orderPlaced,
  leaveApproved,
  taskAssigned,
  stockLow,
  paymentReceived,
  NotificationBuilder
} from './templates';
