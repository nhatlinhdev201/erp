import type { Metadata } from 'next';
import { MobileLayoutClient } from './mobile-layout-client';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP Mobile',
    default: 'Mobile',
  },
  description: '\u1ee8ng d\u1ee5ng di \u0111\u1ed9ng L-ERP MRP - Qu\u1ea3n l\u00fd kho, qu\u00e9t m\u00e3 v\u00e0 l\u1ec7nh s\u1ea3n xu\u1ea5t',
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <MobileLayoutClient>{children}</MobileLayoutClient>;
}
