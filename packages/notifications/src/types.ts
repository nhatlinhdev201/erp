/**
 * @linkk/notifications - Type definitions
 * Notification system for L-ERP
 */

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  ACTION_REQUIRED = 'ACTION_REQUIRED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  module: string;
  userId: string;
  channels: NotificationChannel[];
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPayload {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  module: string;
  channels: NotificationChannel[];
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}
