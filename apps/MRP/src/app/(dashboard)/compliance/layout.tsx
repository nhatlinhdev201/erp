import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance | L-ERP MRP',
  description: 'Regulatory compliance management, ITAR controls, and quality standards - Quản lý tuân thủ quy định, kiểm soát ITAR và tiêu chuẩn chất lượng',
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
