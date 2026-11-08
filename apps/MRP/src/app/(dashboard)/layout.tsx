import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

// All dashboard pages require auth + DB — disable static generation
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Tổng quan',
  },
  description: 'Bảng điều khiển quản lý sản xuất L-ERP MRP',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Auth may fail without DB — allow demo mode
  }

  if (!session && process.env.NODE_ENV === 'production') {
    redirect("/login");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
