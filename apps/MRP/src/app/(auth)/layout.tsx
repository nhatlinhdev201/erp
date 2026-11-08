import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Sign In | L-ERP MRP',
  },
  description: 'Sign in to L-ERP MRP manufacturing resource planning system - Đăng nhập vào hệ thống quản lý sản xuất L-ERP MRP',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
