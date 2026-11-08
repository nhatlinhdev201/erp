'use client';

import {
  HelpCircle, Book, MessageCircle, Video, FileText,
  ExternalLink, Search, Keyboard, Zap, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Mở tìm kiếm nhanh' },
  { keys: ['⌘', 'J'], description: 'Mở AI Copilot' },
  { keys: ['⌘', 'N'], description: 'Tạo mới' },
  { keys: ['⌘', ','], description: 'Cài đặt' },
  { keys: ['Esc'], description: 'Đóng dialog/modal' },
];

const resources = [
  {
    icon: Book,
    title: 'Tài liệu hướng dẫn',
    description: 'Hướng dẫn chi tiết cách sử dụng hệ thống',
    link: '/help/docs',
    comingSoon: true,
  },
  {
    icon: Video,
    title: 'Video tutorials',
    description: 'Xem video hướng dẫn từng bước',
    link: '/help/videos',
    comingSoon: true,
  },
  {
    icon: FileText,
    title: 'FAQ',
    description: 'Câu hỏi thường gặp',
    link: '/help/faq',
    comingSoon: true,
  },
  {
    icon: MessageCircle,
    title: 'Hỗ trợ trực tuyến',
    description: 'Chat với đội ngũ hỗ trợ',
    link: 'mailto:support@rtr.vn',
    comingSoon: false,
  },
];

const quickTips = [
  'Sử dụng AI Copilot (⌘J) để hỏi bất kỳ câu hỏi nào về hệ thống',
  'Bấm vào biểu tượng chuông để xem thông báo mới',
  'Tìm kiếm nhanh bằng ⌘K để điều hướng nhanh đến bất kỳ trang nào',
  'Bật chế độ tối trong menu người dùng để bảo vệ mắt',
  'Export dữ liệu từ bất kỳ bảng nào bằng nút Export',
];

export default function HelpPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
          <HelpCircle className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Trung tâm trợ giúp
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Tìm câu trả lời và hỗ trợ cho L-ERP MRP
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Tìm kiếm trợ giúp..."
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <Card key={resource.title} className={`transition-shadow ${resource.comingSoon ? 'opacity-75' : 'hover:shadow-md cursor-pointer'} group`}>
            {resource.comingSoon ? (
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <resource.icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {resource.title}
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-normal">Sắp ra mắt</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            ) : (
              <a href={resource.link}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                      <resource.icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        {resource.title}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </a>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Phím tắt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <kbd
                        key={i}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * Trên Windows, thay ⌘ bằng Ctrl
            </p>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Mẹo nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {quickTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-primary-500 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Cần hỗ trợ thêm?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Liên hệ đội ngũ hỗ trợ của chúng tôi
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:support@rtr.vn"
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                support@rtr.vn
              </a>
              <a
                href="tel:+84123456789"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Gọi hỗ trợ
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <p className="text-center text-xs text-gray-400">
        L-ERP MRP v1.0.0 · L-ERP © 2024
      </p>
    </div>
  );
}
