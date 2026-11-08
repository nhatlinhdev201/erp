// ============================================================
// @linkk/events — Event Schema Versioning + Idempotency
// RRI-T Upgrade: BA Analyst × D5 Data Integrity × DATA Axis
//
// Fixes:
// - No event versioning → Semantic versioned schemas
// - No backward compat → Up-migration transforms
// - No idempotency → Deduplication with idempotency keys
// - No event catalog → Self-documenting event registry
// ============================================================
// ─── Schema Registry ────────────────────────────────────────
class EventSchemaRegistry {
    schemas = new Map();
    /**
     * Register an event schema version
     */
    register(schema) {
        if (!this.schemas.has(schema.type)) {
            this.schemas.set(schema.type, new Map());
        }
        this.schemas.get(schema.type).set(schema.version, schema);
    }
    /**
     * Get latest version number for an event type
     */
    getLatestVersion(type) {
        const versions = this.schemas.get(type);
        if (!versions || versions.size === 0)
            return 1;
        return Math.max(...versions.keys());
    }
    /**
     * Get schema for specific version
     */
    getSchema(type, version) {
        return this.schemas.get(type)?.get(version);
    }
    /**
     * Migrate event data from one version to the latest
     */
    migrate(type, data, fromVersion) {
        const versions = this.schemas.get(type);
        if (!versions)
            return { data, version: fromVersion };
        const latestVersion = this.getLatestVersion(type);
        let currentData = data;
        for (let v = fromVersion + 1; v <= latestVersion; v++) {
            const schema = versions.get(v);
            if (schema?.upMigrate) {
                currentData = schema.upMigrate(currentData);
            }
        }
        return { data: currentData, version: latestVersion };
    }
    /**
     * Validate event data against its schema
     */
    validate(type, version, data) {
        const schema = this.getSchema(type, version);
        if (!schema?.validate)
            return { valid: true };
        return schema.validate(data);
    }
    /**
     * List all registered event types and their versions
     */
    catalog() {
        const result = [];
        for (const [type, versions] of this.schemas) {
            const versionNumbers = Array.from(versions.keys()).sort((a, b) => a - b);
            const latest = versions.get(Math.max(...versionNumbers));
            result.push({
                type,
                versions: versionNumbers,
                latestVersion: Math.max(...versionNumbers),
                description: latest?.description || '',
            });
        }
        return result.sort((a, b) => a.type.localeCompare(b.type));
    }
}
// ─── Singleton Registry ─────────────────────────────────────
let registryInstance = null;
export function getSchemaRegistry() {
    if (!registryInstance) {
        registryInstance = new EventSchemaRegistry();
        registerDefaultSchemas(registryInstance);
    }
    return registryInstance;
}
// ─── Default ERP Event Schemas ──────────────────────────────
function registerDefaultSchemas(registry) {
    // ── Customer Events ───────────────────────────────
    registry.register({
        type: 'lerp.customer.created',
        version: 1,
        description: 'Khách hàng mới được tạo / New customer created',
        validate: (data) => {
            const errors = [];
            if (!data.id)
                errors.push('Missing customer id');
            if (!data.name)
                errors.push('Missing customer name');
            return { valid: errors.length === 0, errors };
        },
    });
    registry.register({
        type: 'lerp.customer.created',
        version: 2,
        description: 'Customer created — added taxCode and address fields',
        upMigrate: (data) => ({
            ...data,
            taxCode: data.taxCode || null,
            address: data.address || { province: '', district: '', ward: '', street: '' },
            tags: data.tags || [],
        }),
    });
    // ── Order Events ──────────────────────────────────
    registry.register({
        type: 'lerp.order.created',
        version: 1,
        description: 'Đơn hàng mới / New order created',
        validate: (data) => {
            const errors = [];
            if (!data.orderId)
                errors.push('Missing orderId');
            if (!data.customerId)
                errors.push('Missing customerId');
            if (!Array.isArray(data.lines) || data.lines.length === 0)
                errors.push('Order must have at least one line');
            return { valid: errors.length === 0, errors };
        },
    });
    registry.register({
        type: 'lerp.order.created',
        version: 2,
        description: 'Order created — added payment method and shipping info',
        upMigrate: (data) => ({
            ...data,
            paymentMethod: data.paymentMethod || 'COD',
            shippingProvider: data.shippingProvider || null,
            estimatedDelivery: data.estimatedDelivery || null,
        }),
    });
    registry.register({
        type: 'lerp.order.status_changed',
        version: 1,
        description: 'Trạng thái đơn hàng thay đổi / Order status changed',
    });
    // ── Inventory Events ──────────────────────────────
    registry.register({
        type: 'lerp.inventory.adjusted',
        version: 1,
        description: 'Tồn kho điều chỉnh / Inventory adjusted',
        validate: (data) => {
            const errors = [];
            if (!data.productId)
                errors.push('Missing productId');
            if (typeof data.quantity !== 'number')
                errors.push('quantity must be a number');
            if (!data.reason)
                errors.push('Missing adjustment reason');
            return { valid: errors.length === 0, errors };
        },
    });
    registry.register({
        type: 'lerp.inventory.low_stock',
        version: 1,
        description: 'Cảnh báo tồn kho thấp / Low stock warning',
    });
    // ── Employee Events ───────────────────────────────
    registry.register({
        type: 'lerp.employee.created',
        version: 1,
        description: 'Nhân viên mới / New employee created',
    });
    registry.register({
        type: 'lerp.employee.terminated',
        version: 1,
        description: 'Nhân viên nghỉ việc / Employee terminated',
    });
    // ── Accounting Events ─────────────────────────────
    registry.register({
        type: 'lerp.accounting.journal_posted',
        version: 1,
        description: 'Bút toán đã ghi sổ / Journal entry posted',
        validate: (data) => {
            const errors = [];
            if (!data.journalId)
                errors.push('Missing journalId');
            if (!data.periodId)
                errors.push('Missing periodId');
            return { valid: errors.length === 0, errors };
        },
    });
    registry.register({
        type: 'lerp.accounting.period_closed',
        version: 1,
        description: 'Kỳ kế toán đóng / Accounting period closed',
    });
    // ── Invoice Events ────────────────────────────────
    registry.register({
        type: 'lerp.invoice.created',
        version: 1,
        description: 'Hóa đơn tạo mới / Invoice created',
    });
    registry.register({
        type: 'lerp.invoice.sent',
        version: 1,
        description: 'Hóa đơn đã gửi / Invoice sent to customer',
    });
    // ── Production Events ─────────────────────────────
    registry.register({
        type: 'lerp.production.order_created',
        version: 1,
        description: 'Lệnh sản xuất tạo / Production order created',
    });
    registry.register({
        type: 'lerp.production.completed',
        version: 1,
        description: 'Sản xuất hoàn thành / Production completed',
    });
}
export class IdempotencyStore {
    records = new Map();
    maxSize;
    defaultTTLMs;
    cleanupInterval = null;
    constructor(options = {}) {
        this.maxSize = options.maxSize || 50000;
        this.defaultTTLMs = options.defaultTTLMs || 24 * 60 * 60 * 1000; // 24h
        // Periodic cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
        // Allow process to exit
        if (this.cleanupInterval.unref)
            this.cleanupInterval.unref();
    }
    /**
     * Generate idempotency key from event properties
     */
    static generateKey(params) {
        const parts = [params.type, params.tenantId];
        if (params.entityId)
            parts.push(params.entityId);
        if (params.userId)
            parts.push(params.userId);
        if (params.timestamp) {
            // Round to nearest second to handle minor timing differences
            const ts = new Date(params.timestamp);
            ts.setMilliseconds(0);
            parts.push(ts.toISOString());
        }
        return parts.join(':');
    }
    /**
     * Check if an event has already been processed
     */
    isDuplicate(key) {
        const record = this.records.get(key);
        if (!record)
            return false;
        if (Date.now() > record.expiresAt) {
            this.records.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Get the idempotency record for a key
     */
    get(key) {
        const record = this.records.get(key);
        if (!record)
            return undefined;
        if (Date.now() > record.expiresAt) {
            this.records.delete(key);
            return undefined;
        }
        return record;
    }
    /**
     * Record that an event has been processed
     */
    record(key, eventId, result, ttlMs) {
        // Evict oldest if at capacity
        if (this.records.size >= this.maxSize) {
            const oldestKey = this.records.keys().next().value;
            if (oldestKey)
                this.records.delete(oldestKey);
        }
        this.records.set(key, {
            key,
            eventId,
            processedAt: new Date().toISOString(),
            result,
            expiresAt: Date.now() + (ttlMs || this.defaultTTLMs),
        });
    }
    /**
     * Remove expired records
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, record] of this.records) {
            if (now > record.expiresAt) {
                this.records.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Get store size
     */
    get size() {
        return this.records.size;
    }
    /**
     * Destroy store and stop cleanup timer
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.records.clear();
    }
}
// ─── Singleton Idempotency Store ────────────────────────────
let idempotencyInstance = null;
export function getIdempotencyStore() {
    if (!idempotencyInstance) {
        idempotencyInstance = new IdempotencyStore();
    }
    return idempotencyInstance;
}
// ─── Correlation & Causation IDs ────────────────────────────
/**
 * Generate a correlation ID for tracing event chains
 * All events in a business transaction share the same correlationId
 */
export function generateCorrelationId() {
    return `cor_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Generate a causation ID (the event that caused this event)
 */
export function generateCausationId(parentEventId) {
    return parentEventId;
}
// ─── Enhanced Publisher ─────────────────────────────────────
/**
 * Create a versioned event envelope with correlation + idempotency
 */
export function createVersionedEnvelope(params) {
    const registry = getSchemaRegistry();
    const version = registry.getLatestVersion(params.type);
    // Validate against schema
    const validation = registry.validate(params.type, version, params.data);
    if (!validation.valid) {
        throw new Error(`Event validation failed for ${params.type} v${version}: ${validation.errors?.join(', ')}`);
    }
    return {
        id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
        type: params.type,
        version,
        source: params.source || process.env.MODULE_NAME || 'unknown',
        timestamp: new Date().toISOString(),
        tenantId: params.tenantId,
        userId: params.userId,
        correlationId: params.correlationId,
        causationId: params.causationId,
        idempotencyKey: params.idempotencyKey,
        data: params.data,
        metadata: params.metadata,
    };
}
/**
 * Process incoming event with version migration + idempotency check
 */
export function processIncomingEvent(envelope, options = {}) {
    const registry = getSchemaRegistry();
    // Check idempotency
    if (options.checkIdempotency && envelope.idempotencyKey) {
        const store = getIdempotencyStore();
        if (store.isDuplicate(envelope.idempotencyKey)) {
            return { data: envelope.data, version: envelope.version, isDuplicate: true };
        }
    }
    // Migrate to latest version if needed
    const latestVersion = registry.getLatestVersion(envelope.type);
    if (envelope.version < latestVersion) {
        const migrated = registry.migrate(envelope.type, envelope.data, envelope.version);
        return { data: migrated.data, version: migrated.version, isDuplicate: false };
    }
    return { data: envelope.data, version: envelope.version, isDuplicate: false };
}
//# sourceMappingURL=versioning.js.map