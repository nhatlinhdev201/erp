// =============================================================================
// L-ERP MRP - PWA HOOKS
// Service worker registration, install prompt, and offline detection
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clientLogger } from '@/lib/client-logger';

// =============================================================================
// TYPES
// =============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

// Navigator Network Information API (experimental)
interface NetworkInformation extends EventTarget {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithMSStream extends Window {
  MSStream?: unknown;
}

interface NetworkState {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  prompt: (() => Promise<boolean>) | null;
}

// =============================================================================
// SERVICE WORKER HOOK
// =============================================================================

export function useServiceWorker(): ServiceWorkerState & {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => void;
  clearCache: () => void;
} {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdating: false,
    registration: null,
    error: null,
  });

  // Check if service workers are supported
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isSupported: 'serviceWorker' in navigator,
    }));
  }, []);

  // Register service worker
  const register = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: new Error('Service workers are not supported'),
      }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null,
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, isUpdating: true }));
            }
          });
        }
      });

    } catch (error) {
      clientLogger.error('[PWA] Service worker registration failed', error);
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }));
    }
  }, []);

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (state.registration) {
      await state.registration.unregister();
      setState((prev) => ({
        ...prev,
        isRegistered: false,
        registration: null,
      }));
    }
  }, [state.registration]);

  // Update service worker
  const update = useCallback(async () => {
    if (state.registration) {
      await state.registration.update();
    }
  }, [state.registration]);

  // Skip waiting and reload
  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [state.registration]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
  }, []);

  // Auto-register on mount (or Force Unregister in Dev)
  useEffect(() => {
    // FORCE UNREGISTER IN DEVELOPMENT to kill zombie workers
    if (process.env.NODE_ENV === 'development') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      return;
    }

    if ('serviceWorker' in navigator && !state.isRegistered) {
      register();
    }
  }, []);

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
    clearCache,
  };
}

// =============================================================================
// NETWORK STATUS HOOK
// =============================================================================

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  });

  useEffect(() => {
    // Initial state
    setState((prev) => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    // Update network info if available
    const updateNetworkInfo = () => {
      const connection = (navigator as NavigatorWithConnection).connection;

      if (connection) {
        setState((prev) => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }));
      }
    };

    updateNetworkInfo();

    // Event listeners
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network info change listener
    const connection = (navigator as NavigatorWithConnection).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return state;
}

// =============================================================================
// INSTALL PROMPT HOOK
// =============================================================================

export function useInstallPrompt(): InstallPromptState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check if iOS
  const isIOS = typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as WindowWithMSStream).MSStream;

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone === true ||
        document.referrer.includes('android-app://');

      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Prompt function
  const prompt = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) {
      return false;
    }

    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;

      if (outcome === 'accepted') {
        setCanInstall(false);
        deferredPromptRef.current = null;
        return true;
      }

      return false;
    } catch (error) {
      clientLogger.error('[PWA] Install prompt error', error);
      return false;
    }
  }, []);

  return {
    canInstall,
    isInstalled,
    isIOS,
    prompt: canInstall ? prompt : null,
  };
}

// =============================================================================
// PUSH NOTIFICATIONS HOOK
// =============================================================================

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const supported = 'Notification' in window && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      clientLogger.error('[PWA] Notification permission error', error);
      return false;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (vapidPublicKey: string): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      setSubscription(subscription);

      return subscription;
    } catch (error) {
      clientLogger.error('[PWA] Push subscription error', error);
      return null;
    }
  }, [isSupported, permission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      clientLogger.error('[PWA] Push unsubscribe error', error);
      return false;
    }
  }, [subscription]);

  // Show local notification
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<void> => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    } catch (error) {
      clientLogger.error('[PWA] Show notification error', error);
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// =============================================================================
// COMBINED PWA HOOK
// =============================================================================

export function usePWA() {
  const serviceWorker = useServiceWorker();
  const network = useNetworkStatus();
  const installPrompt = useInstallPrompt();
  const pushNotifications = usePushNotifications();

  return {
    serviceWorker,
    network,
    installPrompt,
    pushNotifications,
    isReady: serviceWorker.isRegistered && !serviceWorker.error,
  };
}
