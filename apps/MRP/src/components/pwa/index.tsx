// =============================================================================
// L-ERP MRP - PWA COMPONENTS
// Install prompt, offline indicator, update notification
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  useServiceWorker, 
  useNetworkStatus, 
  useInstallPrompt,
  usePWA
} from '@/lib/hooks/use-pwa';
import {
  Download,
  RefreshCw,
  WifiOff,
  Wifi,
  X,
  Smartphone,
  Share,
  Plus,
  CheckCircle,
} from 'lucide-react';

// =============================================================================
// INSTALL PROMPT BANNER
// =============================================================================

interface InstallPromptProps {
  className?: string;
  onDismiss?: () => void;
}

export function InstallPromptBanner({ className, onDismiss }: InstallPromptProps) {
  const { canInstall, isInstalled, isIOS, prompt } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check if user has dismissed before
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  const handleInstall = async () => {
    if (prompt) {
      const accepted = await prompt();
      if (accepted) {
        setDismissed(true);
      }
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  // iOS specific prompt
  if (isIOS) {
    return (
      <>
        <div
          className={cn(
            'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96',
            'bg-white dark:bg-neutral-800',
            'rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700',
            'p-4 z-50',
            'animate-slide-in-bottom',
            className
          )}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Install L-ERP MRP
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                Add to your home screen for quick access
              </p>
              <button
                onClick={() => setShowIOSInstructions(true)}
                className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show me how →
              </button>
            </div>
          </div>
        </div>

        {/* iOS Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-sm w-full p-6 animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Install on iOS
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      Tap the <Share className="w-4 h-4 inline" /> Share button
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      Scroll down and tap <Plus className="w-4 h-4 inline" /> "Add to Home Screen"
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      Tap "Add" to install
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIOSInstructions(false);
                  handleDismiss();
                }}
                className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Standard install prompt (Chrome, Edge, etc.)
  if (!canInstall) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96',
        'bg-white dark:bg-neutral-800',
        'rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700',
        'p-4 z-50',
        'animate-slide-in-bottom',
        className
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
        aria-label="Đóng"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Install L-ERP MRP
          </h3>
          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
            Install for faster access and offline support
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 dark:text-neutral-400 text-sm font-medium hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OFFLINE INDICATOR
// =============================================================================

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-16 left-0 right-0 z-40',
        'flex items-center justify-center',
        'animate-slide-in-top',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full shadow-lg',
          'text-sm font-medium',
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 text-white'
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline</span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// UPDATE NOTIFICATION
// =============================================================================

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const { isUpdating, skipWaiting } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (!isUpdating || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    // Show again after 1 hour if still updating
    setTimeout(() => setDismissed(false), 60 * 60 * 1000);
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96',
        'bg-blue-600 text-white',
        'rounded-xl shadow-2xl',
        'p-4 z-50',
        'animate-slide-in-bottom',
        className
      )}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="p-2 bg-white/20 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Update Available</h3>
          <p className="text-sm text-blue-100 mt-1">
            A new version of L-ERP MRP is ready
          </p>
          <button
            onClick={skipWaiting}
            className="mt-3 px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PWA STATUS INDICATOR (for Settings page)
// =============================================================================

interface PWAStatusProps {
  className?: string;
}

export function PWAStatus({ className }: PWAStatusProps) {
  const { serviceWorker, network, installPrompt, pushNotifications } = usePWA();

  const statusItems = [
    {
      label: 'Service Worker',
      status: serviceWorker.isRegistered,
      detail: serviceWorker.isRegistered ? 'Active' : 'Not registered',
    },
    {
      label: 'Network',
      status: network.isOnline,
      detail: network.isOnline 
        ? `Online (${network.effectiveType || 'unknown'})` 
        : 'Offline',
    },
    {
      label: 'App Installed',
      status: installPrompt.isInstalled,
      detail: installPrompt.isInstalled ? 'Yes' : 'No',
    },
    {
      label: 'Notifications',
      status: pushNotifications.permission === 'granted',
      detail: pushNotifications.permission,
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
        PWA Status
      </h3>
      <div className="space-y-2">
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
          >
            <span className="text-sm text-gray-700 dark:text-neutral-300">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400">
                {item.detail}
              </span>
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  item.status ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {!installPrompt.isInstalled && installPrompt.prompt && (
          <button
            onClick={() => installPrompt.prompt?.()}
            className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Install App
          </button>
        )}
        {pushNotifications.permission !== 'granted' && pushNotifications.isSupported && (
          <button
            onClick={pushNotifications.requestPermission}
            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
          >
            Enable Notifications
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PWA PROVIDER (combines all components)
// =============================================================================

interface PWAProviderProps {
  children: React.ReactNode;
  showInstallPrompt?: boolean;
  showOfflineIndicator?: boolean;
  showUpdateNotification?: boolean;
}

export function PWAProvider({
  children,
  showInstallPrompt = true,
  showOfflineIndicator = true,
  showUpdateNotification = true,
}: PWAProviderProps) {
  return (
    <>
      {children}
      {showOfflineIndicator && <OfflineIndicator />}
      {showUpdateNotification && <UpdateNotification />}
      {showInstallPrompt && <InstallPromptBanner />}
    </>
  );
}
