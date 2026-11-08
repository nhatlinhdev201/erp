/**
 * @linkk/notifications - Browser WebSocket client
 */

import { Notification } from './types';

interface ConnectOptions {
  token: string;
  url?: string;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

interface NotificationHandler {
  (notification: Notification): void;
}

/**
 * NotificationClient - Browser-side WebSocket client
 */
export class NotificationClient {
  private ws: WebSocket | null = null;
  private token: string = '';
  private url: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Initial delay in ms
  private maxReconnectDelay: number = 30000; // Max delay in ms
  private listeners: Set<NotificationHandler> = new Set();
  private notifications: Map<string, Notification> = new Map();
  private onConnectionChange?: (connected: boolean) => void;
  private onError?: (error: Error) => void;
  private messageQueue: unknown[] = [];
  private pingTimer?: NodeJS.Timeout;

  async connect(options: ConnectOptions): Promise<void> {
    this.token = options.token;
    this.url = options.url || this.getWebSocketUrl();
    this.onConnectionChange = options.onConnectionChange;
    this.onError = options.onError;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Send authentication
          this.send({ type: 'AUTH', token: this.token });

          // Process queued messages
          this.processMessageQueue();
          this.onConnectionChange?.(true);
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (event: Event) => {
          const error = new Error('WebSocket error');
          this.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.onConnectionChange?.(false);
          this.clearPingTimer();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/notifications`;
  }

  private handleMessage(data: Record<string, unknown>): void {
    const type = data.type as string;

    switch (type) {
      case 'AUTH_REQUIRED':
        // Server requesting auth (shouldn't happen after initial connect)
        this.send({ type: 'AUTH', token: this.token });
        break;

      case 'AUTH_SUCCESS':
        console.log('Authentication successful');
        break;

      case 'AUTH_FAILED':
        this.onError?.(new Error('Authentication failed'));
        this.disconnect();
        break;

      case 'SYNC_NOTIFICATIONS':
        {
          const notifications = data.notifications as Notification[];
          notifications.forEach(n => {
            this.notifications.set(n.id, n);
            this.notifyListeners(n);
          });
        }
        break;

      case 'NOTIFICATION':
        {
          const notification = data.notification as Notification;
          this.notifications.set(notification.id, notification);
          this.notifyListeners(notification);
        }
        break;

      case 'READ_CONFIRMED':
        {
          const notificationId = data.notificationId as string;
          const notif = this.notifications.get(notificationId);
          if (notif) {
            notif.read = true;
          }
        }
        break;

      case 'ALL_READ_CONFIRMED':
        this.notifications.forEach(n => {
          n.read = true;
        });
        break;
    }
  }

  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect({
        token: this.token,
        url: this.url,
        onConnectionChange: this.onConnectionChange,
        onError: this.onError
      }).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private send(message: unknown): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }

  /**
   * Register a notification listener
   */
  onNotification(handler: NotificationHandler): () => void {
    this.listeners.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(handler);
    };
  }

  /**
   * Mark a notification as read
   */
  markRead(notificationId: string): void {
    this.send({
      type: 'MARK_READ',
      notificationId
    });
  }

  /**
   * Mark all notifications as read
   */
  markAllRead(): void {
    this.send({
      type: 'MARK_ALL_READ'
    });
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return Array.from(this.notifications.values()).filter(n => !n.read);
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.clearPingTimer();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}

/**
 * React hook for notifications
 */
export interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  connected: boolean;
}

export function useNotifications(client: NotificationClient): UseNotificationsResult {
  // This is a client-side hook pattern
  // In real usage, this would use React.useState and React.useEffect
  
  return {
    notifications: client.getNotifications(),
    unreadCount: client.getUnreadCount(),
    markRead: (id: string) => client.markRead(id),
    markAllRead: () => client.markAllRead(),
    connected: true // Would be managed by useState in real implementation
  };
}
