'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { toast } from 'sonner'
import { Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAContextValue {
  isOnline: boolean
  isInstallable: boolean
  isInstalled: boolean
  isUpdateAvailable: boolean
  installApp: () => Promise<void>
  updateApp: () => void
}

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  isInstallable: false,
  isInstalled: false,
  isUpdateAvailable: false,
  installApp: async () => {},
  updateApp: () => {},
})

export const usePWA = () => useContext(PWAContext)

// ═══════════════════════════════════════════════════════════════
// Install Banner Component
// ═══════════════════════════════════════════════════════════════

function InstallBanner({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border-2 border-primary/20 rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Cài đặt L-ERP HRM</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Truy cập nhanh hơn, làm việc offline
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1" onClick={onInstall}>
            Cài đặt
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Để sau
          </Button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Update Banner Component
// ═══════════════════════════════════════════════════════════════

function UpdateBanner({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-top-4">
      <div className="bg-card border-2 border-blue-500/30 rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <RefreshCw className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Có bản cập nhật mới</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cập nhật để sử dụng tính năng mới nhất
            </p>
          </div>
        </div>
        <Button size="sm" className="w-full mt-3" onClick={onUpdate}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Cập nhật ngay
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Offline Indicator Component
// ═══════════════════════════════════════════════════════════════

function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true)
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (!showIndicator && isOnline) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium transition-all',
        !isOnline
          ? 'bg-amber-500 text-amber-950'
          : 'bg-green-500 text-green-950'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Bạn đang offline. Một số tính năng có thể không khả dụng.</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>Đã kết nối lại!</span>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PWA Provider Component
// ═══════════════════════════════════════════════════════════════

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Register SW
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg)

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true)
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error)
      })

    // Handle controller change (update applied)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  // Check if already installed
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsInstalled(isStandalone)
  }, [])

  // Handle install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)

      // Show install banner after delay (if not dismissed before)
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 5000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Đã kết nối lại!')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Mất kết nối mạng')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        toast.success('Đã cài đặt L-ERP HRM!')
      }

      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowInstallBanner(false)
    } catch (error) {
      console.error('[PWA] Install failed:', error)
      toast.error('Không thể cài đặt ứng dụng')
    }
  }, [deferredPrompt])

  // Update app
  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [registration])

  // Dismiss install banner
  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }, [])

  const contextValue: PWAContextValue = {
    isOnline,
    isInstallable,
    isInstalled,
    isUpdateAvailable,
    installApp,
    updateApp,
  }

  return (
    <PWAContext.Provider value={contextValue}>
      {children}

      {/* Offline indicator */}
      <OfflineIndicator isOnline={isOnline} />

      {/* Install banner */}
      {showInstallBanner && !isInstalled && (
        <InstallBanner onInstall={installApp} onDismiss={dismissInstallBanner} />
      )}

      {/* Update banner */}
      {isUpdateAvailable && <UpdateBanner onUpdate={updateApp} />}
    </PWAContext.Provider>
  )
}
