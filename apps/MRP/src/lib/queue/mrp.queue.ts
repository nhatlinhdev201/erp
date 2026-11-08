// =============================================================================
// L-ERP MRP - MRP QUEUE
// In-memory queue implementation (BullMQ disabled for Render compatibility)
// =============================================================================

import { logger } from '@/lib/logger';

export const MRP_QUEUE_NAME = 'mrp-calculation-queue';

export interface MrpJobData {
  runId?: string;
  planningHorizonDays: number;
  includeConfirmed: boolean;
  includeDraft: boolean;
  includeSafetyStock: boolean;
  userId?: string;
}

interface QueuedJob {
  id: string;
  data: MrpJobData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// In-memory job queue
const jobQueue: QueuedJob[] = [];
let jobIdCounter = 0;

// Fake Queue class for compatibility
class InMemoryQueue {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async add(jobName: string, data: MrpJobData) {
    const job: QueuedJob = {
      id: `job-${++jobIdCounter}`,
      data,
      status: 'pending',
      createdAt: new Date(),
    };
    jobQueue.push(job);

    logger.info(`[MRP-Queue] Job ${job.id} added to queue (in-memory mode)`);

    return {
      id: job.id,
      name: jobName,
      data,
    };
  }

  async getJobs(status?: string[]) {
    if (!status) return jobQueue;
    return jobQueue.filter(j => status.includes(j.status));
  }

  async getJob(id: string) {
    return jobQueue.find(j => j.id === id);
  }

  async close() {
    // No-op for in-memory
  }
}

export const mrpQueue = new InMemoryQueue(MRP_QUEUE_NAME);

export async function addMrpJob(data: MrpJobData) {
  return mrpQueue.add('calculate-mrp', data);
}

// Note: In production without Redis, MRP calculations run synchronously
// The job queue is kept for API compatibility but jobs are not processed by workers
