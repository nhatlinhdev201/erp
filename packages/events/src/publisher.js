// ============================================================
// @linkk/events - Event Publisher
// Usage:
//   import { publish } from '@linkk/events/publisher';
//   await publish('lerp.customer.created', { id, name, email }, ctx);
// ============================================================
import { getJetStream, sc } from './connection';
/**
 * Publish an event to NATS JetStream
 * @param subject - Event subject (e.g., 'lerp.customer.created')
 * @param data - Event payload
 * @param context - Tenant and user context
 * @returns Published event envelope
 */
export async function publish(subject, data, context) {
    const js = await getJetStream();
    const envelope = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
        type: subject,
        source: context.source || process.env.MODULE_NAME || 'unknown',
        timestamp: new Date().toISOString(),
        tenantId: context.tenantId,
        userId: context.userId,
        data,
    };
    const payload = sc.encode(JSON.stringify(envelope));
    const ack = await js.publish(subject, payload, {
        msgID: envelope.id, // Deduplication
    });
    console.log(`[EVENT] Published ${subject} → stream=${ack.stream}, seq=${ack.seq}`);
    return envelope;
}
/**
 * Batch publish multiple events
 */
export async function publishBatch(events, context) {
    const results = [];
    for (const event of events) {
        const envelope = await publish(event.subject, event.data, context);
        results.push(envelope);
    }
    return results;
}
//# sourceMappingURL=publisher.js.map