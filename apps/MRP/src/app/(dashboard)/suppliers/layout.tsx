import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Nhà cung cấp',
  },
  description: 'Quản lý nhà cung cấp, đánh giá và theo dõi hiệu suất',
};

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
