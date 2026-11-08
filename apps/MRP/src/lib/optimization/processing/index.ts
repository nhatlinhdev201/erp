// =============================================================================
// L-ERP MRP - DATA PROCESSING MODULE
// Handle large datasets: import, export, transform, validate
// =============================================================================

import { Readable, Writable } from 'stream';
import * as XLSX from 'xlsx';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface ImportOptions {
  batchSize?: number;
  skipHeader?: boolean;
  validateRow?: (row: Record<string, unknown>, index: number) => boolean | string;
  transformRow?: (row: Record<string, unknown>, index: number) => Record<string, unknown>;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, row: Record<string, unknown>, index: number) => void;
  continueOnError?: boolean;
  dryRun?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'jsonl';
  fields?: string[];
  headers?: Record<string, string>;
  transform?: (row: Record<string, unknown>) => Record<string, unknown>;
  onProgress?: (exported: number) => void;
}

export interface ImportResult {
  success: boolean;
  processed: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
  duration: number;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: (string | number | boolean)[];
  custom?: (value: unknown, row: Record<string, unknown>) => boolean | string;
}

// =============================================================================
// DATA VALIDATION
// =============================================================================

/**
 * Validate row against rules
 */
export function validateRow(
  row: Record<string, unknown>,
  rules: ValidationRule[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = row[rule.field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    // Type check
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${rule.field} must be a string`);
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${rule.field} must be a number`);
          }
          break;
        case 'boolean':
          if (!['true', 'false', '1', '0', true, false].includes(value as string | boolean)) {
            errors.push(`${rule.field} must be a boolean`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(String(value)))) {
            errors.push(`${rule.field} must be a valid date`);
          }
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            errors.push(`${rule.field} must be a valid email`);
          }
          break;
        case 'phone':
          if (!/^[+]?[\d\s-()]{10,}$/.test(String(value))) {
            errors.push(`${rule.field} must be a valid phone number`);
          }
          break;
      }
    }

    // String length
    if (rule.minLength && String(value).length < rule.minLength) {
      errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
    }
    if (rule.maxLength && String(value).length > rule.maxLength) {
      errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`);
    }

    // Number range
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors.push(`${rule.field} must be at least ${rule.min}`);
    }
    if (rule.max !== undefined && Number(value) > rule.max) {
      errors.push(`${rule.field} must not exceed ${rule.max}`);
    }

    // Pattern
    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push(`${rule.field} format is invalid`);
    }

    // Enum
    if (rule.enum && !rule.enum.includes(value as string | number | boolean)) {
      errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value, row);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${rule.field} is invalid`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// CSV PROCESSING
// =============================================================================

/**
 * Parse CSV content (simple implementation without external dependencies)
 */
export function parseCSV(
  content: string | Buffer,
  options: { delimiter?: string; skipHeader?: boolean; columns?: boolean | string[] } = {}
): (Record<string, string> | string[])[] {
  const { delimiter = ',', skipHeader = false, columns = true } = options;

  const text: string = typeof content === 'string' ? content : content.toString('utf-8');
  const lines = text.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) return [];

  const startLine = skipHeader ? 1 : 0;
  const headerLine = columns === true ? lines[0] : null;
  const headers = Array.isArray(columns) ? columns : headerLine?.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '')) || [];

  const records: (Record<string, string> | string[])[] = [];
  const dataStartLine = columns === true ? 1 : startLine;

  for (let i = dataStartLine; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);

    if (columns === false) {
      records.push(values);
    } else {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      records.push(row);
    }
  }

  return records;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Generate CSV content
 */
export function generateCSV(
  data: Record<string, unknown>[],
  options: { headers?: string[]; delimiter?: string } = {}
): string {
  const { headers, delimiter = ',' } = options;
  
  if (data.length === 0) return '';
  
  const columns = headers || Object.keys(data[0]);
  
  const headerRow = columns.join(delimiter);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap if contains delimiter or quotes
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(delimiter)
  );
  
  return [headerRow, ...rows].join('\n');
}

// =============================================================================
// EXCEL PROCESSING
// =============================================================================

/**
 * Parse Excel file
 */
export function parseExcel(
  buffer: Buffer,
  options: { sheet?: string | number; range?: string } = {}
): Record<string, unknown>[] {
  const { sheet = 0, range } = options;
  
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = typeof sheet === 'number' 
    ? workbook.SheetNames[sheet] 
    : sheet;
  
  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheet}" not found`);
  }
  
  const worksheet = workbook.Sheets[sheetName];
  
  return XLSX.utils.sheet_to_json(worksheet, {
    range,
    defval: null,
    raw: false,
  });
}

/**
 * Generate Excel file
 */
export function generateExcel(
  data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>,
  options: {
    sheetName?: string;
    headers?: Record<string, string>;
  } = {}
): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Handle multiple sheets
  if (Array.isArray(data)) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
  } else {
    for (const [name, sheetData] of Object.entries(data)) {
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }
  }
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// =============================================================================
// STREAMING IMPORT
// =============================================================================

/**
 * Stream-based import for very large files
 * Note: Uses buffered reading instead of streaming CSV parser
 */
export async function streamImport(
  readStream: Readable,
  processor: (batch: Record<string, unknown>[]) => Promise<void>,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const {
    batchSize = 1000,
    validateRow: validate,
    transformRow: transform,
    onProgress,
    onError,
    continueOnError = true,
    dryRun = false,
  } = options;

  const startTime = Date.now();
  let processed = 0;
  let imported = 0;
  let skipped = 0;
  const errors: ImportResult['errors'] = [];
  let batch: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let buffer = '';

  const processBatch = async () => {
    if (batch.length === 0) return;

    if (!dryRun) {
      await processor(batch);
    }
    imported += batch.length;
    batch = [];
  };

  return new Promise((resolve, reject) => {
    readStream.on('data', async (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        // First line is headers
        if (headers.length === 0) {
          headers = parseCSVLine(line, ',');
          continue;
        }

        processed++;

        try {
          const values = parseCSVLine(line, ',');
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });

          // Validate
          if (validate) {
            const result = validate(row, processed);
            if (result !== true) {
              skipped++;
              errors.push({ row: processed, error: typeof result === 'string' ? result : 'Validation failed', data: row });
              onError?.(new Error('Validation failed'), row, processed);
              continue;
            }
          }

          // Transform
          const transformedRow = transform ? transform(row, processed) : row;
          batch.push(transformedRow);

          // Process batch
          if (batch.length >= batchSize) {
            readStream.pause();
            await processBatch();
            readStream.resume();
          }

          onProgress?.(processed, 0);
        } catch (error) {
          if (continueOnError) {
            skipped++;
            errors.push({ row: processed, error: (error as Error).message });
            onError?.(error as Error, {}, processed);
          } else {
            reject(error);
            return;
          }
        }
      }
    });

    readStream.on('end', async () => {
      // Process remaining buffer
      if (buffer.trim() && headers.length > 0) {
        const values = parseCSVLine(buffer, ',');
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        batch.push(row);
        processed++;
      }

      await processBatch();
      resolve({
        success: errors.length === 0,
        processed,
        imported,
        skipped,
        errors,
        duration: Date.now() - startTime,
      });
    });

    readStream.on('error', reject);
  });
}

// =============================================================================
// STREAMING EXPORT
// =============================================================================

/**
 * Stream-based export for large datasets
 */
export async function streamExport(
  dataGenerator: AsyncGenerator<Record<string, unknown>[], void, unknown>,
  writeStream: Writable,
  options: ExportOptions
): Promise<{ count: number; duration: number }> {
  const { format, fields, headers, transform, onProgress } = options;
  const startTime = Date.now();
  let count = 0;
  let headerWritten = false;

  for await (const batch of dataGenerator) {
    for (const row of batch) {
      const transformedRow = transform ? transform(row) : row;
      const filteredRow = fields
        ? fields.reduce((acc, f) => ({ ...acc, [f]: transformedRow[f] }), {})
        : transformedRow;

      let line: string;
      switch (format) {
        case 'csv':
          if (!headerWritten) {
            const csvHeaders = Object.keys(filteredRow).map(k => headers?.[k] || k);
            writeStream.write(csvHeaders.join(',') + '\n');
            headerWritten = true;
          }
          line = Object.values(filteredRow).map(v => 
            v === null || v === undefined ? '' : 
            typeof v === 'string' && (v.includes(',') || v.includes('"')) 
              ? `"${v.replace(/"/g, '""')}"` 
              : String(v)
          ).join(',');
          break;
        case 'jsonl':
          line = JSON.stringify(filteredRow);
          break;
        case 'json':
          line = (count > 0 ? ',' : '[') + JSON.stringify(filteredRow);
          break;
        default:
          line = JSON.stringify(filteredRow);
      }

      writeStream.write(line + '\n');
      count++;
      onProgress?.(count);
    }
  }

  if (format === 'json') {
    writeStream.write(']');
  }

  writeStream.end();

  return { count, duration: Date.now() - startTime };
}

// =============================================================================
// DATA TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Normalize text (trim, lowercase, remove special chars)
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Parse Vietnamese phone number
 */
export function parseVietnamesePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s-()]/g, '');
  
  // Remove country code
  let normalized = cleaned;
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('84')) {
    normalized = '0' + normalized.slice(2);
  }
  
  // Validate
  if (!/^0\d{9,10}$/.test(normalized)) {
    return null;
  }
  
  return normalized;
}

/**
 * Parse and validate Vietnamese tax code
 */
export function parseTaxCode(taxCode: string): string | null {
  const cleaned = taxCode.replace(/[-\s]/g, '');
  if (!/^\d{10}(\d{3})?$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Convert Excel date serial to JS Date
 */
export function excelDateToJS(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

/**
 * Clean and standardize product code
 */
export function standardizeProductCode(code: string): string {
  return code
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '');
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Find duplicates in dataset
 */
export function findDuplicates<T>(
  data: T[],
  keyFn: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of data) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  
  // Filter to only duplicates
  const duplicates = new Map<string, T[]>();
  Array.from(groups.entries()).forEach(([key, items]) => {
    if (items.length > 1) {
      duplicates.set(key, items);
    }
  });
  
  return duplicates;
}

/**
 * Remove duplicates keeping first/last occurrence
 */
export function removeDuplicates<T>(
  data: T[],
  keyFn: (item: T) => string,
  keep: 'first' | 'last' = 'first'
): T[] {
  const seen = new Map<string, T>();
  
  const items = keep === 'last' ? [...data].reverse() : data;
  
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  
  const result = Array.from(seen.values());
  return keep === 'last' ? result.reverse() : result;
}

// =============================================================================
// BATCH PROCESSING QUEUE
// =============================================================================

export class BatchQueue<T> {
  private queue: T[] = [];
  private processing = false;
  
  constructor(
    private processor: (batch: T[]) => Promise<void>,
    private batchSize: number = 100,
    private flushInterval: number = 5000
  ) {
    // Auto-flush periodically
    setInterval(() => this.flush(), flushInterval);
  }
  
  async add(item: T): Promise<void> {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }
  
  async addMany(items: T[]): Promise<void> {
    for (const item of items) {
      await this.add(item);
    }
  }
  
  async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      await this.processor(batch);
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'processing-optimization', operation: 'batchFlush' });
      // Re-queue on error
      this.queue.unshift(...batch);
    } finally {
      this.processing = false;
    }
  }
  
  get pending(): number {
    return this.queue.length;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  validateRow,
  parseCSV,
  generateCSV,
  parseExcel,
  generateExcel,
  streamImport,
  streamExport,
  normalizeText,
  parseVietnamesePhone,
  parseTaxCode,
  excelDateToJS,
  standardizeProductCode,
  findDuplicates,
  removeDuplicates,
  BatchQueue,
};
