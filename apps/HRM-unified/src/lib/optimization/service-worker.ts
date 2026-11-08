// src/lib/optimization/service-worker.ts

/**
 * LAC VIET HR - Service Worker Configuration
 * Progressive Web App caching and offline support
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface CacheConfig {
  name: string;
  maxAge: number; // seconds
  maxEntries?: number;
  patterns: (string | RegExp)[];
}

export interface ServiceWorkerConfig {
  caches: CacheConfig[];
  navigationPreload?: boolean;
  skipWaiting?: boolean;
  clientsClaim?: boolean;
  offlineFallback?: string;
}

export interface CacheStrategy {
  name: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  cacheName: string;
  plugins?: CachePlugin[];
}

export interface CachePlugin {
  type: 'expiration' | 'cacheable-response' | 'broadcast-update';
  config: Record<string, unknown>;
}

// ════════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

export const DefaultServiceWorkerConfig: ServiceWorkerConfig = {
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  offlineFallback: '/offline',

  caches: [
    // Static assets - cache first (long lived)
    {
      name: 'static-assets-v1',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      maxEntries: 200,
      patterns: [
        /\/_next\/static\//,
        /\/static\//,
        /\.(?:js|css|woff2?|ico)$/,
      ],
    },

    // Images - cache first with limit
    {
      name: 'images-v1',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      maxEntries: 100,
      patterns: [
        /\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/,
        /\/_next\/image/,
      ],
    },

    // API responses - network first
    {
      name: 'api-cache-v1',
      maxAge: 60 * 5, // 5 minutes
      maxEntries: 50,
      patterns: [
        /\/api\/.*$/,
      ],
    },

    // HTML pages - stale while revalidate
    {
      name: 'pages-v1',
      maxAge: 60 * 60, // 1 hour
      maxEntries: 50,
      patterns: [
        /\/$/,
        /\/[^.]+$/,
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ════════════════════════════════════════════════════════════════════════════════

export const CacheStrategies = {
  // Static assets - immutable, cache forever
  staticAssets: {
    name: 'cache-first' as const,
    cacheName: 'static-assets-v1',
    plugins: [
      {
        type: 'expiration' as const,
        config: {
          maxAgeSeconds: 60 * 60 * 24 * 365,
          maxEntries: 200,
        },
      },
      {
        type: 'cacheable-response' as const,
        config: {
          statuses: [0, 200],
        },
      },
    ],
  },

  // Images - cache first with shorter expiration
  images: {
    name: 'cache-first' as const,
    cacheName: 'images-v1',
    plugins: [
      {
        type: 'expiration' as const,
        config: {
          maxAgeSeconds: 60 * 60 * 24 * 30,
          maxEntries: 100,
        },
      },
    ],
  },

  // API data - network first for freshness
  apiData: {
    name: 'network-first' as const,
    cacheName: 'api-cache-v1',
    plugins: [
      {
        type: 'expiration' as const,
        config: {
          maxAgeSeconds: 60 * 5,
          maxEntries: 50,
        },
      },
    ],
  },

  // Pages - stale while revalidate for speed + freshness
  pages: {
    name: 'stale-while-revalidate' as const,
    cacheName: 'pages-v1',
    plugins: [
      {
        type: 'expiration' as const,
        config: {
          maxAgeSeconds: 60 * 60,
          maxEntries: 50,
        },
      },
      {
        type: 'broadcast-update' as const,
        config: {
          channelName: 'page-updates',
        },
      },
    ],
  },

  // Fonts - cache first, long expiration
  fonts: {
    name: 'cache-first' as const,
    cacheName: 'fonts-v1',
    plugins: [
      {
        type: 'expiration' as const,
        config: {
          maxAgeSeconds: 60 * 60 * 24 * 365,
          maxEntries: 30,
        },
      },
    ],
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// PRECACHE MANIFEST
// ════════════════════════════════════════════════════════════════════════════════

/**
 * URLs to precache on service worker install
 */
export const PrecacheManifest = [
  // Core pages
  '/',
  '/dashboard',
  '/login',
  '/offline',

  // Critical static assets
  '/favicon.ico',
  '/manifest.json',

  // App shell CSS (will be injected at build time)
  // '/_next/static/css/app.css',
];

/**
 * Runtime caching routes
 */
export const RuntimeCachingRoutes = [
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com/,
    handler: 'stale-while-revalidate',
    options: {
      cacheName: 'google-fonts-stylesheets',
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com/,
    handler: 'cache-first',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: {
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ════════════════════════════════════════════════════════════════════════════════

export interface RegistrationResult {
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  swUrl: string = '/sw.js',
  options: { scope?: string; updateViaCache?: ServiceWorkerUpdateViaCache } = {}
): Promise<RegistrationResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { success: false, error: new Error('Service workers not supported') };
  }

  try {
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: options.scope || '/',
      updateViaCache: options.updateViaCache || 'none',
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour

    return { success: true, registration };
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorkers(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));

  return true;
}

// ════════════════════════════════════════════════════════════════════════════════
// UPDATE HANDLING
// ════════════════════════════════════════════════════════════════════════════════

export type UpdateCallback = (registration: ServiceWorkerRegistration) => void;

/**
 * Listen for service worker updates
 */
export function onServiceWorkerUpdate(callback: UpdateCallback): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleUpdate = async () => {
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          callback(registration);
        }
      });
    });
  };

  handleUpdate();

  return () => {
    // Cleanup if needed
  };
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaitingAndReload(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Reload when controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// CACHE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get all cache names
 */
export async function getCacheNames(): Promise<string[]> {
  if (typeof caches === 'undefined') return [];
  return caches.keys();
}

/**
 * Clear a specific cache
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  return caches.delete(cacheName);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof caches === 'undefined') return;

  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

/**
 * Get cache storage usage
 */
export async function getCacheStorageUsage(): Promise<{
  quota: number;
  usage: number;
  percentage: number;
} | null> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;

    return {
      quota,
      usage,
      percentage: quota > 0 ? (usage / quota) * 100 : 0,
    };
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// OFFLINE DETECTION
// ════════════════════════════════════════════════════════════════════════════════

export type NetworkStatus = 'online' | 'offline';
export type NetworkStatusCallback = (status: NetworkStatus) => void;

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatus {
  if (typeof navigator === 'undefined') return 'online';
  return navigator.onLine ? 'online' : 'offline';
}

/**
 * Listen for network status changes
 */
export function onNetworkStatusChange(callback: NetworkStatusCallback): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback('online');
  const handleOffline = () => callback('offline');

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ════════════════════════════════════════════════════════════════════════════════

export interface SyncRequest {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

const SYNC_STORE_KEY = 'lerp-hrm-sync-queue';

/**
 * Queue a request for background sync
 */
export async function queueForSync(
  type: string,
  payload: unknown
): Promise<string> {
  const request: SyncRequest = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };

  // Store in IndexedDB or localStorage
  const queue = getSyncQueue();
  queue.push(request);
  saveSyncQueue(queue);

  // Register for background sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-queue');
  }

  return request.id;
}

/**
 * Get pending sync queue
 */
export function getSyncQueue(): SyncRequest[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const data = localStorage.getItem(SYNC_STORE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue
 */
function saveSyncQueue(queue: SyncRequest[]): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Remove item from sync queue
 */
export function removeFromSyncQueue(id: string): void {
  const queue = getSyncQueue();
  const filtered = queue.filter((r) => r.id !== id);
  saveSyncQueue(filtered);
}

/**
 * Clear sync queue
 */
export function clearSyncQueue(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SYNC_STORE_KEY);
}

// ════════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION SUPPORT
// ════════════════════════════════════════════════════════════════════════════════

export interface PushSubscriptionConfig {
  applicationServerKey: string;
  userVisibleOnly?: boolean;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied';
  }

  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  config: PushSubscriptionConfig
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await requestPushPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: config.userVisibleOnly ?? true,
    applicationServerKey: urlBase64ToUint8Array(config.applicationServerKey) as BufferSource,
  });

  return subscription;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return true;

  return subscription.unsubscribe();
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
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
