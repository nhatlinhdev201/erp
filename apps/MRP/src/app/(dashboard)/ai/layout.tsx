import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'AI Assistant',
  },
  description: 'Trợ lý AI thông minh - Dự báo, phân tích rủi ro và tối ưu hóa sản xuất',
};

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
