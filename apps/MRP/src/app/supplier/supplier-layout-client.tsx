'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  FileText,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// =============================================================================
// SUPPLIER PORTAL LAYOUT
// Separate layout for supplier self-service portal
// =============================================================================

interface SupplierProfile {
  id: string;
  name: string;
  code: string;
  rating: string | number | null;
  contactEmail: string | null;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" />, href: '/supplier' },
  { id: 'orders', label: 'Đơn hàng', icon: <ShoppingCart className="w-5 h-5" />, href: '/supplier/orders' },
  { id: 'deliveries', label: 'Giao hàng', icon: <Truck className="w-5 h-5" />, href: '/supplier/deliveries' },
  { id: 'invoices', label: 'Hóa đơn', icon: <FileText className="w-5 h-5" />, href: '/supplier/invoices' },
  { id: 'performance', label: 'Hiệu suất', icon: <BarChart3 className="w-5 h-5" />, href: '/supplier/performance' },
];

export function SupplierLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplierProfile() {
      try {
        const res = await fetch('/api/suppliers?pageSize=1&page=1');
        if (!res.ok) throw new Error('Không thể tải thông tin nhà cung cấp');
        const data = await res.json();
        const suppliers = data.data || [];
        if (suppliers.length > 0) {
          const s = suppliers[0];
          setSupplier({
            id: s.id,
            name: s.name,
            code: s.code,
            rating: s.rating,
            contactEmail: s.contactEmail,
          });
        }
      } catch (err) {
        toast.error('Lỗi tải thông tin nhà cung cấp');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSupplierProfile();
  }, []);

  const displayCode = supplier?.code || '...';
  const displayName = supplier?.name || 'Đang tải...';
  const displayEmail = supplier?.contactEmail || '';
  const displayRating = supplier?.rating != null
    ? (typeof supplier.rating === 'number'
        ? (supplier.rating >= 4 ? 'A' : supplier.rating >= 3 ? 'B' : 'C')
        : String(supplier.rating))
    : '--';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/supplier" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-gray-900 dark:text-white">Supplier Portal</p>
                <p className="text-xs text-gray-500">L-ERP MRP</p>
              </div>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <span className="text-sm font-bold text-blue-600">{displayCode.slice(0, 2)}</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{displayCode}</p>
                  <p className="text-xs text-gray-500">Rating: {displayRating}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-900 dark:text-white">{displayName}</p>
                    <p className="text-sm text-gray-500">{displayEmail}</p>
                  </div>
                  <Link
                    href="/supplier/settings"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Cài đặt</span>
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                    onClick={() => {
                      setIsProfileOpen(false);
                      // Handle logout
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40',
          'transform transition-transform duration-300 lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/supplier' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl transition-colors',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Help Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Cần hỗ trợ?</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">Liên hệ bộ phận mua hàng</p>
            <a
              href="mailto:purchasing@rtr.vn"
              className="block w-full py-2 bg-blue-600 text-white text-center text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Liên hệ
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
