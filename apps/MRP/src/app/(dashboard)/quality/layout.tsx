import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Quality Management | L-ERP MRP',
  },
  description: 'Quality inspections, NCR, CAPA, and lot traceability management - Kiểm tra chất lượng, NCR, CAPA và truy xuất nguồn gốc',
};

export default function QualityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
