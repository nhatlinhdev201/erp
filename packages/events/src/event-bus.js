// ============================================================
// @linkk/events - Event Bus Client
// Type-safe event publishing and subscription with validation
// ============================================================
import { getJetStream, getConnection } from './connection';
import { AllEventSchemas } from './schemas';
import { generateCorrelationId, generateCausationId, processIncomingEvent, } from './versioning';
/**
 * Type-safe Event Bus for publishing and subscribing to events
 * Event Bus có kiểm tra kiểu và validation
 */
export class EventBus {
    config;
    subscriptions = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Publish a typed event with schema validation
     * Publish một event có kiểm tra schema
     */
    async publish(eventType, payload, context) {
        const schema = AllEventSchemas[eventType];
        if (!schema) {
            throw new Error(`Unknown event type: ${eventType}`);
        }
        // Validate payload
        const validatedPayload = schema.parse(payload);
        const correlationId = context.correlationId || generateCorrelationId();
        const causationId = context.causationId || generateCausationId();
        const event = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
            type: eventType,
            source: this.config.module,
            timestamp: new Date().toISOString(),
            correlationId,
            causationId,
            payload: validatedPayload,
            tenantId: context.tenantId,
            userId: context.userId,
            metadata: context.metadata,
        };
        const js = await getJetStream();
        const encoded = new TextEncoder().encode(JSON.stringify(event));
        try {
            const ack = await js.publish(eventType, encoded, {
                msgID: event.id,
                headers: {
                    'Correlation-Id': correlationId,
                    'Causation-Id': causationId,
                },
            });
            console.log(`[EventBus] Published ${eventType} → stream=${ack.stream}, seq=${ack.seq}, id=${event.id}`);
            return event;
        }
        catch (error) {
            console.error(`[EventBus] Failed to publish ${eventType}:`, error instanceof Error ? error.message : error);
            throw error;
        }
    }
    /**
     * Subscribe to a typed event with handler
     * Subscribe vào một event type có xử lý
     */
    async subscribe(eventType, handler, options) {
        const schema = AllEventSchemas[eventType];
        if (!schema) {
            throw new Error(`Unknown event type: ${eventType}`);
        }
        const consumerGroup = options?.consumerGroup || `${this.config.module}-${eventType}`;
        const maxRetries = options?.maxRetries ?? 3;
        const js = await getJetStream();
        try {
            // Ensure consumer exists or create it
            const opts = {
                durable: consumerGroup,
                deliverNew: true,
                maxRetries,
                ackPolicy: 'explicit',
            };
            const sub = await js.subscribe(eventType, opts);
            // Start consuming
            (async () => {
                for await (const msg of sub) {
                    try {
                        const eventData = JSON.parse(new TextDecoder().decode(msg.data));
                        const validated = schema.parse(eventData.payload);
                        const event = {
                            ...eventData,
                            payload: validated,
                        };
                        // Process and handle event
                        await processIncomingEvent(event);
                        await handler(event);
                        // Acknowledge successful processing
                        msg.ack();
                        console.log(`[EventBus] Processed ${eventType} from ${consumerGroup}, id=${event.id}`);
                    }
                    catch (error) {
                        console.error(`[EventBus] Error processing ${eventType} in ${consumerGroup}:`, error instanceof Error ? error.message : error);
                        if (options?.onError) {
                            try {
                                const eventData = JSON.parse(new TextDecoder().decode(msg.data));
                                await options.onError(error instanceof Error ? error : new Error(String(error)), eventData);
                            }
                            catch (handlerError) {
                                console.error('[EventBus] Error handler failed:', handlerError);
                            }
                        }
                        // Negative acknowledge - will retry
                        msg.nak();
                    }
                }
            })().catch((error) => {
                console.error(`[EventBus] Subscription error in ${consumerGroup}:`, error);
            });
            this.subscriptions.set(eventType, handler);
            console.log(`[EventBus] Subscribed to ${eventType} with consumer group ${consumerGroup}`);
        }
        catch (error) {
            console.error(`[EventBus] Failed to subscribe to ${eventType}:`, error instanceof Error ? error.message : error);
            throw error;
        }
    }
    /**
     * Publish multiple events atomically
     * Publish nhiều events cùng lúc
     */
    async publishBatch(events, context) {
        const correlationId = context.correlationId || generateCorrelationId();
        const results = [];
        for (const [index, { eventType, payload }] of events.entries()) {
            const causationId = index === 0 ? generateCausationId() : undefined;
            const event = await this.publish(eventType, payload, {
                ...context,
                correlationId,
                causationId,
            });
            results.push(event);
        }
        console.log(`[EventBus] Published batch of ${events.length} events with correlation ID ${correlationId}`);
        return results;
    }
    /**
     * Get subscription stats
     */
    getSubscriptionStats() {
        const stats = {};
        for (const [eventType, _] of this.subscriptions) {
            stats[eventType] = true;
        }
        return stats;
    }
    /**
     * Cleanup resources
     */
    async close() {
        const conn = await getConnection();
        await conn.close();
        console.log('[EventBus] Connection closed');
    }
}
/**
 * Factory function to create EventBus instance
 * Tạo EventBus instance
 */
export function createEventBus(config) {
    return new EventBus(config);
}
//# sourceMappingURL=event-bus.js.map