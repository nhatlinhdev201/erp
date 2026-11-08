import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | L-ERP MRP',
  description: 'Manage notifications and system alerts - Quản lý thông báo và cảnh báo hệ thống',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
