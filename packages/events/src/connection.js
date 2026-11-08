// ============================================================
// @linkk/events - NATS JetStream Connection Manager
// Singleton connection with auto-reconnect
// ============================================================
import { connect, StringCodec } from 'nats';
let connection = null;
let jetstream = null;
let jetstreamManager = null;
export const sc = StringCodec();
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
/**
 * Get or create NATS connection (singleton)
 */
export async function getConnection() {
    if (connection && !connection.isClosed()) {
        return connection;
    }
    connection = await connect({
        servers: NATS_URL,
        name: `erp-${process.env.MODULE_NAME || 'unknown'}`,
        reconnect: true,
        maxReconnectAttempts: -1, // Unlimited
        reconnectTimeWait: 2000, // 2s between attempts
        pingInterval: 30000, // 30s ping
    });
    // Handle connection events
    (async () => {
        for await (const status of connection.status()) {
            switch (status.type) {
                case 'reconnect':
                    console.log(`[NATS] Reconnected to ${status.data}`);
                    break;
                case 'disconnect':
                    console.warn('[NATS] Disconnected');
                    break;
                case 'error':
                    console.error('[NATS] Error:', status.data);
                    break;
            }
        }
    })();
    console.log(`[NATS] Connected to ${NATS_URL}`);
    return connection;
}
/**
 * Get JetStream client (for publish/subscribe with persistence)
 */
export async function getJetStream() {
    if (jetstream)
        return jetstream;
    const nc = await getConnection();
    jetstream = nc.jetstream();
    return jetstream;
}
/**
 * Get JetStream Manager (for stream/consumer management)
 */
export async function getJetStreamManager() {
    if (jetstreamManager)
        return jetstreamManager;
    const nc = await getConnection();
    jetstreamManager = await nc.jetstreamManager();
    return jetstreamManager;
}
/**
 * Ensure ERP streams exist (call once at app startup)
 */
export async function ensureStreams() {
    const jsm = await getJetStreamManager();
    const streams = [
        { name: 'L-ERP_CUSTOMERS', subjects: ['lerp.customer.>'] },
        { name: 'L-ERP_PRODUCTS', subjects: ['lerp.product.>'] },
        { name: 'L-ERP_EMPLOYEES', subjects: ['lerp.employee.>'] },
        { name: 'L-ERP_ORDERS', subjects: ['lerp.order.>'] },
        { name: 'L-ERP_INVENTORY', subjects: ['lerp.inventory.>'] },
        { name: 'L-ERP_PRODUCTION', subjects: ['lerp.production.>'] },
        { name: 'L-ERP_INVOICES', subjects: ['lerp.invoice.>'] },
        { name: 'L-ERP_ACCOUNTING', subjects: ['lerp.accounting.>'] },
        { name: 'L-ERP_SUPPLIERS', subjects: ['lerp.supplier.>'] },
    ];
    for (const stream of streams) {
        try {
            await jsm.streams.info(stream.name);
        }
        catch {
            // Stream doesn't exist, create it
            await jsm.streams.add({
                name: stream.name,
                subjects: stream.subjects,
                retention: 'limits',
                max_age: 7 * 24 * 60 * 60 * 1_000_000_000, // 7 days in nanoseconds
                max_bytes: 1024 * 1024 * 512, // 512MB
                storage: 'file',
                num_replicas: 1,
                discard: 'old',
            });
            console.log(`[NATS] Created stream: ${stream.name}`);
        }
    }
}
/**
 * Gracefully close connection
 */
export async function closeConnection() {
    if (connection && !connection.isClosed()) {
        await connection.drain();
        connection = null;
        jetstream = null;
        jetstreamManager = null;
        console.log('[NATS] Connection closed');
    }
}
//# sourceMappingURL=connection.js.map