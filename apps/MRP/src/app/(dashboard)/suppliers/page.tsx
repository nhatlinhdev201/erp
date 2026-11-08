import type { Metadata } from "next";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: 'Supplier Management | L-ERP MRP',
  description: 'Manage suppliers, evaluate performance, and track contracts - Quản lý nhà cung cấp, đánh giá hiệu suất và theo dõi hợp đồng',
};

async function getSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });

  return suppliers.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    country: s.country,
    ndaaCompliant: s.ndaaCompliant,
    contactName: s.contactName,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    address: s.address,
    paymentTerms: s.paymentTerms,
    leadTimeDays: s.leadTimeDays,
    rating: s.rating,
    category: s.category,
    status: s.status,
  }));
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return <SuppliersTable initialData={suppliers} />;
}
