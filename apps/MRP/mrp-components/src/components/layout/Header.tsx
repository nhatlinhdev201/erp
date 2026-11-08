'use client'

import React from 'react'
import { Search, Bell, ChevronDown, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle?: () => void
  userName?: string
  userInitials?: string
  notificationCount?: number
}

export function Header({
  onMenuToggle,
  userName = 'Admin',
  userInitials = 'AD',
  notificationCount = 0,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-header bg-gunmetal border-b border-mrp-border flex items-center px-4 z-[100]">
      {/* Logo */}
      <div className="flex items-center gap-2">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="w-8 h-8 flex items-center justify-center text-mrp-text-secondary hover:bg-slate hover:text-mrp-text-primary transition-colors lg:hidden"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="w-6 h-6 bg-info-cyan flex items-center justify-center text-steel-dark font-bold text-xs">
          M
        </div>
        <span className="font-display text-md font-semibold text-mrp-text-primary">
          L-ERP MRP
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-[400px] mx-6 relative hidden sm:block">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted"
        />
        <input
          type="text"
          placeholder="Tim kiem... (⌘K)"
          className="w-full h-input bg-slate border border-mrp-border text-mrp-text-primary font-body text-base pl-9 pr-3 placeholder:text-mrp-text-muted focus:outline-none focus:border-mrp-border-focus"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification */}
        <button
          className="relative w-8 h-8 flex items-center justify-center text-mrp-text-secondary hover:bg-slate hover:text-mrp-text-primary transition-colors"
          title="Thong bao"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-urgent-red rounded-full" />
          )}
        </button>

        {/* User */}
        <button className="flex items-center gap-2 px-2 py-1 bg-transparent border border-mrp-border text-mrp-text-primary hover:bg-slate transition-colors">
          <div className="w-6 h-6 bg-info-cyan text-steel-dark flex items-center justify-center font-semibold text-xs">
            {userInitials}
          </div>
          <span className="text-sm hidden sm:inline">{userName}</span>
          <ChevronDown size={12} />
        </button>
      </div>
    </header>
  )
}

export default Header
