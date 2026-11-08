import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Create a new password for your L-ERP MRP account - Tao mat khau moi cho tai khoan L-ERP MRP',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
