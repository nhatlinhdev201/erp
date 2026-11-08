import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Customer Portal | L-ERP MRP',
  },
  description: 'Customer portal dashboard - Overview of orders, deliveries, invoices, and support - Cổng khách hàng L-ERP MRP',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
