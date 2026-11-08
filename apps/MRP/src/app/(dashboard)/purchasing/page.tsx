import type { Metadata } from 'next';
import { PurchaseOrdersTable } from '@/components/purchasing/purchase-orders-table';

export const metadata: Metadata = {
  title: 'Purchase Orders | L-ERP MRP',
  description: 'Manage purchase orders, create POs, track deliveries, and approve procurement - Quản lý đơn mua hàng, tạo PO, theo dõi và phê duyệt',
};

export default function PurchasingPage() {
  return <PurchaseOrdersTable />;
}
