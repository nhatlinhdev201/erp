import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'Discussions | L-ERP MRP',
  },
  description: 'Internal discussions, information exchange, and team collaboration - Thảo luận nội bộ, trao đổi thông tin và cộng tác nhóm',
};

export default function DiscussionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
