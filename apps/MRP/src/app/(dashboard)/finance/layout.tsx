import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Tài chính',
  },
  description: 'Quản lý tài chính, chi phí sản xuất, hóa đơn và báo cáo tài chính',
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
