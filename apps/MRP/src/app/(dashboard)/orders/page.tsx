import type { Metadata } from 'next';
import { OrdersTable } from '@/components/orders/orders-table';
import { SmartLayout } from '@/components/ui-v2/smart-layout';

export const metadata: Metadata = {
  title: 'Sales Orders | L-ERP MRP',
  description: 'Create, track, and process manufacturing sales orders - Quản lý đơn hàng sản xuất, tạo, theo dõi và xử lý đơn hàng',
};

export default function OrdersPage() {
  return (
    <SmartLayout>
      <OrdersTable />
    </SmartLayout>
  );
}
