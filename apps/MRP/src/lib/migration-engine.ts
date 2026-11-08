// =============================================================================
// L-ERP MRP - AI Data Migration Engine
// Smart column mapping and data transformation
// =============================================================================

// Types
export interface SourceColumn {
  name: string;
  sampleValues: unknown[];
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
  nullCount: number;
  uniqueCount: number;
}

export interface TargetField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  validValues?: string[];
  format?: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: TransformRule;
  issues: string[];
  suggestions: string[];
  sampleValues?: unknown[];
}

export interface TransformRule {
  type: 'direct' | 'lookup' | 'calculate' | 'format' | 'split' | 'merge' | 'default';
  params?: Record<string, unknown>;
}

export interface MigrationAnalysis {
  sourceFile: string;
  targetTable: string;
  confidence: number;
  mappings: ColumnMapping[];
  unmappedSource: string[];
  unmappedTarget: string[];
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

// =============================================================================
// VIETNAMESE COLUMN NAME PATTERNS - 200+ aliases
// =============================================================================
const VIETNAMESE_PATTERNS: Record<string, string[]> = {
  // Parts fields - Core
  partNumber: ['mã', 'ma', 'code', 'mã linh kiện', 'ma lk', 'part', 'pn', 'mã sp', 'sku', 'item code', 'part code', 'p/n', 'part_number', 'partno', 'mã hàng', 'ma hang', 'item', 'mã vật tư', 'material code'],
  name: ['tên', 'ten', 'name', 'tên linh kiện', 'tên sản phẩm', 'product name', 'description', 'part name', 'tên sp', 'tên hàng', 'ten hang', 'mô tả', 'diễn giải'],
  description: ['mô tả', 'mo ta', 'desc', 'ghi chú', 'chi tiết', 'note', 'notes', 'chi tiet', 'mo ta chi tiet'],
  category: ['nhóm', 'nhom', 'loại', 'loai', 'category', 'cat', 'phân loại', 'nhóm hàng', 'nhom hang', 'type', 'group'],
  subCategory: ['nhóm phụ', 'sub category', 'nhom phu', 'loai phu', 'subcat'],
  unit: ['đơn vị', 'don vi', 'dvt', 'unit', 'uom', 'đơn vị tính', 'don vi tinh'],
  unitCost: ['giá', 'gia', 'đơn giá', 'don gia', 'price', 'cost', 'giá nhập', 'gia nhap', 'giá mua', 'unit cost', 'unit price', 'đơn giá nhập', 'giá vốn'],

  // Parts - Inventory Planning
  minStockLevel: ['tồn min', 'ton min', 'min', 'tối thiểu', 'sl min', 'min stock', 'minimum', 'tồn kho tối thiểu', 'min qty'],
  maxStock: ['tồn max', 'ton max', 'max', 'tối đa', 'sl max', 'max stock', 'maximum', 'tồn kho tối đa', 'max qty'],
  reorderPoint: ['điểm đặt', 'diem dat', 'reorder', 'đặt hàng lại', 'reorder point', 'rop', 'điểm đặt hàng'],
  safetyStock: ['tồn an toàn', 'safety', 'buffer', 'safety stock', 'ton an toan', 'sl an toan'],
  leadTimeDays: ['lead time', 'thời gian giao', 'ngày giao', 'lt', 'leadtime', 'lead_time', 'thoi gian giao', 'tg giao'],

  // Parts - Compliance & Origin
  countryOfOrigin: ['xuất xứ', 'xuat xu', 'origin', 'coo', 'nước sản xuất', 'country', 'nuoc san xuat', 'made in', 'quốc gia'],
  ndaaCompliant: ['ndaa', 'compliant', 'tuân thủ', 'ndaa compliant', 'tuân thủ ndaa'],
  itarControlled: ['itar', 'itar controlled', 'kiểm soát itar'],
  rohsCompliant: ['rohs', 'rohs compliant', 'tuân thủ rohs'],
  reachCompliant: ['reach', 'reach compliant', 'tuân thủ reach'],

  // Parts - Physical
  weightKg: ['trọng lượng', 'trong luong', 'weight', 'kg', 'cân nặng', 'khối lượng', 'w', 'wt'],
  lengthMm: ['chiều dài', 'chieu dai', 'length', 'dài', 'l', 'dai'],
  widthMm: ['chiều rộng', 'chieu rong', 'width', 'rộng', 'w', 'rong'],
  heightMm: ['chiều cao', 'chieu cao', 'height', 'cao', 'h', 'cao'],
  color: ['màu', 'mau', 'color', 'màu sắc', 'mau sac'],
  material: ['vật liệu', 'vat lieu', 'material', 'chất liệu', 'chat lieu'],

  // Parts - Procurement
  makeOrBuy: ['make/buy', 'make or buy', 'tự sản xuất', 'mua ngoài', 'm/b'],
  manufacturer: ['nhà sản xuất', 'nsx', 'mfr', 'manufacturer', 'hãng', 'hang'],
  manufacturerPn: ['mã nsx', 'mfr pn', 'manufacturer pn', 'part no nsx', 'mã nhà sx'],

  // Parts - Quality
  lotControl: ['lot', 'quản lý lô', 'lot control', 'theo lô', 'batch'],
  serialControl: ['serial', 'sn', 's/n', 'serial number', 'quản lý serial', 'theo s/n'],
  isCritical: ['quan trọng', 'critical', 'quan trong', 'trọng yếu', 'ưu tiên'],

  // Supplier fields
  supplierCode: ['mã ncc', 'ma ncc', 'supplier code', 'vendor code', 'supplier', 'ncc', 'vendor', 'mã nhà cung cấp'],
  supplierName: ['tên ncc', 'ten ncc', 'supplier name', 'tên nhà cung cấp', 'vendor name', 'công ty'],
  email: ['email', 'mail', 'e-mail', 'địa chỉ email', 'email address'],
  phone: ['điện thoại', 'dien thoai', 'phone', 'tel', 'sdt', 'số điện thoại', 'phone number', 'đt'],
  address: ['địa chỉ', 'dia chi', 'address', 'addr'],

  // Customer fields
  customerCode: ['mã kh', 'ma kh', 'customer code', 'cust code', 'khách hàng', 'customer'],
  customerName: ['tên kh', 'ten kh', 'customer name', 'tên khách hàng', 'cust name'],
  customerType: ['loại kh', 'loai kh', 'type', 'phân loại kh', 'customer type'],
  creditLimit: ['hạn mức', 'credit limit', 'credit', 'hạn mức tín dụng'],

  // BOM fields
  productSku: ['mã sp', 'ma sp', 'product', 'sản phẩm', 'sku', 'product sku', 'parent', 'finished good'],
  quantity: ['số lượng', 'so luong', 'qty', 'sl', 'quantity', 'slg', 'soluong'],
  moduleCode: ['module', 'nhóm', 'group', 'assembly', 'cụm', 'cum', 'module code'],
  findNumber: ['find', 'find number', 'item no', 'line', 'stt', 'số thứ tự'],
  scrapPercent: ['hao hụt', 'scrap', '%hao', 'waste', 'phế phẩm', 'scrap %'],

  // Inventory fields
  warehouseCode: ['mã kho', 'ma kho', 'warehouse', 'wh', 'location', 'kho', 'warehouse code'],
  onHand: ['tồn kho', 'ton kho', 'on hand', 'stock', 'qty on hand', 'available', 'hiện có'],
};

// =============================================================================
// TARGET SCHEMA DEFINITIONS
// =============================================================================
export const TARGET_SCHEMAS: Record<string, TargetField[]> = {
  Parts: [
    { name: 'partNumber', type: 'string', required: true, description: 'Mã linh kiện unique' },
    { name: 'name', type: 'string', required: true, description: 'Tên linh kiện' },
    { name: 'description', type: 'string', required: false, description: 'Mô tả chi tiết' },
    { name: 'category', type: 'string', required: true, description: 'Nhóm linh kiện' },
    { name: 'subCategory', type: 'string', required: false, description: 'Nhóm phụ' },
    { name: 'unit', type: 'string', required: true, description: 'Đơn vị tính' },
    { name: 'unitCost', type: 'number', required: true, description: 'Giá nhập (USD)' },
    { name: 'weightKg', type: 'number', required: false, description: 'Trọng lượng (kg)' },
    { name: 'lengthMm', type: 'number', required: false, description: 'Chiều dài (mm)' },
    { name: 'widthMm', type: 'number', required: false, description: 'Chiều rộng (mm)' },
    { name: 'heightMm', type: 'number', required: false, description: 'Chiều cao (mm)' },
    { name: 'color', type: 'string', required: false, description: 'Màu sắc' },
    { name: 'material', type: 'string', required: false, description: 'Vật liệu' },
    { name: 'makeOrBuy', type: 'enum', required: false, description: 'Tự sản xuất hay mua', validValues: ['MAKE', 'BUY', 'BOTH'] },
    { name: 'countryOfOrigin', type: 'string', required: false, description: 'Nước xuất xứ' },
    { name: 'ndaaCompliant', type: 'boolean', required: false, description: 'NDAA compliant' },
    { name: 'itarControlled', type: 'boolean', required: false, description: 'ITAR controlled' },
    { name: 'rohsCompliant', type: 'boolean', required: false, description: 'RoHS compliant' },
    { name: 'reachCompliant', type: 'boolean', required: false, description: 'REACH compliant' },
    { name: 'lotControl', type: 'boolean', required: false, description: 'Quản lý theo lô' },
    { name: 'serialControl', type: 'boolean', required: false, description: 'Quản lý theo S/N' },
    { name: 'minStockLevel', type: 'number', required: false, description: 'Tồn tối thiểu' },
    { name: 'reorderPoint', type: 'number', required: false, description: 'Điểm đặt hàng' },
    { name: 'safetyStock', type: 'number', required: false, description: 'Tồn an toàn' },
    { name: 'leadTimeDays', type: 'number', required: false, description: 'Thời gian giao (ngày)' },
    { name: 'isCritical', type: 'boolean', required: false, description: 'Linh kiện quan trọng' },
    { name: 'manufacturer', type: 'string', required: false, description: 'Nhà sản xuất' },
    { name: 'manufacturerPn', type: 'string', required: false, description: 'Mã nhà sản xuất' },
  ],

  Suppliers: [
    { name: 'code', type: 'string', required: true, description: 'Mã NCC unique' },
    { name: 'name', type: 'string', required: true, description: 'Tên công ty' },
    { name: 'country', type: 'string', required: true, description: 'Quốc gia' },
    { name: 'contactEmail', type: 'string', required: false, description: 'Email' },
    { name: 'contactPhone', type: 'string', required: false, description: 'Điện thoại' },
    { name: 'address', type: 'string', required: false, description: 'Địa chỉ' },
    { name: 'leadTimeDays', type: 'number', required: false, description: 'Thời gian giao' },
    { name: 'paymentTerms', type: 'string', required: false, description: 'Điều khoản thanh toán' },
    { name: 'ndaaCompliant', type: 'boolean', required: false, description: 'NDAA compliant' },
    { name: 'itarRegistered', type: 'boolean', required: false, description: 'ITAR registered' },
    { name: 'as9100Certified', type: 'boolean', required: false, description: 'AS9100 certified' },
    { name: 'iso9001Certified', type: 'boolean', required: false, description: 'ISO9001 certified' },
    { name: 'rating', type: 'number', required: false, description: 'Đánh giá 1-5' },
  ],

  Customers: [
    { name: 'code', type: 'string', required: true, description: 'Mã KH unique' },
    { name: 'name', type: 'string', required: true, description: 'Tên khách hàng' },
    { name: 'type', type: 'string', required: false, description: 'Loại KH' },
    { name: 'country', type: 'string', required: false, description: 'Quốc gia' },
    { name: 'email', type: 'string', required: false, description: 'Email' },
    { name: 'phone', type: 'string', required: false, description: 'Điện thoại' },
    { name: 'creditLimit', type: 'number', required: false, description: 'Hạn mức tín dụng' },
  ],

  BOM: [
    { name: 'productSku', type: 'string', required: true, description: 'Mã sản phẩm' },
    { name: 'partNumber', type: 'string', required: true, description: 'Mã linh kiện' },
    { name: 'quantity', type: 'number', required: true, description: 'Số lượng' },
    { name: 'unit', type: 'string', required: false, description: 'Đơn vị' },
    { name: 'moduleCode', type: 'string', required: false, description: 'Module' },
    { name: 'findNumber', type: 'number', required: false, description: 'Item number' },
    { name: 'scrapPercent', type: 'number', required: false, description: '% hao hụt' },
  ],

  Inventory: [
    { name: 'partNumber', type: 'string', required: true, description: 'Mã linh kiện' },
    { name: 'warehouseCode', type: 'string', required: true, description: 'Mã kho' },
    { name: 'quantity', type: 'number', required: true, description: 'Số lượng tồn' },
    { name: 'lotNumber', type: 'string', required: false, description: 'Số lô' },
    { name: 'serialNumber', type: 'string', required: false, description: 'Serial number' },
  ],
};

// =============================================================================
// AI MIGRATION ENGINE CLASS
// =============================================================================
export class AIMigrationEngine {

  // Detect target table from filename and content
  detectTargetTable(filename: string, columns: string[]): { table: string; confidence: number } {
    const lower = filename.toLowerCase();
    const colText = columns.join(' ').toLowerCase();

    // Filename-based detection
    if (lower.includes('part') || lower.includes('linh_kien') || lower.includes('linh kiện') || lower.includes('lk') || lower.includes('vat_tu')) {
      return { table: 'Parts', confidence: 90 };
    }
    if (lower.includes('supplier') || lower.includes('ncc') || lower.includes('vendor') || lower.includes('nha_cung')) {
      return { table: 'Suppliers', confidence: 90 };
    }
    if (lower.includes('customer') || lower.includes('khach') || lower.includes('kh')) {
      return { table: 'Customers', confidence: 90 };
    }
    if (lower.includes('bom') || lower.includes('cau_truc') || lower.includes('bill')) {
      return { table: 'BOM', confidence: 90 };
    }
    if (lower.includes('inventory') || lower.includes('ton_kho') || lower.includes('tồn kho') || lower.includes('stock')) {
      return { table: 'Inventory', confidence: 90 };
    }

    // Column-based detection
    if (colText.includes('part') || colText.includes('linh kiện') || colText.includes('mã lk')) {
      if (colText.includes('product') || colText.includes('quantity') || colText.includes('số lượng')) {
        return { table: 'BOM', confidence: 80 };
      }
      return { table: 'Parts', confidence: 75 };
    }
    if (colText.includes('supplier') || colText.includes('ncc') || colText.includes('nhà cung')) {
      return { table: 'Suppliers', confidence: 75 };
    }
    if (colText.includes('customer') || colText.includes('khách') || colText.includes('kh')) {
      return { table: 'Customers', confidence: 75 };
    }
    if (colText.includes('warehouse') || colText.includes('kho') || colText.includes('tồn')) {
      return { table: 'Inventory', confidence: 75 };
    }

    return { table: 'Parts', confidence: 50 }; // Default
  }

  // Smart column mapping using pattern matching
  mapColumn(sourceColumn: string, targetFields: TargetField[]): ColumnMapping {
    const sourceLower = sourceColumn.toLowerCase().trim();
    const sourceNormalized = this.normalizeVietnamese(sourceLower);

    let bestMatch: { field: string; confidence: number } = { field: '', confidence: 0 };

    // Check Vietnamese patterns
    for (const [targetField, patterns] of Object.entries(VIETNAMESE_PATTERNS)) {
      for (const pattern of patterns) {
        const patternNorm = this.normalizeVietnamese(pattern.toLowerCase());

        // Exact match
        if (sourceNormalized === patternNorm) {
          const fieldExists = targetFields.find(f => f.name === targetField);
          if (fieldExists && 98 > bestMatch.confidence) {
            bestMatch = { field: targetField, confidence: 98 };
          }
        }
        // Contains match
        else if (sourceNormalized.includes(patternNorm) || patternNorm.includes(sourceNormalized)) {
          const fieldExists = targetFields.find(f => f.name === targetField);
          if (fieldExists && 85 > bestMatch.confidence) {
            bestMatch = { field: targetField, confidence: 85 };
          }
        }
      }
    }

    // Fuzzy match with target field names
    if (bestMatch.confidence < 70) {
      for (const field of targetFields) {
        const fieldNorm = this.normalizeVietnamese(field.name.toLowerCase().replace(/([A-Z])/g, ' $1').trim());
        const similarity = this.calculateSimilarity(sourceNormalized, fieldNorm);

        if (similarity > bestMatch.confidence) {
          bestMatch = { field: field.name, confidence: Math.round(similarity) };
        }
      }
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    if (bestMatch.confidence < 70) {
      issues.push('Độ tin cậy mapping thấp - cần xác nhận');
      suggestions.push('Kiểm tra lại column name hoặc chọn mapping thủ công');
    }

    return {
      sourceColumn,
      targetField: bestMatch.field || 'unmapped',
      confidence: bestMatch.confidence,
      issues,
      suggestions
    };
  }

  // Analyze entire file and generate mappings
  analyzeFile(
    filename: string,
    columns: string[],
    sampleData: unknown[][]
  ): MigrationAnalysis {
    const { table, confidence: tableConfidence } = this.detectTargetTable(filename, columns);
    const targetFields = TARGET_SCHEMAS[table] || TARGET_SCHEMAS.Parts;

    const mappings: ColumnMapping[] = [];
    const mappedTargets = new Set<string>();

    // Map each source column
    for (const col of columns) {
      if (!col || col.toString().trim() === '') continue;

      const mapping = this.mapColumn(col.toString(), targetFields);

      // Avoid duplicate mappings
      if (mapping.targetField && mappedTargets.has(mapping.targetField)) {
        mapping.confidence = Math.max(0, mapping.confidence - 20);
        mapping.issues.push('Target field đã được map bởi column khác');
      } else if (mapping.targetField !== 'unmapped') {
        mappedTargets.add(mapping.targetField);
      }

      // Add sample values
      const colIndex = columns.indexOf(col);
      if (colIndex >= 0 && sampleData.length > 0) {
        mapping.sampleValues = sampleData.slice(0, 3).map(row => row[colIndex]).filter(v => v != null);
      }

      mappings.push(mapping);
    }

    // Find unmapped fields
    const unmappedSource = mappings
      .filter(m => m.targetField === 'unmapped')
      .map(m => m.sourceColumn);

    const unmappedTarget = targetFields
      .filter(f => !mappedTargets.has(f.name))
      .map(f => f.name);

    // Generate warnings
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check required fields
    for (const field of targetFields) {
      if (field.required && !mappedTargets.has(field.name)) {
        errors.push(`Thiếu field bắt buộc: ${field.name} (${field.description})`);
      }
    }

    // Low confidence warnings
    const lowConfidence = mappings.filter(m => m.confidence > 0 && m.confidence < 80);
    if (lowConfidence.length > 0) {
      warnings.push(`${lowConfidence.length} mappings có độ tin cậy thấp - cần xác nhận`);
    }

    // Calculate overall confidence
    const validMappings = mappings.filter(m => m.targetField !== 'unmapped');
    const avgConfidence = validMappings.length > 0
      ? Math.round(validMappings.reduce((sum, m) => sum + m.confidence, 0) / validMappings.length)
      : 0;

    const overallConfidence = Math.round(
      (tableConfidence * 0.3 + avgConfidence * 0.7) * (errors.length === 0 ? 1 : 0.7)
    );

    // Recommendations
    const recommendations: string[] = [];
    if (unmappedSource.length > 0) {
      recommendations.push(`Có ${unmappedSource.length} columns chưa được map - có thể bỏ qua hoặc map thủ công`);
    }
    if (unmappedTarget.length > 0) {
      recommendations.push(`Có ${unmappedTarget.length} target fields chưa có data - sẽ dùng giá trị mặc định`);
    }
    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('Data đã sẵn sàng để import!');
    }

    return {
      sourceFile: filename,
      targetTable: table,
      confidence: overallConfidence,
      mappings,
      unmappedSource,
      unmappedTarget,
      warnings,
      errors,
      recommendations
    };
  }

  // Helpers
  private normalizeVietnamese(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[_-]/g, ' ')
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return Math.round((1 - editDistance / longer.length) * 100);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }
}

// =============================================================================
// DATA TRANSFORMER
// =============================================================================
export class DataTransformer {

  // Transform a row of data based on mappings
  transformRow(
    sourceRow: Record<string, unknown>,
    mappings: ColumnMapping[],
    targetTable: string
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const mapping of mappings) {
      if (mapping.targetField === 'unmapped' || !mapping.targetField) continue;

      let value = sourceRow[mapping.sourceColumn];

      // Apply transformations
      value = this.applyTransform(value, mapping, targetTable);

      result[mapping.targetField] = value;
    }

    // Apply defaults for missing required fields
    this.applyDefaults(result, targetTable);

    return result;
  }

  private applyTransform(
    value: unknown,
    mapping: ColumnMapping,
    targetTable: string
  ): unknown {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const targetFields = TARGET_SCHEMAS[targetTable] || [];
    const field = targetFields.find(f => f.name === mapping.targetField);

    if (!field) return value;

    switch (field.type) {
      case 'number':
        // Clean number formatting (Vietnamese/European format)
        if (typeof value === 'string') {
          // Remove currency symbols and spaces
          let numStr = value.replace(/[$€₫VNDvnd\s]/gi, '');
          // Handle Vietnamese format: 1.234,56 -> 1234.56
          if (numStr.includes(',') && numStr.includes('.')) {
            if (numStr.lastIndexOf(',') > numStr.lastIndexOf('.')) {
              numStr = numStr.replace(/\./g, '').replace(',', '.');
            } else {
              numStr = numStr.replace(/,/g, '');
            }
          } else if (numStr.includes(',') && !numStr.includes('.')) {
            // Only comma: could be decimal separator
            const parts = numStr.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
              numStr = numStr.replace(',', '.');
            } else {
              numStr = numStr.replace(/,/g, '');
            }
          }
          return parseFloat(numStr) || 0;
        }
        return parseFloat(String(value)) || 0;

      case 'boolean':
        if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          return ['true', 'yes', 'có', '1', 'y', 'x', 'ok', 'đúng'].includes(lower);
        }
        return Boolean(value);

      case 'enum':
        // Try to match valid values
        if (field.validValues) {
          const lower = String(value).toUpperCase().trim();
          const match = field.validValues.find(v =>
            v.toUpperCase() === lower ||
            v.toUpperCase().includes(lower) ||
            lower.includes(v.toUpperCase())
          );
          return match || field.validValues[0];
        }
        return value;

      case 'string':
        return String(value).trim();

      default:
        return value;
    }
  }

  private applyDefaults(row: Record<string, unknown>, targetTable: string): void {
    const targetFields = TARGET_SCHEMAS[targetTable] || [];

    for (const field of targetFields) {
      if (row[field.name] === undefined || row[field.name] === null) {
        // Default values based on field type
        switch (field.type) {
          case 'boolean':
            // Compliance fields default to true
            if (field.name.toLowerCase().includes('compliant')) {
              row[field.name] = true;
            } else {
              row[field.name] = false;
            }
            break;
          case 'number':
            // Don't set default for optional number fields
            break;
          case 'enum':
            if (field.validValues && field.validValues.length > 0) {
              // Don't auto-set enum defaults
            }
            break;
          case 'string':
            // Don't set empty strings
            break;
        }
      }
    }

    // Special defaults per table
    if (targetTable === 'Parts') {
      if (row.ndaaCompliant === undefined) row.ndaaCompliant = true;
      if (row.rohsCompliant === undefined) row.rohsCompliant = true;
      if (row.reachCompliant === undefined) row.reachCompliant = true;
      if (!row.unit) row.unit = 'pcs';
      if (!row.category) row.category = 'Accessories';
    }

    if (targetTable === 'Suppliers') {
      if (row.ndaaCompliant === undefined) row.ndaaCompliant = true;
      if (!row.country) row.country = 'Unknown';
    }
  }
}

// Export singleton instances
export const migrationEngine = new AIMigrationEngine();
export const dataTransformer = new DataTransformer();
