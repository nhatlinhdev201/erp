/**
 * @linkk/notifications - Storage abstraction layer
 */

import { Notification } from './types';

export interface NotificationStore {
  save(notification: Notification): Promise<void>;
  getByUser(userId: string, limit?: number): Promise<Notification[]>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  getUnreadCount(userId: string): Promise<number>;
  delete(notificationId: string): Promise<void>;
}

/**
 * In-memory store for development and testing
 */
export class InMemoryStore implements NotificationStore {
  private notifications: Map<string, Notification> = new Map();
  private userNotifications: Map<string, Set<string>> = new Map();

  async save(notification: Notification): Promise<void> {
    this.notifications.set(notification.id, { ...notification });
    
    if (!this.userNotifications.has(notification.userId)) {
      this.userNotifications.set(notification.userId, new Set());
    }
    this.userNotifications.get(notification.userId)!.add(notification.id);
  }

  async getByUser(userId: string, limit: number = 50): Promise<Notification[]> {
    const userIds = this.userNotifications.get(userId) || new Set();
    const notifications = Array.from(userIds)
      .map(id => this.notifications.get(id))
      .filter((n): n is Notification => n !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return notifications;
  }

  async markRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  async markAllRead(userId: string): Promise<void> {
    const userIds = this.userNotifications.get(userId) || new Set();
    userIds.forEach(id => {
      const notification = this.notifications.get(id);
      if (notification) {
        notification.read = true;
      }
    });
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    let count = 0;
    
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
        
        // Remove from user index
        const userSet = this.userNotifications.get(notification.userId);
        if (userSet) {
          userSet.delete(id);
        }
        count++;
      }
    }
    
    return count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const userIds = this.userNotifications.get(userId) || new Set();
    let count = 0;
    
    userIds.forEach(id => {
      const notification = this.notifications.get(id);
      if (notification && !notification.read) {
        count++;
      }
    });
    
    return count;
  }

  async delete(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      this.notifications.delete(notificationId);
      
      const userSet = this.userNotifications.get(notification.userId);
      if (userSet) {
        userSet.delete(notificationId);
      }
    }
  }
}

/**
 * Redis store for production use
 * Uses Redis sorted sets for efficient user-based queries
 */
export class RedisStore implements NotificationStore {
  private redis: any; // Type as 'any' to support both redis and ioredis

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  private getUserKey(userId: string): string {
    return `notifications:${userId}`;
  }

  private getNotificationKey(notificationId: string): string {
    return `notification:${notificationId}`;
  }

  async save(notification: Notification): Promise<void> {
    const userKey = this.getUserKey(notification.userId);
    const notifKey = this.getNotificationKey(notification.id);
    
    // Store notification data
    await this.redis.setex(
      notifKey,
      notification.expiresAt 
        ? Math.floor((notification.expiresAt.getTime() - Date.now()) / 1000)
        : 86400 * 30, // 30 days default TTL
      JSON.stringify(notification)
    );
    
    // Add to user's sorted set (score = creation timestamp for ordering)
    await this.redis.zadd(
      userKey,
      notification.createdAt.getTime(),
      notification.id
    );
  }

  async getByUser(userId: string, limit: number = 50): Promise<Notification[]> {
    const userKey = this.getUserKey(userId);
    const notifIds = await this.redis.zrevrange(userKey, 0, limit - 1);
    
    const notifications: Notification[] = [];
    for (const id of notifIds) {
      const notifKey = this.getNotificationKey(id);
      const data = await this.redis.get(notifKey);
      if (data) {
        notifications.push(JSON.parse(data));
      }
    }
    
    return notifications;
  }

  async markRead(notificationId: string): Promise<void> {
    const notifKey = this.getNotificationKey(notificationId);
    const data = await this.redis.get(notifKey);
    
    if (data) {
      const notification = JSON.parse(data);
      notification.read = true;
      
      // Get remaining TTL
      const ttl = await this.redis.ttl(notifKey);
      if (ttl > 0) {
        await this.redis.setex(notifKey, ttl, JSON.stringify(notification));
      } else {
        await this.redis.set(notifKey, JSON.stringify(notification));
      }
    }
  }

  async markAllRead(userId: string): Promise<void> {
    const userKey = this.getUserKey(userId);
    const notifIds = await this.redis.zrange(userKey, 0, -1);
    
    for (const id of notifIds) {
      await this.markRead(id);
    }
  }

  async deleteExpired(): Promise<number> {
    // In Redis, TTL is handled automatically
    // This is a placeholder for manual cleanup if needed
    return 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getByUser(userId, 1000);
    return notifications.filter(n => !n.read).length;
  }

  async delete(notificationId: string): Promise<void> {
    const notifKey = this.getNotificationKey(notificationId);
    await this.redis.del(notifKey);
    
    // Note: cleanup from sorted sets would require scanning all users
    // For production, consider a background job or use a different key structure
  }
}
