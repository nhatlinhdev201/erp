// ═══════════════════════════════════════════════════════════════════
//                    MOBILE OFFLINE SYNC MANAGER
//              IndexedDB storage + background sync for mobile
// ═══════════════════════════════════════════════════════════════════

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { clientLogger } from '@/lib/client-logger';

// Database schema
interface MobileDB extends DBSchema {
  'parts-cache': {
    key: string;
    value: CachedPart;
    indexes: { 'by-number': string; 'by-updated': number };
  };
  'locations-cache': {
    key: string;
    value: CachedLocation;
    indexes: { 'by-code': string };
  };
  'operations-queue': {
    key: string;
    value: QueuedOperation;
    indexes: { 'by-status': string; 'by-created': number };
  };
  'scan-history': {
    key: string;
    value: ScanHistoryItem;
    indexes: { 'by-timestamp': number };
  };
  'sync-metadata': {
    key: string;
    value: SyncMetadata;
  };
}

// Types
export interface CachedPart {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  uom: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  locations: { locationId: string; code: string; qty: number }[];
  updatedAt: number;
}

export interface CachedLocation {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
}

export interface QueuedOperation {
  id: string;
  type: OperationType;
  data: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export type OperationType = 
  | 'inventory_adjust'
  | 'inventory_transfer'
  | 'inventory_count'
  | 'po_receive'
  | 'so_pick'
  | 'wo_start'
  | 'wo_complete'
  | 'quality_inspect';

export interface ScanHistoryItem {
  id: string;
  barcode: string;
  type: string;
  entityId?: string;
  context: string;
  result: 'success' | 'not_found' | 'error';
  timestamp: number;
}

export interface SyncMetadata {
  key: string;
  lastSync: number;
  recordCount: number;
}

// Database singleton
let db: IDBPDatabase<MobileDB> | null = null;
const DB_NAME = 'lerp-mrp-mobile';
const DB_VERSION = 1;

/**
 * Initialize or get the database
 */
export async function getDB(): Promise<IDBPDatabase<MobileDB>> {
  if (db) return db;
  
  db = await openDB<MobileDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Parts cache
      if (!database.objectStoreNames.contains('parts-cache')) {
        const partsStore = database.createObjectStore('parts-cache', { keyPath: 'id' });
        partsStore.createIndex('by-number', 'partNumber');
        partsStore.createIndex('by-updated', 'updatedAt');
      }
      
      // Locations cache
      if (!database.objectStoreNames.contains('locations-cache')) {
        const locStore = database.createObjectStore('locations-cache', { keyPath: 'id' });
        locStore.createIndex('by-code', 'code');
      }
      
      // Operations queue
      if (!database.objectStoreNames.contains('operations-queue')) {
        const opsStore = database.createObjectStore('operations-queue', { keyPath: 'id' });
        opsStore.createIndex('by-status', 'status');
        opsStore.createIndex('by-created', 'createdAt');
      }
      
      // Scan history
      if (!database.objectStoreNames.contains('scan-history')) {
        const scanStore = database.createObjectStore('scan-history', { keyPath: 'id' });
        scanStore.createIndex('by-timestamp', 'timestamp');
      }
      
      // Sync metadata
      if (!database.objectStoreNames.contains('sync-metadata')) {
        database.createObjectStore('sync-metadata', { keyPath: 'key' });
      }
    },
  });
  
  return db;
}

// ═══════════════════════════════════════════════════════════════════
//                         PARTS CACHE
// ═══════════════════════════════════════════════════════════════════

/**
 * Cache parts for offline use
 */
export async function cacheParts(parts: CachedPart[]): Promise<void> {
  const database = await getDB();
  const tx = database.transaction('parts-cache', 'readwrite');
  
  await Promise.all([
    ...parts.map(part => tx.store.put(part)),
    tx.done,
  ]);
  
  // Update sync metadata
  await updateSyncMetadata('parts', parts.length);
}

/**
 * Get cached part by ID
 */
export async function getCachedPart(id: string): Promise<CachedPart | undefined> {
  const database = await getDB();
  return database.get('parts-cache', id);
}

/**
 * Get cached part by part number
 */
export async function getCachedPartByNumber(partNumber: string): Promise<CachedPart | undefined> {
  const database = await getDB();
  return database.getFromIndex('parts-cache', 'by-number', partNumber.toUpperCase());
}

/**
 * Search cached parts
 */
export async function searchCachedParts(query: string, limit = 20): Promise<CachedPart[]> {
  const database = await getDB();
  const allParts = await database.getAll('parts-cache');
  const queryLower = query.toLowerCase();
  
  return allParts
    .filter(part => 
      part.partNumber.toLowerCase().includes(queryLower) ||
      part.description.toLowerCase().includes(queryLower)
    )
    .slice(0, limit);
}

/**
 * Get all cached parts
 */
export async function getAllCachedParts(): Promise<CachedPart[]> {
  const database = await getDB();
  return database.getAll('parts-cache');
}

// ═══════════════════════════════════════════════════════════════════
//                       LOCATIONS CACHE
// ═══════════════════════════════════════════════════════════════════

/**
 * Cache locations for offline use
 */
export async function cacheLocations(locations: CachedLocation[]): Promise<void> {
  const database = await getDB();
  const tx = database.transaction('locations-cache', 'readwrite');
  
  await Promise.all([
    ...locations.map(loc => tx.store.put(loc)),
    tx.done,
  ]);
  
  await updateSyncMetadata('locations', locations.length);
}

/**
 * Get cached location by code
 */
export async function getCachedLocationByCode(code: string): Promise<CachedLocation | undefined> {
  const database = await getDB();
  return database.getFromIndex('locations-cache', 'by-code', code.toUpperCase());
}

/**
 * Get all cached locations
 */
export async function getAllCachedLocations(): Promise<CachedLocation[]> {
  const database = await getDB();
  return database.getAll('locations-cache');
}

// ═══════════════════════════════════════════════════════════════════
//                      OPERATIONS QUEUE
// ═══════════════════════════════════════════════════════════════════

/**
 * Queue an operation for sync
 */
export async function queueOperation(
  type: OperationType,
  data: Record<string, unknown>
): Promise<string> {
  const database = await getDB();
  const id = `op-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const operation: QueuedOperation = {
    id,
    type,
    data,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await database.put('operations-queue', operation);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncPendingOperations().catch((err: unknown) => clientLogger.error('Failed to sync pending operations', err));
  }
  
  return id;
}

/**
 * Get pending operations count
 */
export async function getPendingOperationsCount(): Promise<number> {
  const database = await getDB();
  const pending = await database.getAllFromIndex('operations-queue', 'by-status', 'pending');
  return pending.length;
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const database = await getDB();
  return database.getAllFromIndex('operations-queue', 'by-status', 'pending');
}

/**
 * Update operation status
 */
export async function updateOperationStatus(
  id: string,
  status: QueuedOperation['status'],
  errorMessage?: string
): Promise<void> {
  const database = await getDB();
  const operation = await database.get('operations-queue', id);
  
  if (operation) {
    operation.status = status;
    operation.updatedAt = Date.now();
    if (errorMessage) {
      operation.errorMessage = errorMessage;
      operation.retryCount += 1;
    }
    await database.put('operations-queue', operation);
  }
}

/**
 * Sync all pending operations
 */
export async function syncPendingOperations(): Promise<{ success: number; failed: number }> {
  const pending = await getPendingOperations();
  let success = 0;
  let failed = 0;
  
  for (const operation of pending) {
    try {
      await updateOperationStatus(operation.id, 'syncing');
      
      // Send to server
      const response = await fetch('/api/mobile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });
      
      if (response.ok) {
        await updateOperationStatus(operation.id, 'completed');
        success++;
      } else {
        const error = await response.text();
        await updateOperationStatus(operation.id, 'failed', error);
        failed++;
      }
    } catch (error) {
      await updateOperationStatus(
        operation.id, 
        operation.retryCount >= 3 ? 'failed' : 'pending',
        error instanceof Error ? error.message : 'Network error'
      );
      failed++;
    }
  }
  
  return { success, failed };
}

// ═══════════════════════════════════════════════════════════════════
//                       SCAN HISTORY
// ═══════════════════════════════════════════════════════════════════

/**
 * Log a scan
 */
export async function logScan(
  barcode: string,
  type: string,
  context: string,
  result: 'success' | 'not_found' | 'error',
  entityId?: string
): Promise<void> {
  const database = await getDB();
  const id = `scan-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  await database.put('scan-history', {
    id,
    barcode,
    type,
    entityId,
    context,
    result,
    timestamp: Date.now(),
  });
  
  // Keep only last 500 scans
  const allScans = await database.getAllFromIndex('scan-history', 'by-timestamp');
  if (allScans.length > 500) {
    const toDelete = allScans.slice(0, allScans.length - 500);
    const tx = database.transaction('scan-history', 'readwrite');
    await Promise.all(toDelete.map(scan => tx.store.delete(scan.id)));
    await tx.done;
  }
}

/**
 * Get recent scans
 */
export async function getRecentScans(limit = 20): Promise<ScanHistoryItem[]> {
  const database = await getDB();
  const allScans = await database.getAllFromIndex('scan-history', 'by-timestamp');
  return allScans.reverse().slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════
//                       SYNC METADATA
// ═══════════════════════════════════════════════════════════════════

/**
 * Update sync metadata
 */
async function updateSyncMetadata(key: string, recordCount: number): Promise<void> {
  const database = await getDB();
  await database.put('sync-metadata', {
    key,
    lastSync: Date.now(),
    recordCount,
  });
}

/**
 * Get sync metadata
 */
export async function getSyncMetadata(key: string): Promise<SyncMetadata | undefined> {
  const database = await getDB();
  return database.get('sync-metadata', key);
}

/**
 * Get all sync metadata
 */
export async function getAllSyncMetadata(): Promise<SyncMetadata[]> {
  const database = await getDB();
  return database.getAll('sync-metadata');
}

// ═══════════════════════════════════════════════════════════════════
//                       SYNC SERVICE
// ═══════════════════════════════════════════════════════════════════

/**
 * Download master data from server
 */
export async function downloadMasterData(): Promise<{ parts: number; locations: number }> {
  try {
    // Download parts
    const partsResponse = await fetch('/api/mobile/sync/parts');
    if (partsResponse.ok) {
      const parts = await partsResponse.json();
      await cacheParts(parts);
    }
    
    // Download locations
    const locationsResponse = await fetch('/api/mobile/sync/locations');
    if (locationsResponse.ok) {
      const locations = await locationsResponse.json();
      await cacheLocations(locations);
    }
    
    const partsMetadata = await getSyncMetadata('parts');
    const locationsMetadata = await getSyncMetadata('locations');
    
    return {
      parts: partsMetadata?.recordCount || 0,
      locations: locationsMetadata?.recordCount || 0,
    };
  } catch (error) {
    clientLogger.error('Failed to download master data', error);
    throw error;
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  const database = await getDB();
  
  await Promise.all([
    database.clear('parts-cache'),
    database.clear('locations-cache'),
    database.clear('scan-history'),
    database.clear('sync-metadata'),
  ]);
}

/**
 * Get offline status summary
 */
export async function getOfflineStatus(): Promise<{
  isOnline: boolean;
  pendingOperations: number;
  cachedParts: number;
  cachedLocations: number;
  lastSync: number | null;
}> {
  const partsMetadata = await getSyncMetadata('parts');
  const locationsMetadata = await getSyncMetadata('locations');
  const pendingCount = await getPendingOperationsCount();
  
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingOperations: pendingCount,
    cachedParts: partsMetadata?.recordCount || 0,
    cachedLocations: locationsMetadata?.recordCount || 0,
    lastSync: partsMetadata?.lastSync || null,
  };
}

// Export types for use in components
export type { MobileDB };
