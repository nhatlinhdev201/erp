import type { Metadata } from 'next';
import { PortalLayoutClient } from './portal-layout-client';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Cổng khách hàng',
  },
  description: 'Cổng thông tin khách hàng và nhà cung cấp L-ERP MRP',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutClient>{children}</PortalLayoutClient>;
}
