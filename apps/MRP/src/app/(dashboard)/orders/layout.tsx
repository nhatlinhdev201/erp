import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Đơn hàng',
  },
  description: 'Quản lý đơn hàng bán, đơn đặt hàng và theo dõi tiến độ',
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
