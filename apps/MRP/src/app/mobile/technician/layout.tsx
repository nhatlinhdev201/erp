import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP Mobile',
    default: 'Technician',
  },
  description: 'Mobile technician portal - Equipment, maintenance, and downtime management - Cổng kỹ thuật viên di động',
};

export default function MobileTechnicianLayout({ children }: { children: React.ReactNode }) {
  return children;
}
