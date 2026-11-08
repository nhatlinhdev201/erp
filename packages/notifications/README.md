# @linkk/notifications

Real-time notification system for L-ERP with WebSocket support.

---

**English** | [Tiếng Việt](#tiếng-việt)

## Overview

`@linkk/notifications` provides a complete notification infrastructure for the L-ERP platform:

- **Real-time delivery** via WebSocket
- **Room-based subscriptions** — each user has their own notification room
- **Persistent storage** with in-memory and Redis backends
- **Auto-reconnection** with exponential backoff
- **Bilingual templates** for common business events
- **Multiple channels** — in-app, email, SMS, push notifications
- **TypeScript strict mode** — fully typed interfaces

## Installation

```bash
npm install @linkk/notifications ws
```

## Server Setup

### Basic WebSocket Server

```typescript
import express from 'express';
import { WebSocketServer } from 'ws';
import { NotificationServer, InMemoryStore } from '@linkk/notifications';
import http from 'http';

const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws/notifications' });

// JWT token verifier
function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

// Initialize notification server
const notificationServer = new NotificationServer(
  wss,
  new InMemoryStore(),
  verifyToken
);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Production with Redis

```typescript
import { createClient } from 'redis';
import { NotificationServer, RedisStore } from '@linkk/notifications';

const redisClient = createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

await redisClient.connect();

const store = new RedisStore(redisClient);
const notificationServer = new NotificationServer(wss, store, verifyToken);
```

### Sending Notifications

```typescript
import { 
  invoiceCreated, 
  NotificationPriority,
  NotificationChannel 
} from '@linkk/notifications';

// Use predefined template
await notificationServer.send(userId, invoiceCreated({
  id: 'inv-001',
  number: 'INV-2024-001',
  amount: 5000000
}, 'vi'));

// Or create custom notification
await notificationServer.send(userId, {
  type: NotificationType.INFO,
  priority: NotificationPriority.MEDIUM,
  title: 'Custom Notification',
  body: 'This is a custom notification',
  module: 'custom',
  channels: [NotificationChannel.IN_APP],
  actionUrl: '/some-action'
});
```

### Broadcasting to Multiple Users

```typescript
// Broadcast to all users in accounting module
await notificationServer.broadcast('accounting', invoiceCreated({
  id: 'inv-002',
  number: 'INV-2024-002',
  amount: 10000000
}, 'vi'));
```

## Client Setup

### React Component

```typescript
import { NotificationClient, Notification } from '@linkk/notifications';
import { useEffect, useState } from 'react';

const client = new NotificationClient();

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to server
    client.connect({
      token: getAuthToken(),
      onConnectionChange: setConnected,
      onError: (error) => console.error('Notification error:', error)
    });

    // Listen for new notifications
    const unsubscribe = client.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(client.getUnreadCount());
    });

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      <div>
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={notif.read ? 'read' : 'unread'}
            onClick={() => client.markRead(notif.id)}
          >
            <h3>{notif.title}</h3>
            <p>{notif.body}</p>
            {notif.actionUrl && (
              <a href={notif.actionUrl}>View</a>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => client.markAllRead()}>
        Mark all as read
      </button>
    </div>
  );
}
```

### Using Hooks

```typescript
import { useNotifications, NotificationClient } from '@linkk/notifications';

export function NotificationBell({ client }: { client: NotificationClient }) {
  const { unreadCount, markRead } = useNotifications(client);

  return (
    <div className="notification-bell">
      <span className="count">{unreadCount}</span>
    </div>
  );
}
```

## Available Templates

### invoiceCreated

```typescript
import { invoiceCreated } from '@linkk/notifications';

invoiceCreated({
  id: 'inv-001',
  number: 'INV-2024-001',
  amount: 5000000
}, 'vi') // 'vi' | 'en'
```

Output (Vietnamese):
- **Title**: Hoá đơn mới #INV-2024-001
- **Body**: Hoá đơn INV-2024-001 vừa được tạo với số tiền 5,000,000 ₫

### orderPlaced

```typescript
import { orderPlaced } from '@linkk/notifications';

orderPlaced({
  id: 'ord-001',
  number: 'ORD-001',
  customerName: 'Nguyễn Văn A'
}, 'vi')
```

Output (Vietnamese):
- **Title**: Đơn hàng mới #ORD-001
- **Body**: Đơn hàng mới #ORD-001 từ Nguyễn Văn A

### leaveApproved

```typescript
import { leaveApproved } from '@linkk/notifications';

leaveApproved({
  id: 'leave-001',
  startDate: '15/04/2024',
  endDate: '17/04/2024'
}, 'vi')
```

Output (Vietnamese):
- **Title**: Đơn nghỉ phép được duyệt
- **Body**: Đơn nghỉ phép của bạn từ 15/04/2024 đến 17/04/2024 đã được duyệt

### taskAssigned

```typescript
import { taskAssigned } from '@linkk/notifications';

taskAssigned({
  id: 'task-001',
  title: 'Thiết kế giao diện'
}, 'vi')
```

Output (Vietnamese):
- **Title**: Bạn được giao task mới
- **Body**: Bạn được giao task: Thiết kế giao diện

### stockLow

```typescript
import { stockLow } from '@linkk/notifications';

stockLow({
  id: 'prod-001',
  name: 'Sản phẩm ABC',
  stock: 5
}, 'vi')
```

Output (Vietnamese):
- **Title**: ⚠️ Tồn kho thấp
- **Body**: Tồn kho thấp: Sản phẩm ABC còn 5 đơn vị

### paymentReceived

```typescript
import { paymentReceived } from '@linkk/notifications';

paymentReceived({
  id: 'pay-001',
  amount: 10000000,
  companyName: 'Công ty XYZ'
}, 'vi')
```

Output (Vietnamese):
- **Title**: Thanh toán đã nhận
- **Body**: Thanh toán 10,000,000 ₫ từ Công ty XYZ

## Custom Notifications

Use `NotificationBuilder` for custom notifications:

```typescript
import { NotificationBuilder, NotificationType, NotificationPriority } from '@linkk/notifications';

const notification = new NotificationBuilder()
  .setType(NotificationType.WARNING)
  .setPriority(NotificationPriority.HIGH)
  .setTitle('System Maintenance')
  .setBody('Scheduled maintenance will occur tonight')
  .setModule('system')
  .setChannels([NotificationChannel.IN_APP, NotificationChannel.EMAIL])
  .setActionUrl('/maintenance')
  .setMetadata({ maintenanceId: 'maint-001' })
  .build();

await notificationServer.send(userId, notification);
```

## API Reference

### NotificationServer

```typescript
class NotificationServer {
  // Send to specific user
  send(userId: string, payload: NotificationPayload): Promise<void>

  // Broadcast to all users in a module
  broadcast(module: string, payload: NotificationPayload): Promise<void>

  // Mark notification as read
  markRead(notificationId: string): Promise<void>

  // Get active connection count
  getConnectionCount(): number

  // Disconnect user
  disconnectUser(userId: string): void

  // Shutdown server
  shutdown(): void
}
```

### NotificationClient

```typescript
class NotificationClient {
  // Connect to server
  connect(options: ConnectOptions): Promise<void>

  // Register listener for new notifications
  onNotification(handler: NotificationHandler): () => void

  // Mark single notification as read
  markRead(notificationId: string): void

  // Mark all as read
  markAllRead(): void

  // Get unread notifications
  getUnread(): Notification[]

  // Get all notifications
  getNotifications(): Notification[]

  // Get unread count
  getUnreadCount(): number

  // Disconnect from server
  disconnect(): void
}
```

### NotificationStore

Implement custom stores by extending `NotificationStore`:

```typescript
interface NotificationStore {
  save(notification: Notification): Promise<void>;
  getByUser(userId: string, limit?: number): Promise<Notification[]>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  getUnreadCount(userId: string): Promise<number>;
  delete(notificationId: string): Promise<void>;
}
```

## WebSocket Message Format

### Client → Server

```json
{
  "type": "AUTH",
  "token": "jwt-token"
}
```

```json
{
  "type": "MARK_READ",
  "notificationId": "notif-123"
}
```

```json
{
  "type": "MARK_ALL_READ"
}
```

### Server → Client

```json
{
  "type": "AUTH_REQUIRED"
}
```

```json
{
  "type": "AUTH_SUCCESS",
  "userId": "user-123"
}
```

```json
{
  "type": "SYNC_NOTIFICATIONS",
  "notifications": [...]
}
```

```json
{
  "type": "NOTIFICATION",
  "notification": {...}
}
```

---

## Tiếng Việt

# @linkk/notifications

Hệ thống thông báo thời gian thực cho L-ERP với hỗ trợ WebSocket.

## Tổng Quan

`@linkk/notifications` cung cấp cơ sở hạ tầng thông báo hoàn chỉnh cho nền tảng L-ERP:

- **Gửi thông báo real-time** qua WebSocket
- **Đăng ký theo phòng** — mỗi người dùng có phòng thông báo riêng
- **Lưu trữ lâu dài** với backend in-memory và Redis
- **Tự động kết nối lại** với exponential backoff
- **Mẫu đa ngôn ngữ** cho các sự kiện kinh doanh phổ biến
- **Nhiều kênh** — trong ứng dụng, email, SMS, push
- **TypeScript strict mode** — giao diện đầy đủ kiểu dữ liệu

## Cài Đặt

```bash
npm install @linkk/notifications ws
```

## Thiết Lập Server

### WebSocket Server Cơ Bản

```typescript
import express from 'express';
import { WebSocketServer } from 'ws';
import { NotificationServer, InMemoryStore } from '@linkk/notifications';
import http from 'http';

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws/notifications' });

function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

const notificationServer = new NotificationServer(
  wss,
  new InMemoryStore(),
  verifyToken
);

server.listen(3000);
```

### Production với Redis

```typescript
import { createClient } from 'redis';
import { NotificationServer, RedisStore } from '@linkk/notifications';

const redisClient = createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

await redisClient.connect();

const store = new RedisStore(redisClient);
const notificationServer = new NotificationServer(wss, store, verifyToken);
```

### Gửi Thông Báo

```typescript
import { invoiceCreated } from '@linkk/notifications';

// Sử dụng mẫu có sẵn
await notificationServer.send(userId, invoiceCreated({
  id: 'inv-001',
  number: 'INV-2024-001',
  amount: 5000000
}, 'vi'));
```

### Phát Sóng Thông Báo

```typescript
// Gửi đến tất cả người dùng trong module accounting
await notificationServer.broadcast('accounting', invoiceCreated({
  id: 'inv-002',
  number: 'INV-2024-002',
  amount: 10000000
}, 'vi'));
```

## Thiết Lập Client

### React Component

```typescript
import { NotificationClient } from '@linkk/notifications';
import { useEffect, useState } from 'react';

const client = new NotificationClient();

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    client.connect({
      token: getAuthToken(),
      onConnectionChange: (connected) => console.log('Connected:', connected)
    });

    const unsubscribe = client.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Thông Báo ({client.getUnreadCount()})</h2>
      {notifications.map(notif => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.body}</p>
        </div>
      ))}
    </div>
  );
}
```

## Mẫu Có Sẵn

### invoiceCreated (Hoá đơn được tạo)

```typescript
invoiceCreated({
  id: 'inv-001',
  number: 'INV-2024-001',
  amount: 5000000
}, 'vi')
```

Output:
- **Tiêu đề**: Hoá đơn mới #INV-2024-001
- **Nội dung**: Hoá đơn INV-2024-001 vừa được tạo với số tiền 5,000,000 ₫

### orderPlaced (Đơn hàng được đặt)

```typescript
orderPlaced({
  id: 'ord-001',
  number: 'ORD-001',
  customerName: 'Nguyễn Văn A'
}, 'vi')
```

### leaveApproved (Đơn nghỉ được duyệt)

```typescript
leaveApproved({
  id: 'leave-001',
  startDate: '15/04/2024',
  endDate: '17/04/2024'
}, 'vi')
```

### taskAssigned (Task được giao)

```typescript
taskAssigned({
  id: 'task-001',
  title: 'Thiết kế giao diện'
}, 'vi')
```

### stockLow (Tồn kho thấp)

```typescript
stockLow({
  id: 'prod-001',
  name: 'Sản phẩm ABC',
  stock: 5
}, 'vi')
```

### paymentReceived (Thanh toán nhận được)

```typescript
paymentReceived({
  id: 'pay-001',
  amount: 10000000,
  companyName: 'Công ty XYZ'
}, 'vi')
```

## License

MIT
