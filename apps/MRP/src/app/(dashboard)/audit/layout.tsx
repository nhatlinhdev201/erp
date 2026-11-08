import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Log | L-ERP MRP',
  description: 'Audit trail and system change tracking for compliance - Nhật ký kiểm toán và theo dõi thay đổi hệ thống',
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
