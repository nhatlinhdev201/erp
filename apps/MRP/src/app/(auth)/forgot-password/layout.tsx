import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your L-ERP MRP account password - Dat lai mat khau tai khoan L-ERP MRP',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
