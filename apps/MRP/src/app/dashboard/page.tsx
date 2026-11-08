import type { Metadata } from 'next';
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Dashboard | L-ERP MRP',
  description: 'L-ERP MRP manufacturing dashboard overview - Tổng quan bảng điều khiển sản xuất L-ERP MRP',
};

// Redirect to main dashboard
export default function DashboardRedirect() {
  redirect("/home");
}
