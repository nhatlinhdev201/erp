import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Reports | L-ERP MRP',
  },
  description: 'Production, inventory, financial, and automated reports - Báo cáo sản xuất, tồn kho, tài chính và báo cáo tự động',
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
