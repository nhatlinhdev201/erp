// ============================================================
// @linkk/events - Event Subscriber
// Usage:
//   import { subscribe } from '@linkk/events/subscriber';
//   await subscribe('lerp.customer.created', 'crm-service', async (event) => {
//     console.log('New customer:', event.data);
//   });
// ============================================================
import { AckPolicy, DeliverPolicy } from 'nats';
import { getJetStream, getJetStreamManager, sc } from './connection';
/**
 * Subscribe to events with durable consumer (survives restarts)
 * @param subject - Event subject pattern (e.g., 'lerp.customer.>' for all customer events)
 * @param consumerName - Unique consumer name (e.g., 'crm-customer-sync')
 * @param handler - Async function to process each event
 * @param options - Subscription options
 */
export async function subscribe(subject, consumerName, handler, options = {}) {
    const js = await getJetStream();
    const jsm = await getJetStreamManager();
    // Determine which stream this subject belongs to
    const streamName = resolveStreamName(subject);
    // Create or get durable consumer
    try {
        await jsm.consumers.info(streamName, consumerName);
    }
    catch {
        await jsm.consumers.add(streamName, {
            durable_name: consumerName,
            filter_subject: subject,
            ack_policy: AckPolicy.Explicit,
            deliver_policy: options.startFrom === 'all'
                ? DeliverPolicy.All
                : DeliverPolicy.New,
            max_ack_pending: options.maxInflight || 10,
            ack_wait: (options.ackWaitMs || 30000) * 1_000_000, // Convert to nanoseconds
        });
        console.log(`[EVENT] Created consumer: ${consumerName} on ${streamName}`);
    }
    // Subscribe and process messages
    const consumer = await js.consumers.get(streamName, consumerName);
    const messages = await consumer.consume();
    let running = true;
    (async () => {
        for await (const msg of messages) {
            if (!running)
                break;
            try {
                const envelope = JSON.parse(sc.decode(msg.data));
                // Filter by tenant if specified
                if (options.tenantId && envelope.tenantId !== options.tenantId) {
                    msg.ack();
                    continue;
                }
                await handler(envelope);
                msg.ack();
            }
            catch (error) {
                console.error(`[EVENT] Handler error for ${subject}:`, error);
                // NAK with delay (retry after 5s)
                msg.nak(5000);
            }
        }
    })();
    console.log(`[EVENT] Subscribed to ${subject} as ${consumerName}`);
    return {
        unsubscribe: () => {
            running = false;
            messages.stop();
            console.log(`[EVENT] Unsubscribed ${consumerName} from ${subject}`);
        },
    };
}
/**
 * Resolve stream name from subject
 */
function resolveStreamName(subject) {
    const mapping = {
        'lerp.customer': 'L-ERP_CUSTOMERS',
        'lerp.product': 'L-ERP_PRODUCTS',
        'lerp.employee': 'L-ERP_EMPLOYEES',
        'lerp.order': 'L-ERP_ORDERS',
        'lerp.inventory': 'L-ERP_INVENTORY',
        'lerp.production': 'L-ERP_PRODUCTION',
        'lerp.invoice': 'L-ERP_INVOICES',
        'lerp.accounting': 'L-ERP_ACCOUNTING',
        'lerp.supplier': 'L-ERP_SUPPLIERS',
    };
    // Match subject prefix to stream
    for (const [prefix, stream] of Object.entries(mapping)) {
        if (subject.startsWith(prefix))
            return stream;
    }
    throw new Error(`Unknown stream for subject: ${subject}`);
}
//# sourceMappingURL=subscriber.js.map