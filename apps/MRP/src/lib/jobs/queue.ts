// =============================================================================
// L-ERP MRP - BACKGROUND JOBS
// In-memory queue implementation (BullMQ disabled for Render compatibility)
// =============================================================================

// =============================================================================
// JOB DATA TYPES
// =============================================================================

import { logger } from '@/lib/logger';

export interface MRPJobData {
  tenantId: string;
  userId: string;
  runId?: string;
  options: {
    startDate: string;
    endDate: string;
    includeDemand: boolean;
    includeSupply: boolean;
    includeWIP: boolean;
    planningHorizon: number;
  };
}

export interface ReportJobData {
  tenantId: string;
  userId: string;
  reportType: 'inventory' | 'sales' | 'production' | 'quality' | 'mrp' | 'custom';
  reportName: string;
  parameters: Record<string, unknown>;
  format: 'pdf' | 'excel' | 'csv';
  emailTo?: string[];
}

export interface NotificationJobData {
  tenantId: string;
  userId?: string;
  userIds?: string[];
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
  channels: ('app' | 'email' | 'push')[];
}

export interface ExportJobData {
  tenantId: string;
  userId: string;
  exportType: 'parts' | 'inventory' | 'orders' | 'workorders' | 'all';
  format: 'excel' | 'csv' | 'json';
  filters?: Record<string, unknown>;
  emailWhenDone?: boolean;
}

export interface ImportJobData {
  tenantId: string;
  userId: string;
  importType: 'parts' | 'inventory' | 'orders' | 'bom';
  fileKey: string;
  fileName: string;
  options: {
    updateExisting: boolean;
    skipErrors: boolean;
    dryRun: boolean;
  };
}

export interface EmailJobData {
  tenantId: string;
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export interface ScheduledTaskData {
  tenantId: string;
  taskType: 'backup' | 'cleanup' | 'sync' | 'alert-check' | 'usage-report';
  parameters?: Record<string, unknown>;
}

// =============================================================================
// IN-MEMORY QUEUE IMPLEMENTATION
// =============================================================================

interface QueuedJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  createdAt: Date;
  processedOn?: Date;
  finishedOn?: Date;
  failedReason?: string;
  returnvalue?: unknown;
  attemptsMade: number;
  progress: number;
}

class InMemoryQueue<T = unknown> {
  private jobs: Map<string, QueuedJob<T>> = new Map();
  private jobCounter = 0;
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  async add(jobName: string, data: T, opts?: { jobId?: string; priority?: number }) {
    const id = opts?.jobId || `${this.name}-${++this.jobCounter}`;
    const job: QueuedJob<T> = {
      id,
      name: jobName,
      data,
      status: 'waiting',
      createdAt: new Date(),
      attemptsMade: 0,
      progress: 0,
    };
    this.jobs.set(id, job);
    logger.info(`[Queue:${this.name}] Job ${id} added (in-memory mode)`);
    return job;
  }

  async addBulk(jobsData: Array<{ name: string; data: T; opts?: unknown }>) {
    return Promise.all(jobsData.map(j => this.add(j.name, j.data)));
  }

  async getJob(id: string) {
    return this.jobs.get(id) || null;
  }

  async getWaitingCount() {
    return Array.from(this.jobs.values()).filter(j => j.status === 'waiting').length;
  }

  async getActiveCount() {
    return Array.from(this.jobs.values()).filter(j => j.status === 'active').length;
  }

  async getCompletedCount() {
    return Array.from(this.jobs.values()).filter(j => j.status === 'completed').length;
  }

  async getFailedCount() {
    return Array.from(this.jobs.values()).filter(j => j.status === 'failed').length;
  }

  async getDelayedCount() {
    return Array.from(this.jobs.values()).filter(j => j.status === 'delayed').length;
  }

  async close() {
    // No-op for in-memory
  }
}

// =============================================================================
// QUEUE INSTANCES
// =============================================================================

export const queues = {
  mrp: new InMemoryQueue<MRPJobData>('mrp'),
  reports: new InMemoryQueue<ReportJobData>('reports'),
  notifications: new InMemoryQueue<NotificationJobData>('notifications'),
  exports: new InMemoryQueue<ExportJobData>('exports'),
  imports: new InMemoryQueue<ImportJobData>('imports'),
  emails: new InMemoryQueue<EmailJobData>('emails'),
  scheduled: new InMemoryQueue<ScheduledTaskData>('scheduled'),
};

// Fake queue events for compatibility
export const queueEvents = {
  mrp: { close: async () => {} },
  reports: { close: async () => {} },
  notifications: { close: async () => {} },
  exports: { close: async () => {} },
  imports: { close: async () => {} },
  emails: { close: async () => {} },
  scheduled: { close: async () => {} },
};

// =============================================================================
// JOB CREATORS
// =============================================================================

export const jobs = {
  mrp: {
    run: async (data: MRPJobData) => {
      return queues.mrp.add('run-mrp', data, {
        jobId: `mrp-${data.tenantId}-${Date.now()}`,
      });
    },
    scheduleRecurring: async (tenantId: string, _cronExpression: string) => {
      logger.info(`[Queue:mrp] Recurring job scheduling not available in in-memory mode`);
      return queues.mrp.add('scheduled-mrp', {
        tenantId,
        userId: 'system',
        options: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          includeDemand: true,
          includeSupply: true,
          includeWIP: true,
          planningHorizon: 30,
        },
      });
    },
  },

  reports: {
    generate: async (data: ReportJobData) => {
      return queues.reports.add('generate-report', data, {
        jobId: `report-${data.tenantId}-${data.reportType}-${Date.now()}`,
      });
    },
    scheduleRecurring: async (data: ReportJobData, _cronExpression: string) => {
      logger.info(`[Queue:reports] Recurring job scheduling not available in in-memory mode`);
      return queues.reports.add('scheduled-report', data);
    },
  },

  notifications: {
    send: async (data: NotificationJobData) => {
      return queues.notifications.add('send-notification', data);
    },
    sendBulk: async (notifications: NotificationJobData[]) => {
      return queues.notifications.addBulk(
        notifications.map(n => ({ name: 'send-notification', data: n }))
      );
    },
    lowStockAlert: async (
      tenantId: string,
      parts: Array<{ partId: string; partNumber: string; quantity: number; minStock: number }>
    ) => {
      return queues.notifications.add('low-stock-alert', {
        tenantId,
        type: 'warning',
        title: 'Low stock alert',
        message: `${parts.length} items need restocking`,
        channels: ['app', 'email'],
        data: { parts },
      });
    },
  },

  exports: {
    create: async (data: ExportJobData) => {
      return queues.exports.add('export-data', data, {
        jobId: `export-${data.tenantId}-${data.exportType}-${Date.now()}`,
      });
    },
  },

  imports: {
    create: async (data: ImportJobData) => {
      return queues.imports.add('import-data', data, {
        jobId: `import-${data.tenantId}-${data.importType}-${Date.now()}`,
      });
    },
  },

  emails: {
    send: async (data: EmailJobData) => {
      return queues.emails.add('send-email', data);
    },
    sendBulk: async (emails: EmailJobData[]) => {
      return queues.emails.addBulk(
        emails.map(e => ({ name: 'send-email', data: e }))
      );
    },
  },

  scheduled: {
    backup: async (tenantId: string) => {
      return queues.scheduled.add('backup', { tenantId, taskType: 'backup' });
    },
    cleanup: async (tenantId: string) => {
      return queues.scheduled.add('cleanup', { tenantId, taskType: 'cleanup' });
    },
    alertCheck: async (tenantId: string) => {
      return queues.scheduled.add('alert-check', { tenantId, taskType: 'alert-check' });
    },
  },
};

// =============================================================================
// JOB STATUS HELPERS
// =============================================================================

export async function getJobStatus(queue: keyof typeof queues, jobId: string) {
  const job = await queues[queue].getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    state: job.status,
    progress: job.progress,
    data: job.data,
    returnValue: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

export async function getQueueStats(queue: keyof typeof queues) {
  const q = queues[queue];

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function getAllQueueStats() {
  const stats: Record<string, unknown> = {};

  for (const queueName of Object.keys(queues)) {
    stats[queueName] = await getQueueStats(queueName as keyof typeof queues);
  }

  return stats;
}

// =============================================================================
// CLEANUP
// =============================================================================

export async function closeAllQueues() {
  await Promise.all([
    ...Object.values(queues).map(q => q.close()),
    ...Object.values(queueEvents).map(e => e.close()),
  ]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default jobs;
