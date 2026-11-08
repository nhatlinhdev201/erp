// Offline storage using IndexedDB via idb library
import { openDB, DBSchema, IDBPDatabase } from "idb";

// Database schema
interface RTRMobileDB extends DBSchema {
  // Cached parts for quick lookup
  parts: {
    key: string;
    value: {
      id: string;
      sku: string;
      name: string;
      description?: string;
      category?: string;
      uom: string;
      safetyStock?: number;
      reorderPoint?: number;
      cachedAt: Date;
    };
    indexes: {
      "by-sku": string;
      "by-name": string;
      "by-cached": Date;
    };
  };

  // Cached locations
  locations: {
    key: string;
    value: {
      id: string;
      code: string;
      name: string;
      warehouseId: string;
      warehouseName: string;
      zone?: string;
      aisle?: string;
      rack?: string;
      shelf?: string;
      bin?: string;
      cachedAt: Date;
    };
    indexes: {
      "by-code": string;
      "by-warehouse": string;
      "by-cached": Date;
    };
  };

  // Cached work orders
  workOrders: {
    key: string;
    value: {
      id: string;
      number: string;
      productId: string;
      productName: string;
      quantity: number;
      status: string;
      priority?: string;
      scheduledDate?: string;
      cachedAt: Date;
    };
    indexes: {
      "by-number": string;
      "by-status": string;
      "by-cached": Date;
    };
  };

  // Offline operations queue
  offlineOperations: {
    key: string;
    value: {
      id: string;
      operationType: string;
      entityType: string;
      entityId?: string;
      payload: Record<string, unknown>;
      status: "pending" | "syncing" | "failed" | "completed";
      attempts: number;
      lastError?: string;
      createdAt: Date;
      syncedAt?: Date;
    };
    indexes: {
      "by-status": string;
      "by-type": string;
      "by-created": Date;
    };
  };

  // Scan history
  scanHistory: {
    key: string;
    value: {
      id: string;
      barcode: string;
      barcodeType: string;
      entityType: string;
      entityId?: string;
      action?: string;
      location?: string;
      scannedAt: Date;
      synced: boolean;
    };
    indexes: {
      "by-barcode": string;
      "by-entity": string;
      "by-date": Date;
      "by-synced": number;
    };
  };

  // User preferences and settings
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: Date;
    };
  };

  // Pick lists for mobile picking
  pickLists: {
    key: string;
    value: {
      id: string;
      pickListNumber: string;
      status: string;
      assignedTo?: string;
      lines: Array<{
        id: string;
        partId: string;
        partSku: string;
        partName: string;
        locationId: string;
        locationCode: string;
        quantityRequired: number;
        quantityPicked: number;
        status: string;
      }>;
      cachedAt: Date;
    };
    indexes: {
      "by-number": string;
      "by-status": string;
      "by-cached": Date;
    };
  };
}

const DB_NAME = "lerp-mrp-mobile";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RTRMobileDB> | null = null;

// Initialize database
export async function initDB(): Promise<IDBPDatabase<RTRMobileDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RTRMobileDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Parts store
      if (!db.objectStoreNames.contains("parts")) {
        const partsStore = db.createObjectStore("parts", { keyPath: "id" });
        partsStore.createIndex("by-sku", "sku");
        partsStore.createIndex("by-name", "name");
        partsStore.createIndex("by-cached", "cachedAt");
      }

      // Locations store
      if (!db.objectStoreNames.contains("locations")) {
        const locationsStore = db.createObjectStore("locations", { keyPath: "id" });
        locationsStore.createIndex("by-code", "code");
        locationsStore.createIndex("by-warehouse", "warehouseId");
        locationsStore.createIndex("by-cached", "cachedAt");
      }

      // Work orders store
      if (!db.objectStoreNames.contains("workOrders")) {
        const workOrdersStore = db.createObjectStore("workOrders", { keyPath: "id" });
        workOrdersStore.createIndex("by-number", "number");
        workOrdersStore.createIndex("by-status", "status");
        workOrdersStore.createIndex("by-cached", "cachedAt");
      }

      // Offline operations store
      if (!db.objectStoreNames.contains("offlineOperations")) {
        const opsStore = db.createObjectStore("offlineOperations", { keyPath: "id" });
        opsStore.createIndex("by-status", "status");
        opsStore.createIndex("by-type", "operationType");
        opsStore.createIndex("by-created", "createdAt");
      }

      // Scan history store
      if (!db.objectStoreNames.contains("scanHistory")) {
        const scanStore = db.createObjectStore("scanHistory", { keyPath: "id" });
        scanStore.createIndex("by-barcode", "barcode");
        scanStore.createIndex("by-entity", "entityType");
        scanStore.createIndex("by-date", "scannedAt");
        scanStore.createIndex("by-synced", "synced");
      }

      // Settings store
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }

      // Pick lists store
      if (!db.objectStoreNames.contains("pickLists")) {
        const pickStore = db.createObjectStore("pickLists", { keyPath: "id" });
        pickStore.createIndex("by-number", "pickListNumber");
        pickStore.createIndex("by-status", "status");
        pickStore.createIndex("by-cached", "cachedAt");
      }
    },
  });

  return dbInstance;
}

// Get database instance
export async function getDB(): Promise<IDBPDatabase<RTRMobileDB>> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

// Parts operations
export async function cachePart(part: RTRMobileDB["parts"]["value"]): Promise<void> {
  const db = await getDB();
  await db.put("parts", { ...part, cachedAt: new Date() });
}

export async function cacheParts(parts: RTRMobileDB["parts"]["value"][]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("parts", "readwrite");
  const now = new Date();
  await Promise.all([
    ...parts.map((part) => tx.store.put({ ...part, cachedAt: now })),
    tx.done,
  ]);
}

export async function getPartById(id: string): Promise<RTRMobileDB["parts"]["value"] | undefined> {
  const db = await getDB();
  return db.get("parts", id);
}

export async function getPartBySku(sku: string): Promise<RTRMobileDB["parts"]["value"] | undefined> {
  const db = await getDB();
  return db.getFromIndex("parts", "by-sku", sku);
}

export async function searchParts(query: string): Promise<RTRMobileDB["parts"]["value"][]> {
  const db = await getDB();
  const allParts = await db.getAll("parts");
  const lowerQuery = query.toLowerCase();
  return allParts.filter(
    (part) =>
      part.sku.toLowerCase().includes(lowerQuery) ||
      part.name.toLowerCase().includes(lowerQuery)
  );
}

// Locations operations
export async function cacheLocation(location: RTRMobileDB["locations"]["value"]): Promise<void> {
  const db = await getDB();
  await db.put("locations", { ...location, cachedAt: new Date() });
}

export async function cacheLocations(locations: RTRMobileDB["locations"]["value"][]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("locations", "readwrite");
  const now = new Date();
  await Promise.all([
    ...locations.map((loc) => tx.store.put({ ...loc, cachedAt: now })),
    tx.done,
  ]);
}

export async function getLocationById(id: string): Promise<RTRMobileDB["locations"]["value"] | undefined> {
  const db = await getDB();
  return db.get("locations", id);
}

export async function getLocationByCode(code: string): Promise<RTRMobileDB["locations"]["value"] | undefined> {
  const db = await getDB();
  return db.getFromIndex("locations", "by-code", code);
}

// Work orders operations
export async function cacheWorkOrder(workOrder: RTRMobileDB["workOrders"]["value"]): Promise<void> {
  const db = await getDB();
  await db.put("workOrders", { ...workOrder, cachedAt: new Date() });
}

export async function getWorkOrderById(id: string): Promise<RTRMobileDB["workOrders"]["value"] | undefined> {
  const db = await getDB();
  return db.get("workOrders", id);
}

export async function getActiveWorkOrders(): Promise<RTRMobileDB["workOrders"]["value"][]> {
  const db = await getDB();
  const allWOs = await db.getAll("workOrders");
  return allWOs.filter((wo) => ["RELEASED", "IN_PROGRESS"].includes(wo.status));
}

// Offline operations
export async function queueOfflineOperation(
  operation: Omit<RTRMobileDB["offlineOperations"]["value"], "id" | "createdAt" | "status" | "attempts">
): Promise<string> {
  const db = await getDB();
  const id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.add("offlineOperations", {
    ...operation,
    id,
    status: "pending",
    attempts: 0,
    createdAt: new Date(),
  });
  return id;
}

export async function getPendingOperations(): Promise<RTRMobileDB["offlineOperations"]["value"][]> {
  const db = await getDB();
  return db.getAllFromIndex("offlineOperations", "by-status", "pending");
}

export async function updateOperationStatus(
  id: string,
  status: RTRMobileDB["offlineOperations"]["value"]["status"],
  error?: string
): Promise<void> {
  const db = await getDB();
  const op = await db.get("offlineOperations", id);
  if (op) {
    await db.put("offlineOperations", {
      ...op,
      status,
      lastError: error,
      attempts: op.attempts + 1,
      syncedAt: status === "completed" ? new Date() : undefined,
    });
  }
}

export async function deleteCompletedOperations(olderThan?: Date): Promise<void> {
  const db = await getDB();
  const all = await db.getAll("offlineOperations");
  const cutoff = olderThan || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days default
  const tx = db.transaction("offlineOperations", "readwrite");
  await Promise.all([
    ...all
      .filter((op) => op.status === "completed" && op.syncedAt && op.syncedAt < cutoff)
      .map((op) => tx.store.delete(op.id)),
    tx.done,
  ]);
}

// Scan history
export async function addScanHistory(
  scan: Omit<RTRMobileDB["scanHistory"]["value"], "id" | "scannedAt" | "synced">
): Promise<string> {
  const db = await getDB();
  const id = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.add("scanHistory", {
    ...scan,
    id,
    scannedAt: new Date(),
    synced: false,
  });
  return id;
}

export async function getRecentScans(limit = 50): Promise<RTRMobileDB["scanHistory"]["value"][]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("scanHistory", "by-date");
  return all.reverse().slice(0, limit);
}

// Settings
export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key, value, updatedAt: new Date() });
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const setting = await db.get("settings", key);
  return setting?.value as T | undefined;
}

// Pick lists
export async function cachePickList(pickList: RTRMobileDB["pickLists"]["value"]): Promise<void> {
  const db = await getDB();
  await db.put("pickLists", { ...pickList, cachedAt: new Date() });
}

export async function getPickListById(id: string): Promise<RTRMobileDB["pickLists"]["value"] | undefined> {
  const db = await getDB();
  return db.get("pickLists", id);
}

export async function getActivePickLists(): Promise<RTRMobileDB["pickLists"]["value"][]> {
  const db = await getDB();
  const all = await db.getAll("pickLists");
  return all.filter((pl) => ["PENDING", "IN_PROGRESS"].includes(pl.status));
}

// Cache management
type StoreNames = "parts" | "locations" | "workOrders" | "offlineOperations" | "scanHistory" | "settings" | "pickLists";

export async function clearCache(storeName?: StoreNames): Promise<void> {
  const db = await getDB();
  if (storeName) {
    await db.clear(storeName);
  } else {
    // Clear all stores except settings and offlineOperations
    await db.clear("parts");
    await db.clear("locations");
    await db.clear("workOrders");
    await db.clear("scanHistory");
    await db.clear("pickLists");
  }
}

export async function getCacheStats(): Promise<{
  parts: number;
  locations: number;
  workOrders: number;
  pendingOps: number;
  scans: number;
  pickLists: number;
}> {
  const db = await getDB();
  const [parts, locations, workOrders, pendingOps, scans, pickLists] = await Promise.all([
    db.count("parts"),
    db.count("locations"),
    db.count("workOrders"),
    db.countFromIndex("offlineOperations", "by-status", "pending"),
    db.count("scanHistory"),
    db.count("pickLists"),
  ]);
  return { parts, locations, workOrders, pendingOps, scans, pickLists };
}
