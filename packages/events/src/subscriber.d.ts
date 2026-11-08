import type { EventEnvelope } from '@linkk/shared';
export type EventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void>;
interface SubscribeOptions {
    /** Filter by tenant (optional) */
    tenantId?: string;
    /** Start from: 'new' (only future) or 'all' (replay from beginning) */
    startFrom?: 'new' | 'all';
    /** Max number of inflight messages before ack */
    maxInflight?: number;
    /** Ack wait timeout in milliseconds */
    ackWaitMs?: number;
}
/**
 * Subscribe to events with durable consumer (survives restarts)
 * @param subject - Event subject pattern (e.g., 'lerp.customer.>' for all customer events)
 * @param consumerName - Unique consumer name (e.g., 'crm-customer-sync')
 * @param handler - Async function to process each event
 * @param options - Subscription options
 */
export declare function subscribe<T = unknown>(subject: string, consumerName: string, handler: EventHandler<T>, options?: SubscribeOptions): Promise<{
    unsubscribe: () => void;
}>;
export {};
//# sourceMappingURL=subscriber.d.ts.map