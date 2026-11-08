'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  X,
  Smartphone,
  CheckCircle,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  registerServiceWorker,
  setupInstallPrompt,
  promptInstall,
  canInstall,
  isOnline,
  setupOnlineListener,
  clearCache,
  getCacheSize,
  formatCacheSize,
} from './pwa-config';

// =============================================================================
// PWA CONTEXT
// =============================================================================

interface PWAContextType {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  cacheSize: string;
  install: () => Promise<boolean>;
  update: () => void;
  clearCache: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA(): PWAContextType {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider');
  }
  return context;
}

// =============================================================================
// PWA PROVIDER
// =============================================================================

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [online, setOnline] = useState(true);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 KB');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize
  useEffect(() => {
    // Check online status
    setOnline(isOnline());
    const unsubscribe = setupOnlineListener(setOnline);

    // Register service worker
    registerServiceWorker().then(setRegistration);

    // Setup install prompt
    setupInstallPrompt();

    // Listen for install events
    const handleInstallAvailable = () => setInstallable(true);
    const handleInstalled = () => {
      setInstalled(true);
      setInstallable(false);
    };
    const handleUpdateAvailable = () => setHasUpdate(true);

    window.addEventListener('pwa:install-available', handleInstallAvailable);
    window.addEventListener('pwa:installed', handleInstalled);
    window.addEventListener('pwa:update-available', handleUpdateAvailable);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    // Get cache size
    getCacheSize().then((size) => setCacheSize(formatCacheSize(size)));

    return () => {
      unsubscribe();
      window.removeEventListener('pwa:install-available', handleInstallAvailable);
      window.removeEventListener('pwa:installed', handleInstalled);
      window.removeEventListener('pwa:update-available', handleUpdateAvailable);
    };
  }, []);

  const install = useCallback(async () => {
    const result = await promptInstall();
    if (result) {
      setInstalled(true);
      setInstallable(false);
    }
    return result;
  }, []);

  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const handleClearCache = useCallback(async () => {
    await clearCache();
    setCacheSize('0 KB');
  }, []);

  const value: PWAContextType = {
    isOnline: online,
    canInstall: installable && !installed,
    isInstalled: installed,
    hasUpdate,
    cacheSize,
    install,
    update,
    clearCache: handleClearCache,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}

// =============================================================================
// OFFLINE INDICATOR
// =============================================================================

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show && isOnline) return null;

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300',
      isOnline
        ? 'bg-green-500 text-white'
        : 'bg-gray-800 text-white'
    )}>
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5" />
          <span>Đã kết nối lại</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5" />
          <span>Bạn đang offline</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// INSTALL PROMPT
// =============================================================================

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { canInstall, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Check if dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  if (!canInstall || dismissed) return null;

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4',
      className
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Smartphone className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Cài đặt ứng dụng
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Cài đặt L-ERP MRP để truy cập nhanh hơn và sử dụng offline
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Để sau
          </button>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {installing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// UPDATE PROMPT
// =============================================================================

export function UpdatePrompt() {
  const { hasUpdate, update } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-blue-600 text-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold">Có bản cập nhật mới</h3>
            <p className="text-sm text-blue-100 mt-1">
              Phiên bản mới đã sẵn sàng. Cập nhật để có trải nghiệm tốt nhất.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-blue-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={update}
          className="w-full mt-3 px-4 py-2 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
        >
          Cập nhật ngay
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// NETWORK STATUS BADGE
// =============================================================================

interface NetworkStatusBadgeProps {
  showLabel?: boolean;
  className?: string;
}

export function NetworkStatusBadge({ showLabel = true, className }: NetworkStatusBadgeProps) {
  const { isOnline } = usePWA();

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
      isOnline
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
      className
    )}>
      {isOnline ? (
        <>
          <Cloud className="w-4 h-4" />
          {showLabel && <span>Online</span>}
        </>
      ) : (
        <>
          <CloudOff className="w-4 h-4" />
          {showLabel && <span>Offline</span>}
        </>
      )}
    </div>
  );
}

// =============================================================================
// PWA SETTINGS
// =============================================================================

export function PWASettings() {
  const { isOnline, isInstalled, cacheSize, clearCache } = usePWA();
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    await clearCache();
    setClearing(false);
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-500" />
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Trạng thái mạng
            </p>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Đang kết nối' : 'Offline'}
            </p>
          </div>
        </div>
        <span className={cn(
          'w-3 h-3 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        )} />
      </div>

      {/* Installation Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-purple-600" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Ứng dụng
            </p>
            <p className="text-sm text-gray-500">
              {isInstalled ? 'Đã cài đặt' : 'Chưa cài đặt'}
            </p>
          </div>
        </div>
        {isInstalled && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>

      {/* Cache */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Cache offline
            </p>
            <p className="text-sm text-gray-500">
              {cacheSize}
            </p>
          </div>
        </div>
        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {clearing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            'Xóa cache'
          )}
        </button>
      </div>
    </div>
  );
}

export default PWAProvider;
