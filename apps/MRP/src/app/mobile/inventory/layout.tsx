import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP Mobile',
    default: 'Inventory',
  },
  description: 'Mobile inventory management - Stock lookup, adjustments, and transfers - Quản lý tồn kho trên di động',
};

export default function MobileInventoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
