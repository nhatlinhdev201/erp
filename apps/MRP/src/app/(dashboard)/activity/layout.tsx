import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity Log | L-ERP MRP',
  description: 'Track activity history and system event logs - Theo dõi lịch sử hoạt động và nhật ký sự kiện hệ thống',
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
