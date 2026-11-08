// Service Worker for Lạc Việt HR PWA
// Version 1.0.0

const CACHE_NAME = 'lerp-hr-v1';
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  '/api/ess/dashboard',
  '/api/notifications/unread-count',
  '/api/leave/balances/my',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control immediately
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, fallback to network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Pages - Network first with offline fallback
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// Network first strategy (for API)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful GET responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline JSON for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Không có kết nối mạng',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {});

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Asset not available:', request.url);
    return new Response('Asset not available', { status: 404 });
  }
}

// Network first with offline fallback (for pages)
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful page responses
    if (networkResponse.ok && request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for page:', request.url);

    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline', { status: 503 });
  }
}

// Check if request is for a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];

  return staticExtensions.some((ext) => pathname.endsWith(ext)) ||
         pathname.startsWith('/_next/static/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }

  if (event.tag === 'sync-leave-requests') {
    event.waitUntil(syncLeaveRequests());
  }
});

// Sync attendance data
async function syncAttendance() {
  try {
    const pendingAttendance = await getFromIndexedDB('pending-attendance');

    for (const record of pendingAttendance) {
      try {
        await fetch('/api/attendance/clock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });

        await removeFromIndexedDB('pending-attendance', record.id);
      } catch (error) {
        console.log('[SW] Failed to sync attendance:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync attendance error:', error);
  }
}

// Sync leave requests
async function syncLeaveRequests() {
  try {
    const pendingRequests = await getFromIndexedDB('pending-leave-requests');

    for (const request of pendingRequests) {
      try {
        await fetch('/api/leave/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        await removeFromIndexedDB('pending-leave-requests', request.id);
      } catch (error) {
        console.log('[SW] Failed to sync leave request:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync leave requests error:', error);
  }
}

// IndexedDB helpers (simplified)
function getFromIndexedDB(storeName) {
  return new Promise((resolve) => {
    resolve([]); // Placeholder - implement with actual IndexedDB
  });
}

function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve) => {
    resolve(); // Placeholder - implement with actual IndexedDB
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  const data = event.data?.json() || {
    title: 'Lạc Việt HR',
    body: 'Bạn có thông báo mới',
    icon: '/icons/icon-192x192.png',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'notification',
      data: data.url ? { url: data.url } : undefined,
      actions: data.actions || [],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service worker loaded');
