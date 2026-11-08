import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'MRP Planning | L-ERP MRP',
  },
  description: 'Material requirements planning, production scheduling, and procurement planning - Hoạch định nhu cầu vật tư, lập kế hoạch sản xuất và mua hàng',
};

export default function MrpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
