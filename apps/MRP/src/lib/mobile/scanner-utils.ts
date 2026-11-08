// ═══════════════════════════════════════════════════════════════════
//                    MOBILE SCANNER LIBRARY
//              Barcode/QR scanning with inventory integration
// ═══════════════════════════════════════════════════════════════════

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'QR_CODE' | 'EAN13' | 'UPC_A' | 'DATA_MATRIX';

export type EntityType = 'PART' | 'LOCATION' | 'WORK_ORDER' | 'PURCHASE_ORDER' | 'SALES_ORDER' | 'LOT' | 'SERIAL' | 'UNKNOWN';

export interface ScanResult {
  raw: string;
  format: BarcodeFormat;
  type: EntityType;
  value: string;
  timestamp: Date;
  confidence: number;
}

export interface ResolvedEntity {
  type: EntityType;
  id: string;
  data: Record<string, unknown>;
  actions: string[];
}

// Barcode pattern definitions for L-ERP MRP
const BARCODE_PATTERNS: Record<EntityType, RegExp[]> = {
  PART: [
    /^RTR-[A-Z]+-\d{3,}$/i,           // RTR-PART-001
    /^P-\d{5,}$/i,                     // P-00001
    /^[A-Z]{2,4}-\d{4,}$/i,           // COMP-0001
  ],
  LOCATION: [
    /^WH-\d{2}-R\d{2}-C\d{2}-S\d{2}$/i, // WH-01-R01-C01-S01
    /^LOC-[A-Z0-9-]+$/i,               // LOC-MAIN-A1
    /^BIN-\d{4,}$/i,                    // BIN-0001
  ],
  WORK_ORDER: [
    /^WO-\d{4}-\d{5,}$/i,              // WO-2024-00001
    /^MO-\d{6,}$/i,                     // MO-000001
  ],
  PURCHASE_ORDER: [
    /^PO-\d{4}-\d{5,}$/i,              // PO-2024-00001
    /^PUR-\d{6,}$/i,                    // PUR-000001
  ],
  SALES_ORDER: [
    /^SO-\d{4}-\d{5,}$/i,              // SO-2024-00001
    /^ORD-\d{6,}$/i,                    // ORD-000001
  ],
  LOT: [
    /^LOT-\d{8}-\d{3,}$/i,             // LOT-20240101-001
    /^L-\d{10,}$/i,                     // L-0000000001
  ],
  SERIAL: [
    /^SN-[A-Z0-9]{10,}$/i,             // SN-ABC1234567
    /^S-\d{12,}$/i,                     // S-000000000001
  ],
  UNKNOWN: [],
};

/**
 * Parse a barcode string and determine its type
 */
export function parseBarcode(data: string): ScanResult {
  const cleaned = data.trim().toUpperCase();
  const timestamp = new Date();
  
  // Try to match against known patterns
  for (const [entityType, patterns] of Object.entries(BARCODE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        return {
          raw: data,
          format: detectFormat(data),
          type: entityType as EntityType,
          value: cleaned,
          timestamp,
          confidence: 0.95,
        };
      }
    }
  }
  
  // Check for GS1 barcode format
  if (cleaned.startsWith('01') && cleaned.length >= 14) {
    return parseGS1Barcode(data);
  }
  
  // Unknown format
  return {
    raw: data,
    format: detectFormat(data),
    type: 'UNKNOWN',
    value: cleaned,
    timestamp,
    confidence: 0.5,
  };
}

/**
 * Parse GS1 barcode format (commonly used in supply chain)
 */
function parseGS1Barcode(data: string): ScanResult {
  const timestamp = new Date();
  
  // GS1 Application Identifiers
  // 01 = GTIN (Global Trade Item Number)
  // 10 = Batch/Lot
  // 21 = Serial Number
  // 17 = Expiration Date
  
  if (data.startsWith('01')) {
    return {
      raw: data,
      format: 'DATA_MATRIX',
      type: 'PART',
      value: data.substring(2, 16), // Extract GTIN
      timestamp,
      confidence: 0.9,
    };
  }
  
  return {
    raw: data,
    format: 'DATA_MATRIX',
    type: 'UNKNOWN',
    value: data,
    timestamp,
    confidence: 0.6,
  };
}

/**
 * Detect barcode format based on characteristics
 */
function detectFormat(data: string): BarcodeFormat {
  // QR codes typically have more characters and special chars
  if (data.length > 50 || data.includes('http') || data.includes('{')) {
    return 'QR_CODE';
  }
  
  // EAN-13 is exactly 13 digits
  if (/^\d{13}$/.test(data)) {
    return 'EAN13';
  }
  
  // UPC-A is exactly 12 digits
  if (/^\d{12}$/.test(data)) {
    return 'UPC_A';
  }
  
  // CODE39 uses limited character set with asterisks
  if (/^[A-Z0-9\-. $/+%*]+$/i.test(data) && data.includes('*')) {
    return 'CODE39';
  }
  
  // Default to CODE128 (most versatile)
  return 'CODE128';
}

/**
 * Generate available actions based on entity type and context
 */
export function getAvailableActions(type: EntityType, context?: string): string[] {
  const baseActions: Record<EntityType, string[]> = {
    PART: ['view_details', 'check_inventory', 'adjust_qty', 'transfer', 'print_label'],
    LOCATION: ['view_contents', 'add_item', 'remove_item', 'cycle_count'],
    WORK_ORDER: ['view_details', 'start_operation', 'complete_operation', 'record_production', 'report_issue'],
    PURCHASE_ORDER: ['view_details', 'receive_items', 'inspect_quality'],
    SALES_ORDER: ['view_details', 'pick_items', 'pack_shipment'],
    LOT: ['view_details', 'trace_history', 'quality_check'],
    SERIAL: ['view_details', 'trace_history', 'update_status'],
    UNKNOWN: ['manual_lookup', 'create_new'],
  };
  
  let actions = baseActions[type] || [];
  
  // Context-specific actions
  if (context === 'receiving') {
    actions = actions.filter(a => ['receive_items', 'inspect_quality', 'view_details'].includes(a));
  } else if (context === 'picking') {
    actions = actions.filter(a => ['pick_items', 'view_details', 'check_inventory'].includes(a));
  } else if (context === 'inventory') {
    actions = actions.filter(a => ['adjust_qty', 'transfer', 'check_inventory', 'view_details'].includes(a));
  }
  
  return actions;
}

/**
 * Haptic feedback patterns
 */
export const HapticPatterns = {
  success: [100],                    // Single short vibration
  error: [100, 50, 100],            // Double vibration
  warning: [50, 30, 50, 30, 50],    // Triple quick
  scan: [50],                        // Quick tap
  confirm: [100, 100, 200],         // Confirmation pattern
};

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(pattern: keyof typeof HapticPatterns): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(HapticPatterns[pattern]);
  }
}

/**
 * Play audio feedback
 */
export function playAudioFeedback(type: 'success' | 'error'): void {
  if (typeof window !== 'undefined') {
    try {
      const audio = new Audio(`/sounds/beep-${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors (e.g., user hasn't interacted yet)
      });
    } catch {
      // Audio not available
    }
  }
}

/**
 * Scanner configuration
 */
export interface ScannerConfig {
  formats: BarcodeFormat[];
  continuous: boolean;
  debounceMs: number;
  hapticEnabled: boolean;
  audioEnabled: boolean;
  torch: boolean;
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  formats: ['CODE128', 'CODE39', 'QR_CODE', 'EAN13'],
  continuous: false,
  debounceMs: 500,
  hapticEnabled: true,
  audioEnabled: true,
  torch: false,
};

/**
 * Validate scanned data before processing
 */
export function validateScan(result: ScanResult): { valid: boolean; error?: string } {
  if (!result.raw || result.raw.trim().length === 0) {
    return { valid: false, error: 'Empty scan data' };
  }
  
  if (result.raw.length > 500) {
    return { valid: false, error: 'Scan data too long' };
  }
  
  if (result.confidence < 0.3) {
    return { valid: false, error: 'Low confidence scan' };
  }
  
  return { valid: true };
}
