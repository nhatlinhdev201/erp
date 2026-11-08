// =============================================================================
// INTELLIGENT ALERTS - Notification Engine
// Handles in-app and email notifications
// =============================================================================

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  Alert,
  AlertPriority,
  NotificationPreferences,
  AlertSource,
  AlertDigest,
  getPriorityLabel,
  getTypeLabel,
} from './alert-types';

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationResult {
  success: boolean;
  channel: 'inApp' | 'email';
  alertId: string;
  userId: string;
  sentAt?: Date;
  error?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  alertId: string;
  title: string;
  message: string;
  priority: AlertPriority;
  url?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface DigestSchedule {
  userId: string;
  frequency: 'daily' | 'weekly';
  time: string;
  enabled: boolean;
  lastSentAt?: Date;
}

// =============================================================================
// NOTIFICATION ENGINE CLASS
// =============================================================================

export class NotificationEngine {
  private static instance: NotificationEngine;

  // In-memory storage (in production, use Redis)
  private inAppNotifications: Map<string, InAppNotification[]> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private digestSchedules: Map<string, DigestSchedule> = new Map();
  private sentNotifications: Set<string> = new Set();

  private constructor() {}

  static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  // ===========================================================================
  // USER PREFERENCES
  // ===========================================================================

  getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      inApp: {
        enabled: true,
        criticalOnly: false,
        soundEnabled: true,
      },
      email: {
        enabled: true,
        frequency: 'daily',
        criticalImmediate: true,
        digestTime: '09:00',
      },
      sources: {
        [AlertSource.FORECAST]: { enabled: true, minPriority: AlertPriority.MEDIUM },
        [AlertSource.QUALITY]: { enabled: true, minPriority: AlertPriority.MEDIUM },
        [AlertSource.SUPPLIER_RISK]: { enabled: true, minPriority: AlertPriority.MEDIUM },
        [AlertSource.AUTO_PO]: { enabled: true, minPriority: AlertPriority.LOW },
        [AlertSource.AUTO_SCHEDULE]: { enabled: true, minPriority: AlertPriority.MEDIUM },
        [AlertSource.SIMULATION]: { enabled: true, minPriority: AlertPriority.MEDIUM },
        [AlertSource.SYSTEM]: { enabled: true, minPriority: AlertPriority.HIGH },
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        exceptCritical: true,
      },
    };
  }

  getUserPreferences(userId: string): NotificationPreferences {
    const prefs = this.userPreferences.get(userId);
    if (prefs) return prefs;

    const defaults = this.getDefaultPreferences(userId);
    this.userPreferences.set(userId, defaults);
    return defaults;
  }

  updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const current = this.getUserPreferences(userId);

    // Merge quietHours only if either exists
    const quietHours = (current.quietHours || updates.quietHours)
      ? {
          enabled: updates.quietHours?.enabled ?? current.quietHours?.enabled ?? false,
          start: updates.quietHours?.start ?? current.quietHours?.start ?? '22:00',
          end: updates.quietHours?.end ?? current.quietHours?.end ?? '07:00',
          exceptCritical: updates.quietHours?.exceptCritical ?? current.quietHours?.exceptCritical ?? true,
        }
      : undefined;

    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      inApp: { ...current.inApp, ...updates.inApp },
      email: { ...current.email, ...updates.email },
      sources: { ...current.sources, ...updates.sources },
      quietHours,
    };

    this.userPreferences.set(userId, updated);
    return updated;
  }

  // ===========================================================================
  // SEND NOTIFICATIONS
  // ===========================================================================

  async sendNotification(alert: Alert, userId: string): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const prefs = this.getUserPreferences(userId);

    // Check if already sent
    const sentKey = `${alert.id}:${userId}`;
    if (this.sentNotifications.has(sentKey)) {
      return results;
    }

    // Check quiet hours
    if (this.isQuietHours(prefs) && alert.priority !== AlertPriority.CRITICAL) {
      return results;
    }

    // Check source preferences
    const sourcePrefs = prefs.sources[alert.source];
    if (sourcePrefs && !sourcePrefs.enabled) {
      return results;
    }

    // Check minimum priority
    if (sourcePrefs && !this.meetsPriorityThreshold(alert.priority, sourcePrefs.minPriority)) {
      return results;
    }

    // Send in-app notification
    if (prefs.inApp.enabled) {
      if (!prefs.inApp.criticalOnly || alert.priority === AlertPriority.CRITICAL) {
        const inAppResult = await this.sendInAppNotification(alert, userId);
        results.push(inAppResult);
      }
    }

    // Send email notification
    if (prefs.email.enabled) {
      // Immediate email for critical alerts
      if (prefs.email.criticalImmediate && alert.priority === AlertPriority.CRITICAL) {
        const emailResult = await this.sendEmailNotification(alert, userId);
        results.push(emailResult);
      }
      // For other priorities, add to digest
      else if (prefs.email.frequency !== 'never') {
        this.addToDigest(alert, userId);
      }
    }

    // Mark as sent
    this.sentNotifications.add(sentKey);

    return results;
  }

  async sendInAppNotification(alert: Alert, userId: string): Promise<NotificationResult> {
    try {
      const notification: InAppNotification = {
        id: `notif-${alert.id}-${Date.now()}`,
        userId,
        alertId: alert.id,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        url: this.getAlertUrl(alert),
        isRead: false,
        createdAt: new Date(),
      };

      // Store in memory
      const userNotifications = this.inAppNotifications.get(userId) || [];
      userNotifications.unshift(notification);

      // Keep only last 100 notifications
      if (userNotifications.length > 100) {
        userNotifications.splice(100);
      }

      this.inAppNotifications.set(userId, userNotifications);

      // Log to database
      await prisma.notification.create({
        data: {
          userId,
          type: 'ALERT',
          title: alert.title,
          message: alert.message,
          priority: alert.priority === 'CRITICAL' ? 'urgent' : 'normal',
          sourceType: 'ALERT',
          sourceId: alert.id,
          contextType: alert.entities[0]?.type?.toUpperCase() || undefined,
          contextId: alert.entities[0]?.id || undefined,
          metadata: {
            alertId: alert.id,
            alertType: alert.type,
            alertPriority: alert.priority,
          },
          isRead: false,
        },
      }).catch(() => {
        // Silent fail if notification table doesn't exist
      });

      return {
        success: true,
        channel: 'inApp',
        alertId: alert.id,
        userId,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        channel: 'inApp',
        alertId: alert.id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendEmailNotification(alert: Alert, userId: string): Promise<NotificationResult> {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) {
        return {
          success: false,
          channel: 'email',
          alertId: alert.id,
          userId,
          error: 'User email not found',
        };
      }

      // Build email content
      const emailContent = this.buildEmailContent(alert);

      // In production, send via email service (SendGrid, SES, etc.)
      // For now, just log
      logger.info('[NotificationEngine] Email notification', {
        to: user.email,
        subject: emailContent.subject,
      });

      // Log to audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'EMAIL_NOTIFICATION_SENT',
          entityType: 'Alert',
          entityId: alert.id,
          metadata: JSON.stringify({
            email: user.email,
            alertType: alert.type,
            priority: alert.priority,
          }),
        },
      });

      return {
        success: true,
        channel: 'email',
        alertId: alert.id,
        userId,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        alertId: alert.id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildEmailContent(alert: Alert): { subject: string; body: string } {
    const priorityEmoji = this.getPriorityEmoji(alert.priority);
    const subject = `${priorityEmoji} [L-ERP MRP] ${alert.title}`;

    const body = `
      <h2>${alert.title}</h2>
      <p><strong>Mức độ:</strong> ${getPriorityLabel(alert.priority)}</p>
      <p><strong>Loại:</strong> ${getTypeLabel(alert.type)}</p>
      <p>${alert.message}</p>
      ${alert.aiSuggestion ? `<p><em>💡 AI Gợi ý: ${alert.aiSuggestion}</em></p>` : ''}
      <p><a href="${process.env.NEXTAUTH_URL}/ai/alerts/${alert.id}">Xem chi tiết</a></p>
    `;

    return { subject, body };
  }

  private getPriorityEmoji(priority: AlertPriority): string {
    switch (priority) {
      case AlertPriority.CRITICAL: return '🔴';
      case AlertPriority.HIGH: return '🟠';
      case AlertPriority.MEDIUM: return '🟡';
      case AlertPriority.LOW: return '🟢';
      default: return '⚪';
    }
  }

  private getAlertUrl(alert: Alert): string {
    return `/ai/alerts/${alert.id}`;
  }

  // ===========================================================================
  // IN-APP NOTIFICATION MANAGEMENT
  // ===========================================================================

  getInAppNotifications(userId: string, limit = 50): InAppNotification[] {
    const notifications = this.inAppNotifications.get(userId) || [];
    return notifications.slice(0, limit);
  }

  getUnreadCount(userId: string): number {
    const notifications = this.inAppNotifications.get(userId) || [];
    return notifications.filter(n => !n.isRead).length;
  }

  markAsRead(userId: string, notificationId: string): boolean {
    const notifications = this.inAppNotifications.get(userId);
    if (!notifications) return false;

    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return false;

    notification.isRead = true;
    return true;
  }

  markAllAsRead(userId: string): number {
    const notifications = this.inAppNotifications.get(userId);
    if (!notifications) return 0;

    let count = 0;
    for (const notification of notifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        count++;
      }
    }

    return count;
  }

  clearNotifications(userId: string): void {
    this.inAppNotifications.delete(userId);
  }

  // ===========================================================================
  // DIGEST MANAGEMENT
  // ===========================================================================

  private digestQueue: Map<string, Alert[]> = new Map();

  private addToDigest(alert: Alert, userId: string): void {
    const key = `${userId}:digest`;
    const queue = this.digestQueue.get(key) || [];
    queue.push(alert);
    this.digestQueue.set(key, queue);
  }

  scheduleDigest(userId: string, frequency: 'daily' | 'weekly', time = '09:00'): void {
    this.digestSchedules.set(userId, {
      userId,
      frequency,
      time,
      enabled: true,
    });
  }

  getDigestSchedule(userId: string): DigestSchedule | undefined {
    return this.digestSchedules.get(userId);
  }

  async sendDigest(userId: string, digest: AlertDigest): Promise<NotificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) {
        return {
          success: false,
          channel: 'email',
          alertId: 'digest',
          userId,
          error: 'User email not found',
        };
      }

      const period = digest.period === 'daily' ? 'Hàng ngày' : 'Hàng tuần';
      const subject = `📊 [L-ERP MRP] Báo cáo Alerts ${period} - ${new Date().toLocaleDateString('vi-VN')}`;

      const body = `
        <h2>📊 Báo cáo Alerts ${period}</h2>

        <h3>📈 Tóm tắt</h3>
        <p>${digest.summary}</p>

        <h3>📊 Thống kê</h3>
        <ul>
          <li>🔴 Critical: ${digest.criticalCount}</li>
          <li>🟠 High: ${digest.highCount}</li>
          <li>🟡 Medium: ${digest.mediumCount}</li>
          <li>🟢 Low: ${digest.lowCount}</li>
        </ul>

        <h3>💡 Đề xuất</h3>
        <ul>
          ${digest.recommendations.map(r => `<li>${r}</li>`).join('\n')}
        </ul>

        <p><a href="${process.env.NEXTAUTH_URL}/ai/alerts">Xem tất cả alerts</a></p>
      `;

      logger.info('[NotificationEngine] Digest email', {
        to: user.email,
        subject,
        alertCount: digest.criticalCount + digest.highCount + digest.mediumCount + digest.lowCount,
      });

      // Update last sent
      const schedule = this.digestSchedules.get(userId);
      if (schedule) {
        schedule.lastSentAt = new Date();
        this.digestSchedules.set(userId, schedule);
      }

      // Clear digest queue
      this.digestQueue.delete(`${userId}:digest`);

      return {
        success: true,
        channel: 'email',
        alertId: 'digest',
        userId,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        alertId: 'digest',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const start = prefs.quietHours.start;
    const end = prefs.quietHours.end;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }

  private meetsPriorityThreshold(
    alertPriority: AlertPriority,
    minPriority: AlertPriority
  ): boolean {
    const priorityOrder = {
      [AlertPriority.LOW]: 1,
      [AlertPriority.MEDIUM]: 2,
      [AlertPriority.HIGH]: 3,
      [AlertPriority.CRITICAL]: 4,
    };

    return priorityOrder[alertPriority] >= priorityOrder[minPriority];
  }
}

// Singleton export
export const notificationEngine = NotificationEngine.getInstance();
export const getNotificationEngine = () => NotificationEngine.getInstance();
