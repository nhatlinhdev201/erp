/**
 * @linkk/notifications - WebSocket server
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage as HttpIncomingMessage } from 'http';
import { Notification, NotificationPayload } from './types';
import { NotificationStore, InMemoryStore } from './store';
import { randomUUID } from 'crypto';

interface UserConnection {
  ws: WebSocket;
  userId: string;
  authenticated: boolean;
  heartbeatTimer?: NodeJS.Timeout;
}

interface AuthPayload {
  type: 'AUTH';
  token: string;
}

interface NotificationMessage {
  type: 'NOTIFICATION';
  notification: Notification;
}

interface MarkReadMessage {
  type: 'MARK_READ';
  notificationId: string;
}

interface MarkAllReadMessage {
  type: 'MARK_ALL_READ';
}

type IncomingMessage = AuthPayload | MarkReadMessage | MarkAllReadMessage;

/**
 * NotificationServer - WebSocket-based notification server
 */
export class NotificationServer {
  private wss: WebSocketServer;
  private store: NotificationStore;
  private userConnections: Map<string, UserConnection> = new Map();
  private jwtVerifier: (token: string) => string | null; // Returns userId or null if invalid
  private heartbeatInterval: number = 30000; // 30 seconds

  constructor(
    wss: WebSocketServer,
    store?: NotificationStore,
    jwtVerifier?: (token: string) => string | null
  ) {
    this.wss = wss;
    this.store = store || new InMemoryStore();
    this.jwtVerifier = jwtVerifier || (() => null);

    this.setupConnectionHandler();
  }

  private setupConnectionHandler(): void {
    this.wss.on('connection', (ws: WebSocket, req: HttpIncomingMessage) => {
      let userConnection: UserConnection = {
        ws,
        userId: '',
        authenticated: false
      };

      // Set up message handler before authentication
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as IncomingMessage;

          if (!userConnection.authenticated && message.type === 'AUTH') {
            await this.handleAuth(ws, userConnection, message as AuthPayload);
          } else if (userConnection.authenticated) {
            if (message.type === 'MARK_READ') {
              await this.handleMarkRead(userConnection.userId, message as MarkReadMessage);
            } else if (message.type === 'MARK_ALL_READ') {
              await this.handleMarkAllRead(userConnection.userId);
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        if (userConnection.userId) {
          this.userConnections.delete(userConnection.userId);
          if (userConnection.heartbeatTimer) {
            clearInterval(userConnection.heartbeatTimer);
          }
        }
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });

      // Send authentication request
      ws.send(JSON.stringify({ type: 'AUTH_REQUIRED' }));
    });
  }

  private async handleAuth(
    ws: WebSocket,
    userConnection: UserConnection,
    message: AuthPayload
  ): Promise<void> {
    const userId = this.jwtVerifier(message.token);

    if (!userId) {
      ws.send(JSON.stringify({ type: 'AUTH_FAILED' }));
      ws.close(1008, 'Authentication failed');
      return;
    }

    userConnection.authenticated = true;
    userConnection.userId = userId;
    this.userConnections.set(userId, userConnection);

    // Send authentication success
    ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId }));

    // Load unread notifications
    const notifications = await this.store.getByUser(userId);
    ws.send(JSON.stringify({ 
      type: 'SYNC_NOTIFICATIONS', 
      notifications 
    }));

    // Start heartbeat
    this.startHeartbeat(userConnection);
  }

  private startHeartbeat(userConnection: UserConnection): void {
    userConnection.heartbeatTimer = setInterval(() => {
      if (userConnection.ws.readyState === WebSocket.OPEN) {
        userConnection.ws.ping();
      } else {
        if (userConnection.heartbeatTimer) {
          clearInterval(userConnection.heartbeatTimer);
        }
      }
    }, this.heartbeatInterval);
  }

  private async handleMarkRead(userId: string, message: MarkReadMessage): Promise<void> {
    await this.store.markRead(message.notificationId);
    
    // Notify client of success
    const connection = this.userConnections.get(userId);
    if (connection?.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'READ_CONFIRMED',
        notificationId: message.notificationId
      }));
    }
  }

  private async handleMarkAllRead(userId: string): Promise<void> {
    await this.store.markAllRead(userId);
    
    // Notify client of success
    const connection = this.userConnections.get(userId);
    if (connection?.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'ALL_READ_CONFIRMED'
      }));
    }
  }

  /**
   * Send notification to specific user
   */
  async send(userId: string, payload: NotificationPayload): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      ...payload,
      userId,
      read: false,
      createdAt: new Date()
    };

    // Save to store
    await this.store.save(notification);

    // Send to connected user
    const connection = this.userConnections.get(userId);
    if (connection?.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'NOTIFICATION',
        notification
      }));
    }
  }

  /**
   * Broadcast notification to all users in a module
   */
  async broadcast(module: string, payload: NotificationPayload): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      ...payload,
      module,
      userId: '', // Will be set per user
      read: false,
      createdAt: new Date()
    };

    // Send to all connected users
    for (const [userId, connection] of this.userConnections.entries()) {
      if (!connection.authenticated) continue;

      const userNotification: Notification = {
        ...notification,
        userId,
        id: this.generateId() // Each user gets unique ID
      };

      await this.store.save(userNotification);

      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'NOTIFICATION',
          notification: userNotification
        }));
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markRead(notificationId: string): Promise<void> {
    await this.store.markRead(notificationId);
  }

  /**
   * Get active connections count
   */
  getConnectionCount(): number {
    return this.userConnections.size;
  }

  /**
   * Disconnect a user
   */
  disconnectUser(userId: string): void {
    const connection = this.userConnections.get(userId);
    if (connection) {
      connection.ws.close(1000, 'Server disconnect');
      this.userConnections.delete(userId);
      if (connection.heartbeatTimer) {
        clearInterval(connection.heartbeatTimer);
      }
    }
  }

  /**
   * Shutdown server
   */
  shutdown(): void {
    for (const [userId, connection] of this.userConnections.entries()) {
      connection.ws.close(1001, 'Server shutdown');
      if (connection.heartbeatTimer) {
        clearInterval(connection.heartbeatTimer);
      }
    }
    this.userConnections.clear();
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
