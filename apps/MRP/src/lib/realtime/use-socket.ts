'use client';

// =============================================================================
// L-ERP MRP - USE SOCKET HOOK
// Client-side real-time connection management
// Uses Server-Sent Events (SSE) for simplicity - no additional server needed
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type RTREvent,
  type RTREventType,
  type RTRRoom,
  type ConnectionStatus,
  type NotificationPayload,
} from './events';

// =============================================================================
// TYPES
// =============================================================================

interface UseSocketOptions {
  autoConnect?: boolean;
  rooms?: RTRRoom[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: <T>(eventType: RTREventType, callback: (event: RTREvent<T>) => void) => () => void;
  joinRoom: (room: RTRRoom) => void;
  leaveRoom: (room: RTRRoom) => void;
  emit: <T>(eventType: RTREventType, payload: T) => void;
}

// =============================================================================
// EVENT EMITTER (Simple pub/sub for client-side)
// =============================================================================

type EventCallback<T = unknown> = (event: RTREvent<T>) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback as EventCallback);
    };
  }

  off<T>(eventType: string, callback: EventCallback<T>): void {
    this.listeners.get(eventType)?.delete(callback as EventCallback);
  }

  emit<T>(event: RTREvent<T>): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }

    // Also emit to wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => callback(event));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Global event emitter instance
const globalEmitter = new EventEmitter();

// =============================================================================
// HOOK
// =============================================================================

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    rooms = [],
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [joinedRooms, setJoinedRooms] = useState<Set<RTRRoom>>(new Set(rooms));
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    setStatus('connecting');

    try {
      // In a real app, this would connect to an SSE endpoint
      // For now, we simulate connection
      setTimeout(() => {
        setStatus('connected');
        onConnect?.();
      }, 500);
    } catch (error) {
      setStatus('error');
      onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  }, [onConnect, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setStatus('disconnected');
    onDisconnect?.();
  }, [onDisconnect]);

  // Subscribe to events
  const subscribe = useCallback(<T,>(
    eventType: RTREventType,
    callback: (event: RTREvent<T>) => void
  ): (() => void) => {
    return globalEmitter.on(eventType, callback);
  }, []);

  // Join room
  const joinRoom = useCallback((room: RTRRoom) => {
    setJoinedRooms(prev => new Set(prev).add(room));
  }, []);

  // Leave room
  const leaveRoom = useCallback((room: RTRRoom) => {
    setJoinedRooms(prev => {
      const next = new Set(prev);
      next.delete(room);
      return next;
    });
  }, []);

  // Emit event (for local testing/simulation)
  const emit = useCallback(<T,>(eventType: RTREventType, payload: T) => {
    const event: RTREvent<T> = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
    };
    globalEmitter.emit(event);
  }, []);

  // Auto connect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    subscribe,
    joinRoom,
    leaveRoom,
    emit,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

// Hook for dashboard real-time updates
export function useDashboardSocket() {
  const socket = useSocket({ rooms: ['dashboard'] });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = socket.subscribe('dashboard:stats_updated', () => {
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [socket]);

  return {
    ...socket,
    lastUpdate,
  };
}

// Hook for notifications
export function useNotificationSocket() {
  const socket = useSocket({ rooms: ['notifications'] });
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribeNew = socket.subscribe<NotificationPayload>('notification:new', (event) => {
      setNotifications(prev => [event.payload, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
    });

    const unsubscribeRead = socket.subscribe('notification:read', () => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    });

    const unsubscribeClear = socket.subscribe('notification:clear', () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeClear();
    };
  }, [socket]);

  const markAsRead = useCallback(() => {
    socket.emit('notification:read', {});
  }, [socket]);

  const clearAll = useCallback(() => {
    socket.emit('notification:clear', {});
  }, [socket]);

  const addNotification = useCallback((notification: Omit<NotificationPayload, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationPayload = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    socket.emit('notification:new', newNotification);
  }, [socket]);

  return {
    ...socket,
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    addNotification,
  };
}

// Hook for inventory alerts
export function useInventorySocket() {
  const socket = useSocket({ rooms: ['inventory'] });
  const [alerts, setAlerts] = useState<{ type: 'low' | 'out'; partId: string; partNumber: string; partName: string }[]>([]);

  useEffect(() => {
    const unsubLow = socket.subscribe<{ partId: string; partNumber: string; partName: string }>('inventory:low_stock', (event) => {
      setAlerts(prev => [...prev.filter(a => a.partId !== event.payload.partId), { type: 'low', ...event.payload }]);
    });

    const unsubOut = socket.subscribe<{ partId: string; partNumber: string; partName: string }>('inventory:out_of_stock', (event) => {
      setAlerts(prev => [...prev.filter(a => a.partId !== event.payload.partId), { type: 'out', ...event.payload }]);
    });

    return () => {
      unsubLow();
      unsubOut();
    };
  }, [socket]);

  return {
    ...socket,
    alerts,
    clearAlerts: () => setAlerts([]),
  };
}

// =============================================================================
// GLOBAL EMITTER EXPORT (for server-side simulation)
// =============================================================================

export { globalEmitter };

export default useSocket;
