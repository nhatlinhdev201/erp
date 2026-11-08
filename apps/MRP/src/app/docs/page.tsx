// =============================================================================
// L-ERP MRP - DOCUMENTATION PAGE (Medusa-style Design)
// Premium Vietnamese UI with modern minimalist aesthetics
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Tài liệu',
  description: 'Tài liệu hướng dẫn sử dụng hệ thống L-ERP MRP',
};
import {
  ChevronLeft,
  BookOpen,
  Terminal,
  Code,
  Network,
  Database,
  Server,
  Settings,
  CloudUpload,
  Search,
  Github,
  ArrowRight,
  Layers,
  Globe,
  Play,
} from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';

// Read markdown files at build time
async function getDocsContent() {
  const docsPath = path.join(process.cwd(), 'docs');

  const docs = [
    { id: 'readme', file: 'README.md', title: 'Tổng quan', titleEn: 'Overview', icon: 'BookOpen' },
    { id: 'setup', file: 'SETUP.md', title: 'Hướng dẫn cài đặt', titleEn: 'Setup Guide', icon: 'Terminal' },
    { id: 'api', file: 'API.md', title: 'Tài liệu API', titleEn: 'API Reference', icon: 'Code' },
    { id: 'architecture', file: 'ARCHITECTURE.md', title: 'Kiến trúc hệ thống', titleEn: 'Architecture', icon: 'Network' },
    { id: 'components', file: 'COMPONENTS.md', title: 'Thành phần', titleEn: 'Components', icon: 'Database' },
    { id: 'deployment', file: 'DEPLOYMENT.md', title: 'Triển khai', titleEn: 'Deployment', icon: 'CloudUpload' },
    { id: 'operations', file: 'OPERATIONS.md', title: 'Vận hành', titleEn: 'Operations', icon: 'Settings' },
    { id: 'backup', file: 'BACKUP-RESTORE.md', title: 'Sao lưu & Phục hồi', titleEn: 'Backup & Restore', icon: 'Server' },
  ];

  const contents: Record<string, string> = {};

  for (const doc of docs) {
    const filePath = path.join(docsPath, doc.file);
    try {
      contents[doc.id] = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'docs-page', file: doc.file });
      contents[doc.id] = `# ${doc.title}\n\nTài liệu đang được cập nhật...`;
    }
  }

  return { docs, contents };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Terminal,
  Code,
  Network,
  Database,
  Server,
  Settings,
  CloudUpload,
};

// =============================================================================
// DOCS HEADER
// =============================================================================

function DocsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Back */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
                <span className="text-[10px] font-bold text-white tracking-tight">RTR</span>
              </div>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-[14px] font-medium text-gray-900">Tài liệu</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                aria-label="Tìm kiếm tài liệu"
                className="w-full pl-10 pr-4 py-2 text-[14px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/lerp-mrp"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="font-medium">2.4k</span>
            </a>
            <Link
              href="/login"
              className="px-4 py-2 text-[14px] font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
            >
              Bắt đầu
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// DOCS HERO
// =============================================================================

function DocsHero() {
  return (
    <section className="pt-32 pb-16 border-b border-gray-200 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[14px] text-gray-600 mb-4">
            <BookOpen className="w-4 h-4" />
            <span>Tài liệu L-ERP MRP</span>
          </div>
          <h1 className="text-[36px] lg:text-[48px] font-semibold leading-[1.1] tracking-[-0.02em] text-gray-900 mb-6">
            Tài liệu hướng dẫn
          </h1>
          <p className="text-[17px] text-gray-600 leading-relaxed mb-8">
            Hướng dẫn chi tiết giúp bạn cài đặt, tùy chỉnh và triển khai
            hệ thống L-ERP MRP.
          </p>

          {/* Quick Start Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="#setup"
              className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Play className="w-5 h-5 text-gray-700" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Bắt đầu nhanh</h3>
              <p className="text-[13px] text-gray-600">Cài đặt và chạy trong 5 phút</p>
            </Link>

            <Link
              href="#api"
              className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Code className="w-5 h-5 text-gray-700" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">API Reference</h3>
              <p className="text-[13px] text-gray-600">Tài liệu đầy đủ các endpoints</p>
            </Link>

            <Link
              href="#architecture"
              className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Layers className="w-5 h-5 text-gray-700" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Kiến trúc</h3>
              <p className="text-[13px] text-gray-600">Hiểu cách hệ thống hoạt động</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// DOCS SIDEBAR
// =============================================================================

interface DocItem {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
}

function DocsSidebar({ docs }: { docs: DocItem[] }) {
  const sections = [
    {
      title: 'Bắt đầu',
      items: docs.filter(d => ['readme', 'setup'].includes(d.id)),
    },
    {
      title: 'Hướng dẫn',
      items: docs.filter(d => ['api', 'architecture', 'components'].includes(d.id)),
    },
    {
      title: 'Triển khai',
      items: docs.filter(d => ['deployment', 'operations', 'backup'].includes(d.id)),
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16 overflow-y-auto bg-gray-50">
      <nav className="p-6 space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((doc) => {
                const IconComponent = iconMap[doc.icon];
                return (
                  <a
                    key={doc.id}
                    href={`#${doc.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-gray-700 hover:text-gray-900 hover:bg-white transition-all group"
                  >
                    {IconComponent && (
                      <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    )}
                    <span>{doc.title}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}

        {/* Resources */}
        <div>
          <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tài nguyên
          </div>
          <div className="space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-gray-700 hover:text-gray-900 hover:bg-white transition-all"
            >
              <Github className="w-4 h-4 text-gray-500" />
              <span>GitHub</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-gray-700 hover:text-gray-900 hover:bg-white transition-all"
            >
              <Globe className="w-4 h-4 text-gray-500" />
              <span>Cộng đồng</span>
            </a>
          </div>
        </div>

        {/* Version */}
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="text-[11px] text-gray-500 mb-1">Phiên bản</div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono font-semibold text-gray-900">v2.0.0</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
              Mới nhất
            </span>
          </div>
        </div>
      </nav>
    </aside>
  );
}

// =============================================================================
// MAIN DOCS PAGE
// =============================================================================

export default async function DocsPage() {
  const { docs, contents } = await getDocsContent();

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <DocsHeader />

      <main className="pt-16">
        <DocsHero />

        <div className="max-w-[1400px] mx-auto flex">
          <DocsSidebar docs={docs} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {docs.map((doc) => (
              <section
                key={doc.id}
                id={doc.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                {/* Section Header */}
                <div className="sticky top-16 z-10 bg-white border-b border-gray-200 px-8 lg:px-12 py-4">
                  <div className="flex items-center gap-3">
                    {iconMap[doc.icon] && (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        {(() => {
                          const IconComp = iconMap[doc.icon];
                          return <IconComp className="w-4 h-4 text-gray-600" />;
                        })()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-[16px] font-medium text-gray-900">{doc.title}</h2>
                      <p className="text-[13px] text-gray-500">{doc.titleEn}</p>
                    </div>
                  </div>
                </div>

                {/* Markdown Content */}
                <div className="px-8 lg:px-12 py-8 bg-white">
                  <div className="prose prose-gray max-w-none
                    prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-gray-900
                    prose-h1:text-[24px] prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-4 prose-h1:mb-6
                    prose-h2:text-[20px] prose-h2:mt-10 prose-h2:mb-4
                    prose-h3:text-[17px] prose-h3:mt-8 prose-h3:mb-3
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-[15px]
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-code:text-gray-900 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none prose-code:font-mono
                    prose-pre:bg-gray-100 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-pre:text-[13px]
                    prose-table:border-collapse prose-table:w-full
                    prose-th:bg-gray-100 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-[13px] prose-th:font-semibold prose-th:text-gray-900 prose-th:border prose-th:border-gray-200
                    prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-gray-200 prose-td:text-[14px] prose-td:text-gray-700
                    prose-li:text-gray-700 prose-li:marker:text-gray-500 prose-li:text-[15px]
                    prose-ul:my-4 prose-ol:my-4
                    prose-hr:border-gray-200 prose-hr:my-8
                    prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-gray-700
                    prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-img:shadow-sm
                  ">
                    <MarkdownRenderer content={contents[doc.id]} />
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black dark:bg-white rounded flex items-center justify-center">
              <span className="text-[8px] font-bold text-white dark:text-gray-900 tracking-tight">RTR</span>
            </div>
            <span className="text-[13px] text-gray-600">© 2024 L-ERP MRP. Đã đăng ký bản quyền.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
              Điều khoản
            </a>
            <a href="#" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
              Bảo mật
            </a>
            <a href="#" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
              Liên hệ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
