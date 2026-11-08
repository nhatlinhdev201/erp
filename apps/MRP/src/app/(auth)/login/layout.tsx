import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to L-ERP MRP manufacturing resource planning system - Dang nhap vao he thong quan ly san xuat L-ERP MRP',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
