import type { Metadata } from 'next';
import { PartsTable } from '@/components/parts/parts-table';
import { SmartLayout } from '@/components/ui-v2/smart-layout';

export const metadata: Metadata = {
  title: 'Parts & Materials | L-ERP MRP',
  description: 'Manage parts catalog, components, and raw materials - Quản lý danh mục vật tư, linh kiện và nguyên vật liệu',
};

export default function PartsPage() {
  return (
    <SmartLayout>
      <PartsTable />
    </SmartLayout>
  );
}
