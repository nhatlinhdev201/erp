import type { Metadata } from "next";
import { CustomersTable } from "@/components/customers/customers-table";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: 'Customer Management | L-ERP MRP',
  description: 'Manage customer information, orders, and transaction history - Quản lý khách hàng, thông tin đơn hàng và lịch sử giao dịch',
};

async function getCustomers() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    type: c.type,
    country: c.country,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    billingAddress: c.billingAddress,
    paymentTerms: c.paymentTerms,
    creditLimit: c.creditLimit,
    status: c.status,
  }));
}

export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomersTable initialData={customers} />;
}
