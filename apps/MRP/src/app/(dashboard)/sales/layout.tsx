import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sales | L-ERP MRP',
  description: 'Sales management and revenue tracking for manufacturing operations - Quản lý bán hàng và theo dõi doanh thu sản xuất',
};

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
