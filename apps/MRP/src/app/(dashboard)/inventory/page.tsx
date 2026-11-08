import type { Metadata } from 'next';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { SmartLayout } from '@/components/ui-v2/smart-layout';

export const metadata: Metadata = {
  title: 'Inventory Management | L-ERP MRP',
  description: 'Track and manage inventory levels, stock movements, and warehouse operations - Quản lý tồn kho, theo dõi số lượng, vị trí và trạng thái hàng hóa',
};

export default function InventoryPage() {
  return (
    <SmartLayout>
      <InventoryTable />
    </SmartLayout>
  );
}
