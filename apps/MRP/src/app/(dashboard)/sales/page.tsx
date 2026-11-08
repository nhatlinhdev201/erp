import type { Metadata } from 'next';
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Sales | L-ERP MRP',
  description: 'Sales management and revenue tracking for manufacturing operations - Quản lý bán hàng và theo dõi doanh thu sản xuất',
};

// Sales page redirects to Quotations as the main sales entry point
export default function SalesPage() {
  redirect("/sales/quotations");
}
