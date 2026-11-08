import type { EventEnvelope } from '@linkk/shared';
/**
 * Publish an event to NATS JetStream
 * @param subject - Event subject (e.g., 'lerp.customer.created')
 * @param data - Event payload
 * @param context - Tenant and user context
 * @returns Published event envelope
 */
export declare function publish<T>(subject: string, data: T, context: {
    tenantId: string;
    userId: string;
    source?: string;
}): Promise<EventEnvelope<T>>;
/**
 * Batch publish multiple events
 */
export declare function publishBatch<T>(events: Array<{
    subject: string;
    data: T;
}>, context: {
    tenantId: string;
    userId: string;
    source?: string;
}): Promise<EventEnvelope<T>[]>;
//# sourceMappingURL=publisher.d.ts.map