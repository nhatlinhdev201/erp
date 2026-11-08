import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | L-ERP MRP',
  description: 'Manufacturing dashboard with KPIs, production status, and real-time alerts - Bảng điều khiển sản xuất với KPI, trạng thái và cảnh báo thời gian thực',
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
