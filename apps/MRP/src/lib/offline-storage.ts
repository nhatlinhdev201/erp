// =============================================================================
// L-ERP MRP - OFFLINE STORAGE
// IndexedDB wrapper for offline data persistence
// =============================================================================

const DB_NAME = 'lerp-mrp-offline';
const DB_VERSION = 1;

// =============================================================================
// TYPES
// =============================================================================

interface PendingAction {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retries: number;
}

interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
  ttl: number;
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Pending actions store (for background sync)
      if (!db.objectStoreNames.contains('pendingActions')) {
        const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Cached data store
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Draft data store (for form data)
      if (!db.objectStoreNames.contains('drafts')) {
        const draftsStore = db.createObjectStore('drafts', { keyPath: 'key' });
        draftsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// =============================================================================
// PENDING ACTIONS (for offline mutations)
// =============================================================================

export async function savePendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
  const db = await openDatabase();
  const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
    };
    
    const request = store.add(pendingAction);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(new Error('Failed to save pending action'));
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingActions', 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get pending actions'));
  });
}

export async function removePendingAction(id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove pending action'));
  });
}

export async function updatePendingActionRetries(id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.retries += 1;
        store.put(action);
      }
      resolve();
    };
    
    getRequest.onerror = () => reject(new Error('Failed to update pending action'));
  });
}

// =============================================================================
// CACHED DATA
// =============================================================================

export async function setCachedData(key: string, data: unknown, ttl: number = 3600000): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    
    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    const request = store.put(cachedData);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to cache data'));
  });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    const request = store.get(key);
    
    request.onsuccess = () => {
      const result = request.result as CachedData | undefined;
      
      if (!result) {
        resolve(null);
        return;
      }
      
      // Check if expired
      if (Date.now() - result.timestamp > result.ttl) {
        // Data expired, remove it
        removeCachedData(key);
        resolve(null);
        return;
      }
      
      resolve(result.data as T);
    };
    
    request.onerror = () => reject(new Error('Failed to get cached data'));
  });
}

export async function removeCachedData(key: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove cached data'));
  });
}

export async function clearExpiredCache(): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const request = store.openCursor();
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const data = cursor.value as CachedData;
        if (Date.now() - data.timestamp > data.ttl) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    request.onerror = () => reject(new Error('Failed to clear expired cache'));
  });
}

// =============================================================================
// DRAFT DATA (for form persistence)
// =============================================================================

export async function saveDraft(key: string, data: unknown): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    
    const draft = {
      key,
      data,
      timestamp: Date.now(),
    };
    
    const request = store.put(draft);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save draft'));
  });
}

export async function getDraft<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readonly');
    const store = transaction.objectStore('drafts');
    const request = store.get(key);
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.data as T ?? null);
    };
    
    request.onerror = () => reject(new Error('Failed to get draft'));
  });
}

export async function removeDraft(key: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove draft'));
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export async function clearAllOfflineData(): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions', 'cache', 'drafts'], 'readwrite');
    
    transaction.objectStore('pendingActions').clear();
    transaction.objectStore('cache').clear();
    transaction.objectStore('drafts').clear();
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to clear offline data'));
  });
}

export async function getOfflineDataSize(): Promise<number> {
  const db = await openDatabase();
  let totalSize = 0;
  
  const stores = ['pendingActions', 'cache', 'drafts'];
  
  for (const storeName of stores) {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    await new Promise<void>((resolve) => {
      request.onsuccess = () => {
        const data = request.result;
        totalSize += new Blob([JSON.stringify(data)]).size;
        resolve();
      };
    });
  }
  
  return totalSize;
}

// =============================================================================
// SYNC HANDLER
// =============================================================================

export async function syncPendingActions(): Promise<{ success: number; failed: number }> {
  const actions = await getPendingActions();
  let success = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body,
      });

      if (response.ok) {
        await removePendingAction(action.id);
        success++;
      } else {
        await updatePendingActionRetries(action.id);
        failed++;
      }
    } catch (error) {
      await updatePendingActionRetries(action.id);
      failed++;
    }
  }

  return { success, failed };
}

// Register for background sync if supported
export function registerBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-pending-actions');
    });
  }
}
