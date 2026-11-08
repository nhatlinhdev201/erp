import type { EventEnvelope } from '@linkk/shared';
export interface DLQEntry<T = unknown> {
    id: string;
    originalEvent: EventEnvelope<T>;
    subject: string;
    consumerName: string;
    error: {
        message: string;
        stack?: string;
        code?: string;
    };
    retryCount: number;
    maxRetries: number;
    firstFailedAt: string;
    lastFailedAt: string;
    status: 'pending' | 'retrying' | 'replayed' | 'discarded';
    metadata?: Record<string, any>;
}
export interface RetryPolicy {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}
export interface DLQStats {
    total: number;
    pending: number;
    retrying: number;
    replayed: number;
    discarded: number;
    oldestEntry?: string;
    newestEntry?: string;
    topErrors: Array<{
        message: string;
        count: number;
    }>;
    byConsumer: Record<string, number>;
}
export declare const RETRY_POLICIES: Record<string, RetryPolicy>;
/**
 * Calculate delay with exponential backoff + jitter
 */
export declare function calculateRetryDelay(attempt: number, policy: RetryPolicy): number;
/**
 * Check if a message should be retried or sent to DLQ
 */
export declare function shouldRetry(retryCount: number, policy: RetryPolicy): boolean;
export declare class DeadLetterQueue {
    private entries;
    private maxSize;
    constructor(maxSize?: number);
    /**
     * Add a failed event to the DLQ
     */
    add<T>(params: {
        event: EventEnvelope<T>;
        subject: string;
        consumerName: string;
        error: Error;
        retryCount: number;
        maxRetries: number;
        metadata?: Record<string, any>;
    }): DLQEntry<T>;
    /**
     * Get DLQ entry by event ID
     */
    get(eventId: string): DLQEntry | undefined;
    /**
     * List DLQ entries with pagination and filters
     */
    list(options?: {
        status?: DLQEntry['status'];
        consumerName?: string;
        subject?: string;
        limit?: number;
        offset?: number;
    }): {
        entries: DLQEntry[];
        total: number;
    };
    /**
     * Mark entry for replay
     */
    markForReplay(eventId: string): DLQEntry | undefined;
    /**
     * Mark entry as replayed successfully
     */
    markReplayed(eventId: string): void;
    /**
     * Discard entry (give up)
     */
    discard(eventId: string): void;
    /**
     * Purge completed entries
     */
    purge(statuses?: DLQEntry['status'][]): number;
    /**
     * Get DLQ statistics
     */
    getStats(): DLQStats;
    /**
     * Get size of DLQ
     */
    get size(): number;
}
export declare function getDLQ(): DeadLetterQueue;
//# sourceMappingURL=dlq.d.ts.map