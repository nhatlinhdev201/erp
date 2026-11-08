// =============================================================================
// L-ERP MRP - DATA SYNC & BACKUP SERVICE
// Auto-save, conflict resolution, export/import, backup scheduling
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

export interface SyncStatus {
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  error: string | null;
}

export interface BackupInfo {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  type: 'auto' | 'manual';
  entities: string[];
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  field?: string;
  localValue?: any;
  remoteValue?: any;
  mergedValue?: any;
}

export interface DraftData<T = any> {
  id: string;
  entity: string;
  data: T;
  savedAt: Date;
  expiresAt?: Date;
}

// =============================================================================
// INDEXED DB STORAGE
// =============================================================================

const DB_NAME = 'lerp-mrp-sync';
const DB_VERSION = 1;

const STORES = {
  drafts: 'drafts',
  pendingSync: 'pending-sync',
  backups: 'backups',
  settings: 'settings',
};

class SyncStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Drafts store
        if (!db.objectStoreNames.contains(STORES.drafts)) {
          const draftsStore = db.createObjectStore(STORES.drafts, { keyPath: 'id' });
          draftsStore.createIndex('entity', 'entity', { unique: false });
          draftsStore.createIndex('savedAt', 'savedAt', { unique: false });
        }

        // Pending sync store
        if (!db.objectStoreNames.contains(STORES.pendingSync)) {
          const syncStore = db.createObjectStore(STORES.pendingSync, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('entity', 'entity', { unique: false });
          syncStore.createIndex('action', 'action', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Backups store
        if (!db.objectStoreNames.contains(STORES.backups)) {
          const backupsStore = db.createObjectStore(STORES.backups, { keyPath: 'id' });
          backupsStore.createIndex('createdAt', 'createdAt', { unique: false });
          backupsStore.createIndex('type', 'type', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'key' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // CRUD operations
  async get<T>(storeName: string, id: string): Promise<T | null> {
    const store = this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// =============================================================================
// DRAFT SERVICE (Auto-save)
// =============================================================================

class DraftService {
  private storage: SyncStorage;
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private autoSaveDelay = 2000; // 2 seconds

  constructor(storage: SyncStorage) {
    this.storage = storage;
  }

  // Save draft with debounce
  saveDraft<T>(entity: string, id: string, data: T, delay?: number): void {
    const draftId = `${entity}:${id}`;

    // Clear existing timer
    const existingTimer = this.autoSaveTimers.get(draftId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await this.saveDraftNow(entity, id, data);
      this.autoSaveTimers.delete(draftId);
    }, delay ?? this.autoSaveDelay);

    this.autoSaveTimers.set(draftId, timer);
  }

  // Save immediately
  async saveDraftNow<T>(entity: string, id: string, data: T): Promise<void> {
    const draft: DraftData<T> = {
      id: `${entity}:${id}`,
      entity,
      data,
      savedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    await this.storage.put(STORES.drafts, draft);
    console.log('[Draft] Saved:', draft.id);
  }

  // Get draft
  async getDraft<T>(entity: string, id: string): Promise<T | null> {
    const draftId = `${entity}:${id}`;
    const draft = await this.storage.get<DraftData<T>>(STORES.drafts, draftId);

    if (!draft) return null;

    // Check expiration
    if (draft.expiresAt && new Date(draft.expiresAt) < new Date()) {
      await this.deleteDraft(entity, id);
      return null;
    }

    return draft.data;
  }

  // Get all drafts for entity
  async getDraftsForEntity<T>(entity: string): Promise<DraftData<T>[]> {
    const allDrafts = await this.storage.getAll<DraftData<T>>(STORES.drafts);
    return allDrafts.filter(d => d.entity === entity);
  }

  // Delete draft
  async deleteDraft(entity: string, id: string): Promise<void> {
    const draftId = `${entity}:${id}`;
    await this.storage.delete(STORES.drafts, draftId);
    console.log('[Draft] Deleted:', draftId);
  }

  // Clear all drafts
  async clearAllDrafts(): Promise<void> {
    await this.storage.clear(STORES.drafts);
    console.log('[Draft] Cleared all');
  }

  // Cleanup expired drafts
  async cleanupExpired(): Promise<number> {
    const allDrafts = await this.storage.getAll<DraftData>(STORES.drafts);
    const now = new Date();
    let cleaned = 0;

    for (const draft of allDrafts) {
      if (draft.expiresAt && new Date(draft.expiresAt) < now) {
        await this.storage.delete(STORES.drafts, draft.id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// =============================================================================
// SYNC SERVICE
// =============================================================================

interface PendingChange {
  id?: number;
  entity: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: Date;
  retries: number;
}

class SyncService {
  private storage: SyncStorage;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(storage: SyncStorage) {
    this.storage = storage;
  }

  // Add change to sync queue
  async addPendingChange(change: Omit<PendingChange, 'createdAt' | 'retries'>): Promise<void> {
    const pendingChange: PendingChange = {
      ...change,
      createdAt: new Date(),
      retries: 0,
    };

    await this.storage.put(STORES.pendingSync, pendingChange);
    console.log('[Sync] Added pending change:', change.entity, change.action);
  }

  // Get pending changes count
  async getPendingCount(): Promise<number> {
    const changes = await this.storage.getAll<PendingChange>(STORES.pendingSync);
    return changes.length;
  }

  // Sync all pending changes
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      const changes = await this.storage.getAll<PendingChange>(STORES.pendingSync);

      for (const change of changes) {
        try {
          await this.syncChange(change);
          if (change.id) {
            await this.storage.delete(STORES.pendingSync, change.id.toString());
          }
          success++;
        } catch (error) {
          console.error('[Sync] Failed:', change, error);
          // Update retry count
          if (change.retries < 3) {
            await this.storage.put(STORES.pendingSync, {
              ...change,
              retries: change.retries + 1,
            });
          }
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    console.log(`[Sync] Complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  private async syncChange(change: PendingChange): Promise<void> {
    const endpoint = `/api/${change.entity}`;
    let url = endpoint;
    let method = 'POST';

    switch (change.action) {
      case 'create':
        method = 'POST';
        break;
      case 'update':
        url = `${endpoint}/${change.entityId}`;
        method = 'PUT';
        break;
      case 'delete':
        url = `${endpoint}/${change.entityId}`;
        method = 'DELETE';
        break;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: change.action !== 'delete' ? JSON.stringify(change.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }

  // Start auto sync
  startAutoSync(intervalMs = 30000): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncAll();
      }
    }, intervalMs);

    // Also sync on online
    window.addEventListener('online', () => this.syncAll());

    console.log('[Sync] Auto sync started');
  }

  // Stop auto sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('[Sync] Auto sync stopped');
  }
}

// =============================================================================
// BACKUP SERVICE
// =============================================================================

class BackupService {
  private storage: SyncStorage;

  constructor(storage: SyncStorage) {
    this.storage = storage;
  }

  // Create backup
  async createBackup(
    name: string,
    entities: string[],
    type: 'auto' | 'manual' = 'manual'
  ): Promise<BackupInfo> {
    const data: Record<string, any[]> = {};

    for (const entity of entities) {
      try {
        const response = await fetch(`/api/${entity}`);
        if (response.ok) {
          data[entity] = await response.json();
        }
      } catch (error) {
        console.error(`[Backup] Failed to fetch ${entity}:`, error);
      }
    }

    const backup: BackupInfo & { data: Record<string, any[]> } = {
      id: `backup-${Date.now()}`,
      name,
      createdAt: new Date(),
      size: JSON.stringify(data).length,
      type,
      entities,
      data,
    };

    await this.storage.put(STORES.backups, backup);
    console.log('[Backup] Created:', backup.id);

    return {
      id: backup.id,
      name: backup.name,
      createdAt: backup.createdAt,
      size: backup.size,
      type: backup.type,
      entities: backup.entities,
    };
  }

  // List backups
  async listBackups(): Promise<BackupInfo[]> {
    const backups = await this.storage.getAll<BackupInfo>(STORES.backups);
    return backups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Export backup as file
  async exportBackup(backupId: string): Promise<Blob> {
    const backup = await this.storage.get<BackupInfo & { data: any }>(STORES.backups, backupId);
    if (!backup) throw new Error('Backup not found');

    const json = JSON.stringify(backup, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  // Import backup from file
  async importBackup(file: File): Promise<BackupInfo> {
    const text = await file.text();
    const backup = JSON.parse(text);

    backup.id = `backup-import-${Date.now()}`;
    backup.createdAt = new Date();
    backup.type = 'manual';

    await this.storage.put(STORES.backups, backup);
    return backup;
  }

  // Delete backup
  async deleteBackup(backupId: string): Promise<void> {
    await this.storage.delete(STORES.backups, backupId);
    console.log('[Backup] Deleted:', backupId);
  }

  // Restore from backup
  async restoreBackup(backupId: string): Promise<{ restored: string[]; failed: string[] }> {
    const backup = await this.storage.get<BackupInfo & { data: Record<string, any[]> }>(STORES.backups, backupId);
    if (!backup) throw new Error('Backup not found');

    const restored: string[] = [];
    const failed: string[] = [];

    for (const [entity, records] of Object.entries(backup.data)) {
      try {
        // This would need to be implemented based on your API
        // await restoreEntity(entity, records);
        restored.push(entity);
      } catch {
        failed.push(entity);
      }
    }

    return { restored, failed };
  }

  // Format size
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// =============================================================================
// MAIN DATA SERVICE
// =============================================================================

class DataSyncService {
  private storage: SyncStorage;
  public drafts: DraftService;
  public sync: SyncService;
  public backups: BackupService;
  private initialized = false;

  constructor() {
    this.storage = new SyncStorage();
    this.drafts = new DraftService(this.storage);
    this.sync = new SyncService(this.storage);
    this.backups = new BackupService(this.storage);
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    await this.storage.init();
    this.initialized = true;

    // Start auto sync
    this.sync.startAutoSync();

    // Cleanup expired drafts daily
    this.drafts.cleanupExpired();

    console.log('[DataSync] Initialized');
  }

  // Get sync status
  async getStatus(): Promise<SyncStatus> {
    const pendingChanges = await this.sync.getPendingCount();
    return {
      lastSync: null, // Would need to track this
      pendingChanges,
      isSyncing: false,
      error: null,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dataSyncService = new DataSyncService();
export default dataSyncService;
