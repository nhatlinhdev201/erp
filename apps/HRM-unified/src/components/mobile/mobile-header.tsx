'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Menu, Search, Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { getInitials } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useNotificationStore } from '@/stores/notification-store'

interface MobileHeaderProps {
  title?: string
  showSearch?: boolean
  showBack?: boolean
  onBack?: () => void
}

export function MobileHeader({
  title = 'L-ERP HRM',
  showSearch = true,
}: MobileHeaderProps) {
  const { data: session } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const toggle = useSidebarStore((s) => s.toggle)
  const { unreadCount, setIsOpen } = useNotificationStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 md:hidden">
        {/* Main header */}
        <div
          className={cn(
            'flex items-center justify-between h-14 px-4 bg-background/95 backdrop-blur-lg border-b',
            isSearchOpen && 'hidden'
          )}
        >
          {/* Left: Menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={toggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Center: Title */}
          <h1 className="font-bold text-base">{title}</h1>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 touch-manipulation"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative touch-manipulation"
              onClick={() => setIsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px]"
                  variant="destructive"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            <Avatar className="h-8 w-8 ml-1">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {session?.user?.name ? getInitials(session.user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Search overlay */}
        {isSearchOpen && (
          <div className="flex items-center h-14 px-3 bg-background border-b gap-2">
            <form onSubmit={handleSearch} className="flex-1">
              <Input
                type="search"
                placeholder="Tìm kiếm nhân viên, đơn từ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10"
                autoFocus
              />
            </form>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery('')
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </header>
    </>
  )
}
