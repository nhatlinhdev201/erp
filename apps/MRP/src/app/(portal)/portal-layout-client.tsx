'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, FileText, BarChart3,
  Bell, User, LogOut, Menu, X, ChevronRight, Building2, 
  ShoppingCart, MessageSquare, HelpCircle
} from 'lucide-react';

// =============================================================================
// PORTAL LAYOUT
// Phase 8 & 9: Supplier & Customer Portal
// =============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const supplierNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" />, href: '/supplier' },
  { id: 'orders', label: 'Đơn hàng', icon: <Package className="w-5 h-5" />, href: '/supplier/orders' },
  { id: 'deliveries', label: 'Giao hàng', icon: <Truck className="w-5 h-5" />, href: '/supplier/deliveries' },
  { id: 'invoices', label: 'Hóa đơn', icon: <FileText className="w-5 h-5" />, href: '/supplier/invoices' },
  { id: 'performance', label: 'Hiệu suất', icon: <BarChart3 className="w-5 h-5" />, href: '/supplier/performance' },
];

const customerNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" />, href: '/customer' },
  { id: 'orders', label: 'Đơn hàng', icon: <ShoppingCart className="w-5 h-5" />, href: '/customer/orders' },
  { id: 'deliveries', label: 'Giao hàng', icon: <Truck className="w-5 h-5" />, href: '/customer/deliveries' },
  { id: 'invoices', label: 'Hóa đơn', icon: <FileText className="w-5 h-5" />, href: '/customer/invoices' },
  { id: 'support', label: 'Hỗ trợ', icon: <MessageSquare className="w-5 h-5" />, href: '/customer/support' },
];

interface PortalConfig {
  navItems: NavItem[];
  title: string;
  subtitle: string;
  baseUrl: string;
  userName: string;
  userCode: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
  helpEmail: string;
}

export function PortalLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detect portal type based on pathname
  const isCustomerPortal = pathname.startsWith('/customer');
  
  const config: PortalConfig = useMemo(() => {
    if (isCustomerPortal) {
      return {
        navItems: customerNavItems,
        title: 'L-ERP MRP',
        subtitle: 'Customer Portal',
        baseUrl: '/customer',
        userName: 'ABC Manufacturing',
        userCode: 'CUST-ABC-001',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-emerald-700',
        icon: <ShoppingCart className="w-6 h-6 text-white" />,
        helpEmail: 'sales@your-domain.com',
      };
    }
    return {
      navItems: supplierNavItems,
      title: 'L-ERP MRP',
      subtitle: 'Supplier Portal',
      baseUrl: '/supplier',
      userName: 'Vina Parts',
      userCode: 'SUP-VINA-001',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-700',
      icon: <Building2 className="w-6 h-6 text-white" />,
      helpEmail: 'purchasing@your-domain.com',
    };
  }, [isCustomerPortal]);

  const isActive = (href: string) => {
    if (href === config.baseUrl) return pathname === config.baseUrl;
    return pathname.startsWith(href);
  };

  const accentColor = isCustomerPortal ? 'emerald' : 'blue';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(var(--bg-primary))]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[rgb(var(--bg-secondary))] border-b border-gray-200 dark:border-[rgb(var(--border-primary))] z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left - Logo & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(var(--sidebar-item-hover))] lg:hidden"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href={config.baseUrl} className="flex items-center gap-2">
              <div className={`w-10 h-10 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} rounded-xl flex items-center justify-center`}>
                {config.icon}
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-gray-900 dark:text-white">{config.title}</span>
                <span className="text-xs text-gray-500 block">{config.subtitle}</span>
              </div>
            </Link>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(var(--sidebar-item-hover))]" aria-label="Thông báo">
              <Bell className="w-5 h-5" />
              <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 bg-${accentColor}-500 rounded-full text-[10px] text-white flex items-center justify-center`}>
                3
              </span>
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-[rgb(var(--border-primary))]">
              <div className={`w-8 h-8 bg-${accentColor}-100 rounded-full flex items-center justify-center`}>
                <User className={`w-4 h-4 text-${accentColor}-600`} />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{config.userName}</p>
                <p className="text-xs text-gray-500">{config.userCode}</p>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgb(var(--sidebar-item-hover))] text-gray-500" aria-label="Đăng xuất">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-[rgb(var(--bg-secondary))] border-r border-gray-200 dark:border-[rgb(var(--border-primary))] hidden lg:block">
        <nav className="p-4 space-y-1">
          {config.navItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? `bg-${accentColor}-50 dark:bg-${accentColor}-900/30 text-${accentColor}-600 dark:text-${accentColor}-400 font-medium`
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[rgb(var(--sidebar-item-hover))]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive(item.href) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Help Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-[rgb(var(--border-primary))]">
          <div className={`bg-${accentColor}-50 dark:bg-${accentColor}-900/30 rounded-xl p-4`}>
            <h4 className={`font-medium text-${accentColor}-900 dark:text-${accentColor}-300 text-sm flex items-center gap-2`}>
              <HelpCircle className="w-4 h-4" />
              Cần hỗ trợ?
            </h4>
            <p className={`text-xs text-${accentColor}-700 dark:text-${accentColor}-400 mt-1`}>
              Email: {config.helpEmail}
            </p>
            <p className={`text-xs text-${accentColor}-700 dark:text-${accentColor}-400`}>
              Hotline: 1900-xxxx
            </p>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[rgb(var(--bg-secondary))]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[rgb(var(--border-primary))]">
              <span className="font-bold">Menu</span>
              <button onClick={() => setSidebarOpen(false)} aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {config.navItems.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? `bg-${accentColor}-50 dark:bg-${accentColor}-900/30 text-${accentColor}-600 font-medium`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
