// =============================================================================
// L-ERP MRP ENTERPRISE DATA MIGRATION TOOL
// Handle millions of records with streaming and batch processing
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { createReadStream, createWriteStream, statSync } from 'fs';
import { parse as csvParse } from 'csv-parse';
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';
import * as readline from 'readline';
import * as path from 'path';

const pipelineAsync = promisify(pipeline);

// =============================================================================
// CONFIGURATION
// =============================================================================

interface MigrationConfig {
  batchSize: number;
  maxConcurrent: number;
  logInterval: number;
  errorThreshold: number;
  dryRun: boolean;
  validateOnly: boolean;
  resumeFrom?: number;
}

const DEFAULT_CONFIG: MigrationConfig = {
  batchSize: 1000,
  maxConcurrent: 5,
  logInterval: 10000,
  errorThreshold: 0.01, // 1% error rate threshold
  dryRun: false,
  validateOnly: false,
};

// =============================================================================
// MIGRATION STATISTICS
// =============================================================================

interface MigrationStats {
  startTime: number;
  endTime?: number;
  totalRecords: number;
  processedRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  bytesProcessed: number;
  currentBatch: number;
  estimatedTimeRemaining?: number;
}

class MigrationTracker {
  private stats: MigrationStats;
  private lastLogTime: number = 0;

  constructor(totalRecords: number = 0) {
    this.stats = {
      startTime: Date.now(),
      totalRecords,
      processedRecords: 0,
      insertedRecords: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      bytesProcessed: 0,
      currentBatch: 0,
    };
  }

  recordInsert(count: number): void {
    this.stats.insertedRecords += count;
    this.stats.processedRecords += count;
  }

  recordUpdate(count: number): void {
    this.stats.updatedRecords += count;
    this.stats.processedRecords += count;
  }

  recordSkip(count: number): void {
    this.stats.skippedRecords += count;
    this.stats.processedRecords += count;
  }

  recordError(row: number, error: string, data?: any): void {
    this.stats.errorRecords++;
    this.stats.processedRecords++;
    if (this.stats.errors.length < 1000) { // Limit stored errors
      this.stats.errors.push({ row, error, data });
    }
  }

  recordBytes(bytes: number): void {
    this.stats.bytesProcessed += bytes;
  }

  nextBatch(): void {
    this.stats.currentBatch++;
  }

  setTotal(total: number): void {
    this.stats.totalRecords = total;
  }

  shouldLog(interval: number): boolean {
    const now = Date.now();
    if (now - this.lastLogTime >= interval) {
      this.lastLogTime = now;
      return true;
    }
    return false;
  }

  getProgress(): string {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const rate = this.stats.processedRecords / elapsed;
    const remaining = this.stats.totalRecords - this.stats.processedRecords;
    const eta = remaining > 0 ? remaining / rate : 0;

    const percent = this.stats.totalRecords > 0 
      ? ((this.stats.processedRecords / this.stats.totalRecords) * 100).toFixed(1)
      : '0';

    return `
╔════════════════════════════════════════════════════════════════╗
║  MIGRATION PROGRESS                                            ║
╠════════════════════════════════════════════════════════════════╣
║  Progress:     ${percent.padStart(6)}% (${this.stats.processedRecords.toLocaleString()} / ${this.stats.totalRecords.toLocaleString()})
║  Inserted:     ${this.stats.insertedRecords.toLocaleString().padStart(10)}
║  Updated:      ${this.stats.updatedRecords.toLocaleString().padStart(10)}
║  Skipped:      ${this.stats.skippedRecords.toLocaleString().padStart(10)}
║  Errors:       ${this.stats.errorRecords.toLocaleString().padStart(10)} (${((this.stats.errorRecords / Math.max(1, this.stats.processedRecords)) * 100).toFixed(2)}%)
║  Rate:         ${rate.toFixed(0).padStart(10)} records/sec
║  Elapsed:      ${this.formatTime(elapsed).padStart(10)}
║  ETA:          ${this.formatTime(eta).padStart(10)}
║  Data:         ${this.formatBytes(this.stats.bytesProcessed).padStart(10)}
╚════════════════════════════════════════════════════════════════╝`;
  }

  getStats(): MigrationStats {
    this.stats.endTime = Date.now();
    return { ...this.stats };
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  }
}

// =============================================================================
// DATA VALIDATION
// =============================================================================

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email';
  maxLength?: number;
  pattern?: RegExp;
  transform?: (value: any) => any;
}

function validateRecord(
  record: Record<string, any>,
  rules: ValidationRule[]
): { valid: boolean; errors: string[]; transformed: Record<string, any> } {
  const errors: string[] = [];
  const transformed = { ...record };

  for (const rule of rules) {
    let value = record[rule.field];

    // Transform if specified
    if (rule.transform) {
      try {
        value = rule.transform(value);
        transformed[rule.field] = value;
      } catch (e) {
        errors.push(`${rule.field}: transform error`);
        continue;
      }
    }

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field}: required`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    // Type check
    if (rule.type === 'number' && isNaN(Number(value))) {
      errors.push(`${rule.field}: must be number`);
    }
    if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${rule.field}: invalid email`);
    }
    if (rule.type === 'date' && isNaN(Date.parse(value))) {
      errors.push(`${rule.field}: invalid date`);
    }

    // Length check
    if (rule.maxLength && String(value).length > rule.maxLength) {
      errors.push(`${rule.field}: max ${rule.maxLength} chars`);
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push(`${rule.field}: invalid format`);
    }
  }

  return { valid: errors.length === 0, errors, transformed };
}

// =============================================================================
// ENTITY MIGRATORS
// =============================================================================

// Parts Migration - Matches L-ERP MRP Prisma schema
const PART_RULES: ValidationRule[] = [
  { field: 'partNumber', required: true, maxLength: 50, transform: (v) => String(v).toUpperCase().trim() },
  { field: 'partName', required: true, maxLength: 200, transform: (v) => String(v).trim() },
  // Also accept 'name' as alias for 'partName'
  { field: 'name', maxLength: 200, transform: (v) => String(v).trim() },
  { field: 'category', transform: (v) => String(v).toUpperCase() },
  { field: 'unitCost', type: 'number', transform: (v) => parseFloat(v) || 0 },
  { field: 'sellingPrice', type: 'number', transform: (v) => parseFloat(v) || null },
  { field: 'leadTime', type: 'number', transform: (v) => parseInt(v) || 7 },
  { field: 'minOrderQty', type: 'number', transform: (v) => parseInt(v) || 1 },
];

async function migrateParts(
  prisma: PrismaClient,
  records: any[],
  tracker: MigrationTracker,
  config: MigrationConfig
): Promise<void> {
  const validRecords: any[] = [];

  for (const record of records) {
    const { valid, errors, transformed } = validateRecord(record, PART_RULES);
    
    // Handle name/partName alias
    const partName = transformed.partName || transformed.name;
    if (!partName) {
      tracker.recordError(tracker.getStats().processedRecords + 1, 'partName or name is required', record);
      continue;
    }
    
    if (!valid && !partName) {
      tracker.recordError(tracker.getStats().processedRecords + 1, errors.join('; '), record);
      continue;
    }

    // Map category to valid enum values
    const categoryMap: Record<string, string> = {
      'COMPONENT': 'COMPONENT',
      'ASSEMBLY': 'ASSEMBLY', 
      'RAW': 'RAW_MATERIAL',
      'RAW_MATERIAL': 'RAW_MATERIAL',
      'FINISHED': 'FINISHED_GOOD',
      'FINISHED_GOOD': 'FINISHED_GOOD',
      'CONSUMABLE': 'CONSUMABLE',
      'TOOL': 'TOOL',
    };

    validRecords.push({
      partNumber: transformed.partNumber,
      name: partName,  // FIXED: Schema uses 'name' not 'partName'
      description: transformed.description || '',
      category: categoryMap[transformed.category] || 'COMPONENT',
      unit: transformed.unit || 'pcs',
      unitCost: transformed.unitCost || 0,
      sellingPrice: transformed.sellingPrice || null,
      leadTime: parseInt(transformed.leadTime) || 7,
      minOrderQty: parseInt(transformed.minOrderQty) || 1,
      isActive: transformed.isActive !== 'false' && transformed.isActive !== '0',
    });
  }

  if (config.dryRun || config.validateOnly) {
    tracker.recordSkip(validRecords.length);
    return;
  }

  try {
    const result = await prisma.part.createMany({
      data: validRecords,
      skipDuplicates: true,
    });
    tracker.recordInsert(result.count);
    tracker.recordSkip(validRecords.length - result.count);
  } catch (error: any) {
    // Fallback to individual inserts for better error tracking
    for (const record of validRecords) {
      try {
        await prisma.part.upsert({
          where: { partNumber: record.partNumber },
          create: record,
          update: record,
        });
        tracker.recordInsert(1);
      } catch (e: any) {
        tracker.recordError(0, e.message, record);
      }
    }
  }
}

// Customers Migration
const CUSTOMER_RULES: ValidationRule[] = [
  { field: 'code', required: true, maxLength: 50, transform: (v) => String(v).toUpperCase().trim() },
  { field: 'name', required: true, maxLength: 200, transform: (v) => String(v).trim() },
  { field: 'email', type: 'email' },
  { field: 'phone', maxLength: 20 },
  { field: 'taxCode', maxLength: 20 },
];

async function migrateCustomers(
  prisma: PrismaClient,
  records: any[],
  tracker: MigrationTracker,
  config: MigrationConfig
): Promise<void> {
  const validRecords: any[] = [];

  for (const record of records) {
    const { valid, errors, transformed } = validateRecord(record, CUSTOMER_RULES);
    
    if (!valid) {
      tracker.recordError(tracker.getStats().processedRecords + 1, errors.join('; '), record);
      continue;
    }

    validRecords.push({
      code: transformed.code,
      name: transformed.name,
      email: transformed.email || null,
      phone: transformed.phone || null,
      address: transformed.address || null,
      taxCode: transformed.taxCode || null,
      contactPerson: transformed.contactPerson || null,
      isActive: transformed.isActive !== 'false' && transformed.isActive !== '0',
    });
  }

  if (config.dryRun || config.validateOnly) {
    tracker.recordSkip(validRecords.length);
    return;
  }

  try {
    const result = await prisma.customer.createMany({
      data: validRecords,
      skipDuplicates: true,
    });
    tracker.recordInsert(result.count);
    tracker.recordSkip(validRecords.length - result.count);
  } catch (error: any) {
    for (const record of validRecords) {
      try {
        await prisma.customer.upsert({
          where: { code: record.code },
          create: record,
          update: record,
        });
        tracker.recordInsert(1);
      } catch (e: any) {
        tracker.recordError(0, e.message, record);
      }
    }
  }
}

// Suppliers Migration
const SUPPLIER_RULES: ValidationRule[] = [
  { field: 'code', required: true, maxLength: 50, transform: (v) => String(v).toUpperCase().trim() },
  { field: 'name', required: true, maxLength: 200, transform: (v) => String(v).trim() },
  { field: 'email', type: 'email' },
];

async function migrateSuppliers(
  prisma: PrismaClient,
  records: any[],
  tracker: MigrationTracker,
  config: MigrationConfig
): Promise<void> {
  const validRecords: any[] = [];

  for (const record of records) {
    const { valid, errors, transformed } = validateRecord(record, SUPPLIER_RULES);
    
    if (!valid) {
      tracker.recordError(tracker.getStats().processedRecords + 1, errors.join('; '), record);
      continue;
    }

    validRecords.push({
      code: transformed.code,
      name: transformed.name,
      email: transformed.email || null,
      phone: transformed.phone || null,
      address: transformed.address || null,
      taxCode: transformed.taxCode || null,
      contactPerson: transformed.contactPerson || null,
      isActive: transformed.isActive !== 'false' && transformed.isActive !== '0',
    });
  }

  if (config.dryRun || config.validateOnly) {
    tracker.recordSkip(validRecords.length);
    return;
  }

  try {
    const result = await prisma.supplier.createMany({
      data: validRecords,
      skipDuplicates: true,
    });
    tracker.recordInsert(result.count);
    tracker.recordSkip(validRecords.length - result.count);
  } catch (error: any) {
    for (const record of validRecords) {
      try {
        await prisma.supplier.upsert({
          where: { code: record.code },
          create: record,
          update: record,
        });
        tracker.recordInsert(1);
      } catch (e: any) {
        tracker.recordError(0, e.message, record);
      }
    }
  }
}

// Inventory Migration - Matches L-ERP MRP Prisma schema
// Note: L-ERP MRP uses single inventory per part (partId is unique)
const INVENTORY_RULES: ValidationRule[] = [
  { field: 'partNumber', required: true },
  { field: 'onHand', type: 'number', transform: (v) => parseFloat(v) || 0 },
  // Also accept 'quantity' as alias for 'onHand'
  { field: 'quantity', type: 'number', transform: (v) => parseFloat(v) || 0 },
  { field: 'warehouseLocation', maxLength: 100 },
  { field: 'binLocation', maxLength: 50 },
  { field: 'safetyStock', type: 'number', transform: (v) => parseFloat(v) || 0 },
  { field: 'reorderPoint', type: 'number', transform: (v) => parseFloat(v) || 0 },
  { field: 'maxStock', type: 'number', transform: (v) => parseFloat(v) || null },
  { field: 'lotNumber', maxLength: 50 },
];

async function migrateInventory(
  prisma: PrismaClient,
  records: any[],
  tracker: MigrationTracker,
  config: MigrationConfig,
  lookupMaps: { parts: Map<string, string>; warehouses: Map<string, string> }
): Promise<void> {
  for (const record of records) {
    const { valid, errors, transformed } = validateRecord(record, INVENTORY_RULES);
    
    if (!valid) {
      tracker.recordError(tracker.getStats().processedRecords + 1, errors.join('; '), record);
      continue;
    }

    const partId = lookupMaps.parts.get(transformed.partNumber?.toUpperCase?.() || transformed.partNumber);

    if (!partId) {
      tracker.recordError(0, `Part not found: ${transformed.partNumber}`, record);
      continue;
    }

    // Get quantity from onHand or quantity field
    const onHand = transformed.onHand || transformed.quantity || 0;

    if (config.dryRun || config.validateOnly) {
      tracker.recordSkip(1);
      continue;
    }

    // FIXED: Schema uses composite key [partId, warehouseId, lotNumber]
    // and 'quantity' instead of 'onHand'
    const warehouseId = lookupMaps.warehouses.get(transformed.warehouseCode?.toUpperCase?.() || 'MAIN')
      || lookupMaps.warehouses.values().next().value; // Default to first warehouse

    if (!warehouseId) {
      tracker.recordError(0, 'No warehouse found. Create at least one warehouse first.', record);
      continue;
    }

    const lotNumber = transformed.lotNumber || null;

    try {
      await prisma.inventory.upsert({
        where: {
          partId_warehouseId_lotNumber: {
            partId,
            warehouseId,
            lotNumber: lotNumber || '',
          },
        },
        create: {
          partId,
          warehouseId,
          quantity: onHand,  // FIXED: Schema uses 'quantity' not 'onHand'
          reservedQty: 0,
          locationCode: transformed.warehouseLocation || transformed.locationCode || null,
          lotNumber: lotNumber,
        },
        update: {
          quantity: { increment: onHand },  // FIXED: Schema uses 'quantity'
          locationCode: transformed.warehouseLocation || transformed.locationCode || undefined,
        },
      });
      tracker.recordInsert(1);
    } catch (e: any) {
      tracker.recordError(0, e.message, record);
    }
  }
}

// =============================================================================
// STREAMING FILE PROCESSOR
// =============================================================================

async function countLines(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    let count = 0;
    const rl = readline.createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });
    rl.on('line', () => count++);
    rl.on('close', () => resolve(count - 1)); // Exclude header
  });
}

async function processCSVStream(
  filePath: string,
  processor: (batch: any[]) => Promise<void>,
  tracker: MigrationTracker,
  config: MigrationConfig
): Promise<void> {
  const fileStats = statSync(filePath);
  tracker.recordBytes(fileStats.size);

  // Count total records for progress
  const totalLines = await countLines(filePath);
  tracker.setTotal(totalLines);

  let batch: any[] = [];
  let lineNumber = 0;

  const parser = createReadStream(filePath).pipe(
    csvParse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    lineNumber++;
    
    if (config.resumeFrom && lineNumber < config.resumeFrom) {
      continue;
    }

    batch.push(record);

    if (batch.length >= config.batchSize) {
      await processor(batch);
      tracker.nextBatch();
      batch = [];

      if (tracker.shouldLog(config.logInterval)) {
        console.clear();
        console.log(tracker.getProgress());
      }

      // Check error threshold
      const stats = tracker.getStats();
      const errorRate = stats.errorRecords / Math.max(1, stats.processedRecords);
      if (errorRate > config.errorThreshold) {
        throw new Error(`Error rate ${(errorRate * 100).toFixed(2)}% exceeded threshold ${(config.errorThreshold * 100).toFixed(2)}%`);
      }
    }
  }

  // Process remaining records
  if (batch.length > 0) {
    await processor(batch);
  }
}

// =============================================================================
// MAIN MIGRATION RUNNER
// =============================================================================

type EntityType = 'parts' | 'customers' | 'suppliers' | 'inventory' | 'sales-orders' | 'purchase-orders' | 'work-orders';

interface MigrationJob {
  entity: EntityType;
  filePath: string;
  config?: Partial<MigrationConfig>;
}

async function runMigration(
  jobs: MigrationJob[],
  databaseUrl?: string
): Promise<Map<string, MigrationStats>> {
  const prisma = new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
  });

  const results = new Map<string, MigrationStats>();

  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Build lookup maps for foreign keys
    const lookupMaps = {
      parts: new Map<string, string>(),
      warehouses: new Map<string, string>(),
      customers: new Map<string, string>(),
      suppliers: new Map<string, string>(),
    };

    // Load existing data for lookups
    console.log('📦 Loading lookup data...');
    const [parts, warehouses, customers, suppliers] = await Promise.all([
      prisma.part.findMany({ select: { id: true, partNumber: true } }),
      prisma.warehouse.findMany({ select: { id: true, code: true } }),
      prisma.customer.findMany({ select: { id: true, code: true } }),
      prisma.supplier.findMany({ select: { id: true, code: true } }),
    ]);

    parts.forEach(p => lookupMaps.parts.set(p.partNumber, p.id));
    warehouses.forEach(w => lookupMaps.warehouses.set(w.code, w.id));
    customers.forEach(c => lookupMaps.customers.set(c.code, c.id));
    suppliers.forEach(s => lookupMaps.suppliers.set(s.code, s.id));

    console.log(`   Parts: ${parts.length}, Warehouses: ${warehouses.length}`);
    console.log(`   Customers: ${customers.length}, Suppliers: ${suppliers.length}`);

    // Process each job
    for (const job of jobs) {
      console.log(`\n🚀 Starting migration: ${job.entity}`);
      console.log(`   File: ${job.filePath}`);

      const config = { ...DEFAULT_CONFIG, ...job.config };
      const tracker = new MigrationTracker();

      const processor = async (batch: any[]) => {
        switch (job.entity) {
          case 'parts':
            await migrateParts(prisma, batch, tracker, config);
            // Update lookup map
            const newParts = await prisma.part.findMany({
              where: { partNumber: { in: batch.map(b => b.partNumber?.toUpperCase?.() || b.partNumber) } },
              select: { id: true, partNumber: true },
            });
            newParts.forEach(p => lookupMaps.parts.set(p.partNumber, p.id));
            break;
          case 'customers':
            await migrateCustomers(prisma, batch, tracker, config);
            break;
          case 'suppliers':
            await migrateSuppliers(prisma, batch, tracker, config);
            break;
          case 'inventory':
            await migrateInventory(prisma, batch, tracker, config, lookupMaps);
            break;
          default:
            throw new Error(`Unknown entity type: ${job.entity}`);
        }
      };

      try {
        await processCSVStream(job.filePath, processor, tracker, config);
        
        console.log('\n');
        console.log(tracker.getProgress());
        
        const stats = tracker.getStats();
        results.set(job.entity, stats);

        // Write error log
        if (stats.errors.length > 0) {
          const errorLogPath = `${job.filePath}.errors.json`;
          require('fs').writeFileSync(errorLogPath, JSON.stringify(stats.errors, null, 2));
          console.log(`⚠️  Errors logged to: ${errorLogPath}`);
        }

      } catch (error: any) {
        console.error(`❌ Migration failed: ${error.message}`);
        results.set(job.entity, { ...tracker.getStats(), errors: [{ row: 0, error: error.message }] });
      }
    }

  } finally {
    await prisma.$disconnect();
  }

  return results;
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  L-ERP MRP ENTERPRISE DATA MIGRATION TOOL                       ║
╚════════════════════════════════════════════════════════════════╝

Usage: npx ts-node enterprise/migration/migrate.ts <entity> <file> [options]

Entities:
  parts           Part/Product master data
  customers       Customer master data
  suppliers       Supplier master data
  inventory       Inventory/Stock data

Options:
  --batch-size=N      Records per batch (default: 1000)
  --dry-run           Validate only, no database changes
  --validate-only     Same as --dry-run
  --resume-from=N     Resume from line N

Examples:
  npx ts-node migrate.ts parts ./data/parts.csv
  npx ts-node migrate.ts parts ./data/parts.csv --batch-size=500 --dry-run
  npx ts-node migrate.ts inventory ./data/stock.csv --resume-from=50000

File Format (CSV):
  - UTF-8 encoding
  - First row must be headers
  - Recommended: partNumber, name, category, unitCost, etc.
`);
    process.exit(1);
  }

  const entity = args[0] as EntityType;
  const filePath = args[1];
  const config: Partial<MigrationConfig> = {};

  // Parse options
  for (const arg of args.slice(2)) {
    if (arg.startsWith('--batch-size=')) {
      config.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg === '--dry-run' || arg === '--validate-only') {
      config.dryRun = true;
      config.validateOnly = true;
    } else if (arg.startsWith('--resume-from=')) {
      config.resumeFrom = parseInt(arg.split('=')[1]);
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  L-ERP MRP ENTERPRISE DATA MIGRATION                            ║
╚════════════════════════════════════════════════════════════════╝
`);
  console.log(`Entity:     ${entity}`);
  console.log(`File:       ${filePath}`);
  console.log(`Batch Size: ${config.batchSize || DEFAULT_CONFIG.batchSize}`);
  console.log(`Mode:       ${config.dryRun ? 'DRY RUN (validation only)' : 'LIVE'}`);
  console.log('');

  const results = await runMigration([{ entity, filePath, config }]);

  // Print summary
  console.log('\n📊 MIGRATION SUMMARY');
  console.log('═'.repeat(60));
  
  for (const [entityName, stats] of results) {
    const duration = ((stats.endTime || Date.now()) - stats.startTime) / 1000;
    console.log(`
${entityName.toUpperCase()}:
  Total:     ${stats.totalRecords.toLocaleString()}
  Inserted:  ${stats.insertedRecords.toLocaleString()}
  Updated:   ${stats.updatedRecords.toLocaleString()}
  Skipped:   ${stats.skippedRecords.toLocaleString()}
  Errors:    ${stats.errorRecords.toLocaleString()}
  Duration:  ${duration.toFixed(1)}s
  Rate:      ${(stats.processedRecords / duration).toFixed(0)} records/sec
`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  runMigration,
  MigrationConfig,
  MigrationStats,
  MigrationJob,
  EntityType,
};
