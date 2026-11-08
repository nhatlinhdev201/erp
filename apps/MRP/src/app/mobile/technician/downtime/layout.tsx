import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP Mobile',
    default: 'Downtime Tracking',
  },
  description: 'Track and report equipment downtime events - Theo dõi và báo cáo thời gian ngừng máy',
};

export default function MobileDowntimeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
