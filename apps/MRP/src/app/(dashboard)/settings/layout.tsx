import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Cài đặt',
  },
  description: 'Cài đặt hệ thống, bảo mật, thông báo và sao lưu dữ liệu',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
