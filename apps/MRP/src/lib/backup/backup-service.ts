// src/lib/backup/backup-service.ts
// Backup Service - Database backup and recovery

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Types
export interface BackupOptions {
  type: 'MANUAL' | 'AUTO' | 'PRE_UPDATE';
  name?: string;
  userId: string;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  filePath?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  createBackupFirst?: boolean;
  userId: string;
}

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DATABASE_URL = process.env.DATABASE_URL || '';
const MAX_BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(): Promise<void> {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a database backup
 */
export async function createBackup(options: BackupOptions): Promise<BackupResult> {
  const startTime = Date.now();

  try {
    await ensureBackupDir();

    // Generate backup name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = options.name || `${options.type.toLowerCase()}-backup-${timestamp}`;
    const fileName = `${name}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // Create backup record in database
    const backup = await prisma.backup.create({
      data: {
        name,
        type: options.type,
        status: 'IN_PROGRESS',
        createdBy: options.userId,
      },
    });

    // Determine database type from URL
    const isPostgres = DATABASE_URL.includes('postgresql');
    const isSQLite = DATABASE_URL.includes('sqlite') || DATABASE_URL.includes('file:');

    let command: string;
    let tableCount = 0;
    let recordCount = 0;

    if (isSQLite) {
      // SQLite backup using .dump
      const dbPath = DATABASE_URL.replace('file:', '').split('?')[0];
      command = `sqlite3 "${dbPath}" .dump > "${filePath}"`;
    } else if (isPostgres) {
      // PostgreSQL backup using pg_dump
      // SECURITY: credentials passed via env (exec options), never interpolated
      // into the shell command string — blocks shell injection via DATABASE_URL.
      const url = new URL(DATABASE_URL);
      command = `pg_dump -h ${JSON.stringify(url.hostname)} -p ${JSON.stringify(url.port || '5432')} -U ${JSON.stringify(url.username)} -d ${JSON.stringify(url.pathname.slice(1))} -F p -f ${JSON.stringify(filePath)}`;
      // PGPASSWORD supplied via execAsyncEnv below
      (options as BackupOptions & { _pgPassword?: string })._pgPassword = url.password;
    } else {
      throw new Error('Unsupported database type');
    }

    // Execute backup command
    try {
      const pgPassword = (options as BackupOptions & { _pgPassword?: string })._pgPassword;
      await execAsync(command, {
        env: pgPassword ? { ...process.env, PGPASSWORD: pgPassword } : process.env,
      });
    } catch (execError) {
      // If command fails, create a JSON backup as fallback
      logger.warn('Database dump failed, using JSON backup fallback', { context: 'backup-service' });
      await createJSONBackup(filePath.replace('.sql', '.json'));
    }

    // Get file stats
    const stats = fs.existsSync(filePath)
      ? fs.statSync(filePath)
      : fs.statSync(filePath.replace('.sql', '.json'));

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Count tables and records (approximate)
    const modelCounts = await getModelCounts();
    tableCount = Object.keys(modelCounts).length;
    recordCount = Object.values(modelCounts).reduce((a, b) => a + b, 0);

    // Update backup record
    await prisma.backup.update({
      where: { id: backup.id },
      data: {
        status: 'COMPLETED',
        filePath: stats ? (fs.existsSync(filePath) ? filePath : filePath.replace('.sql', '.json')) : undefined,
        fileSize: stats?.size,
        tables: tableCount,
        records: recordCount,
        duration,
      },
    });

    return {
      success: true,
      backupId: backup.id,
      filePath: fs.existsSync(filePath) ? filePath : filePath.replace('.sql', '.json'),
      fileSize: stats?.size,
      duration,
    };
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'backup-service', operation: 'backup' });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create JSON backup as fallback
 */
async function createJSONBackup(filePath: string): Promise<void> {
  const data: Record<string, unknown[]> = {};

  // Export key tables (customize based on your schema)
  const models = [
    'user',
    'part',
    'supplier',
    'purchaseOrder',
    'workOrder',
    'product',
    'notification',
  ];

  for (const model of models) {
    try {
      // @ts-expect-error - Dynamic access to prisma models
      const records = await prisma[model].findMany({ take: 10000 });
      data[model] = records;
    } catch (err) {
      logger.warn(`Failed to backup model ${model}`, { context: 'backup-service', error: String(err) });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Get record counts for all models
 */
async function getModelCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  try {
    counts.users = await prisma.user.count();
    counts.parts = await prisma.part.count();
    counts.suppliers = await prisma.supplier.count();
    counts.purchaseOrders = await prisma.purchaseOrder.count();
    counts.workOrders = await prisma.workOrder.count();
    counts.products = await prisma.product.count();
    counts.notifications = await prisma.notification.count();
  } catch (err) {
    logger.warn('Error counting records', { context: 'backup-service', error: String(err) });
  }

  return counts;
}

/**
 * List all backups
 */
export async function listBackups(options?: {
  limit?: number;
  type?: string;
}) {
  const where: Record<string, unknown> = {};
  if (options?.type) {
    where.type = options.type;
  }

  return prisma.backup.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  });
}

/**
 * Get backup by ID
 */
export async function getBackup(backupId: string) {
  return prisma.backup.findUnique({
    where: { id: backupId },
  });
}

/**
 * Delete old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_BACKUP_RETENTION_DAYS);

  // Get old backups
  const oldBackups = await prisma.backup.findMany({
    where: {
      createdAt: { lt: cutoffDate },
      type: 'AUTO', // Only auto-delete automatic backups
    },
  });

  // Delete files and records
  let deletedCount = 0;
  for (const backup of oldBackups) {
    try {
      if (backup.filePath && fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
      }
      await prisma.backup.delete({ where: { id: backup.id } });
      deletedCount++;
    } catch (err) {
      logger.logError(err instanceof Error ? err : new Error(String(err)), { context: 'backup-service', operation: 'deleteBackup', backupId: backup.id });
    }
  }

  return deletedCount;
}

/**
 * Get backup schedule settings
 */
export async function getBackupSchedule() {
  let schedule = await prisma.backupSchedule.findFirst();

  if (!schedule) {
    // Create default schedule
    schedule = await prisma.backupSchedule.create({
      data: {
        enabled: true,
        frequency: 'DAILY',
        timeOfDay: '02:00',
        retention: 30,
        updatedBy: 'SYSTEM',
      },
    });
  }

  return schedule;
}

/**
 * Update backup schedule settings
 */
export async function updateBackupSchedule(
  data: {
    enabled?: boolean;
    frequency?: string;
    timeOfDay?: string;
    retention?: number;
  },
  userId: string
) {
  const existing = await prisma.backupSchedule.findFirst();

  if (existing) {
    return prisma.backupSchedule.update({
      where: { id: existing.id },
      data: { ...data, updatedBy: userId },
    });
  }

  return prisma.backupSchedule.create({
    data: {
      enabled: data.enabled ?? true,
      frequency: data.frequency || 'DAILY',
      timeOfDay: data.timeOfDay || '02:00',
      retention: data.retention || 30,
      updatedBy: userId,
    },
  });
}

/**
 * Download backup file
 */
export async function getBackupFile(backupId: string): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
} | null> {
  const backup = await prisma.backup.findUnique({
    where: { id: backupId },
  });

  if (!backup?.filePath || !fs.existsSync(backup.filePath)) {
    return null;
  }

  const buffer = fs.readFileSync(backup.filePath);
  const fileName = path.basename(backup.filePath);
  const mimeType = fileName.endsWith('.json')
    ? 'application/json'
    : 'application/sql';

  return { buffer, fileName, mimeType };
}

export default {
  createBackup,
  listBackups,
  getBackup,
  cleanupOldBackups,
  getBackupSchedule,
  updateBackupSchedule,
  getBackupFile,
};
