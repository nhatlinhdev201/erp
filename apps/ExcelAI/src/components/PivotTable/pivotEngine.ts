// ============================================================
// PIVOT ENGINE — Calculation Engine for Pivot Tables
// ============================================================

import {
  PivotTable,
  PivotField,
  PivotAreaField,
  PivotFilter,
  PivotCellData,
  PivotResult,
  PivotCellValue,
  DateGrouping,
  CalculatedField,
  AGGREGATE_LABELS,
} from '../../types/pivot';
import { aggregate, formatPivotValue } from '../../stores/pivotStore';
import { safeEvaluate } from '../../lib/safeExpression';

// ============================================================
// DATA TYPES
// ============================================================

interface DataRow {
  [key: string]: PivotCellValue;
}

interface GroupNode {
  key: string;
  values: DataRow[];
  children: Map<string, GroupNode>;
  aggregatedValues: Map<string, number>;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get unique values from a column
 */
export function getUniqueValues(data: DataRow[], fieldId: string): PivotCellValue[] {
  const unique = new Set<PivotCellValue>();
  data.forEach(row => {
    if (row[fieldId] !== undefined && row[fieldId] !== null) {
      unique.add(row[fieldId]);
    }
  });
  return Array.from(unique).sort((a, b) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return String(a).localeCompare(String(b));
  });
}

/**
 * Apply date grouping to a value
 */
export function applyDateGrouping(value: PivotCellValue, grouping?: DateGrouping): string {
  if (value === null || value === undefined) return '';

  const isValidDateString = typeof value === 'string' && !isNaN(Date.parse(value));
  const isValidDateNumber = typeof value === 'number' && !isNaN(value);

  if (!grouping || (!(value instanceof Date) && !isValidDateString && !isValidDateNumber)) {
    return String(value);
  }

  const date = value instanceof Date ? value : new Date(value as string | number);

  switch (grouping) {
    case 'years':
      return date.getFullYear().toString();
    case 'quarters':
      return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
    case 'months':
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    case 'days':
      return date.toLocaleDateString();
    case 'hours':
      return `${date.toLocaleDateString()} ${date.getHours()}:00`;
    default:
      return String(value);
  }
}

/**
 * Get the field name to display
 */
export function getFieldDisplayName(
  field: PivotAreaField,
  pivotFields: PivotField[]
): string {
  if (field.customName) return field.customName;

  const pivotField = pivotFields.find(f => f.id === field.fieldId);
  const baseName = pivotField?.name || field.fieldId;

  if (field.aggregateFunction) {
    return `${AGGREGATE_LABELS[field.aggregateFunction]} of ${baseName}`;
  }

  return baseName;
}

/**
 * Filter data based on pivot filters
 */
export function filterData(data: DataRow[], filters: PivotFilter[]): DataRow[] {
  if (filters.length === 0) return data;

  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.fieldId];
      const isSelected = filter.selectedValues.includes(value);
      return filter.excludeMode ? !isSelected : isSelected;
    });
  });
}

/**
 * Sort data based on field sort order
 */
export function sortValues<T extends PivotCellValue>(values: T[], order: 'asc' | 'desc' | 'none'): T[] {
  if (order === 'none') return values;

  return [...values].sort((a, b) => {
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return order === 'asc' ? a - b : b - a;
    }

    const strA = String(a).toLowerCase();
    const strB = String(b).toLowerCase();
    return order === 'asc'
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });
}

/**
 * Evaluate a calculated field formula for a data row
 */
export function evaluateCalculatedField(
  formula: string,
  row: DataRow,
  fields: PivotField[],
  calculatedFields: CalculatedField[]
): number {
  try {
    // Replace field references with actual values
    let evalFormula = formula;

    // First, resolve regular fields
    for (const field of fields) {
      const pattern = new RegExp(`\\[${escapeRegExp(field.name)}\\]`, 'gi');
      const value = typeof row[field.id] === 'number' ? row[field.id] : 0;
      evalFormula = evalFormula.replace(pattern, String(value));
    }

    // Then resolve other calculated fields (recursive dependency)
    for (const calcField of calculatedFields) {
      const pattern = new RegExp(`\\[${escapeRegExp(calcField.name)}\\]`, 'gi');
      if (pattern.test(evalFormula)) {
        // Recursively evaluate the referenced calculated field
        const value = evaluateCalculatedField(calcField.formula, row, fields, calculatedFields);
        evalFormula = evalFormula.replace(pattern, String(value));
      }
    }

    // Evaluate the expression safely
    // SECURITY: whitelist-validated evaluation (lib/safeExpression) —
    // only arithmetic/comparison chars allowed after substitution.
    return safeEvaluate<number>(evalFormula, 0);
  } catch {
    return 0;
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// MAIN CALCULATION ENGINE
// ============================================================

export class PivotEngine {
  private pivot: PivotTable;
  private data: DataRow[];
  private filteredData: DataRow[];

  constructor(pivot: PivotTable, sourceData: PivotCellValue[][]) {
    this.pivot = pivot;
    this.data = this.convertToDataRows(sourceData);
    this.filteredData = filterData(this.data, pivot.filters);
  }

  /**
   * Convert 2D array data to row objects using pivot fields
   */
  private convertToDataRows(sourceData: PivotCellValue[][]): DataRow[] {
    if (sourceData.length === 0) return [];

    // First row is headers - skip it
    const rows: DataRow[] = [];

    for (let i = 1; i < sourceData.length; i++) {
      const row: DataRow = {};
      this.pivot.fields.forEach((field) => {
        const colIndex = field.sourceColumn;
        row[field.id] = sourceData[i]?.[colIndex];
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Calculate the pivot result
   */
  calculate(): PivotResult {
    const { rowFields, columnFields, valueFields } = this.pivot;

    // Handle empty pivot
    if (valueFields.length === 0) {
      return this.createEmptyResult();
    }

    // Build row and column hierarchies
    const rowGroups = this.buildGroups(rowFields);
    const colGroups = this.buildGroups(columnFields);

    // Calculate aggregations
    const cells = this.buildCells(rowGroups, colGroups, valueFields);

    return {
      cells,
      rowCount: cells.length,
      colCount: cells[0]?.length || 0,
    };
  }

  /**
   * Build hierarchical groups for fields
   */
  private buildGroups(fields: PivotAreaField[]): GroupNode {
    const root: GroupNode = {
      key: '',
      values: [],
      children: new Map(),
      aggregatedValues: new Map(),
    };

    if (fields.length === 0) return root;

    this.filteredData.forEach(row => {
      let currentNode = root;

      fields.forEach((field) => {
        let value = row[field.fieldId];

        // Apply date grouping if specified
        if (field.dateGrouping) {
          value = applyDateGrouping(value, field.dateGrouping);
        }

        const key = String(value ?? '(blank)');

        if (!currentNode.children.has(key)) {
          currentNode.children.set(key, {
            key,
            values: [],
            children: new Map(),
            aggregatedValues: new Map(),
          });
        }

        currentNode = currentNode.children.get(key)!;
      });

      currentNode.values.push(row);
    });

    // Sort children at each level
    this.sortGroups(root, fields);

    return root;
  }

  /**
   * Sort groups based on field sort order
   */
  private sortGroups(node: GroupNode, fields: PivotAreaField[], depth = 0): void {
    if (depth >= fields.length || node.children.size === 0) return;

    const field = fields[depth];
    const keys = Array.from(node.children.keys());
    const sortedKeys = sortValues(keys, field.sortOrder);

    const sortedChildren = new Map<string, GroupNode>();
    sortedKeys.forEach(key => {
      const child = node.children.get(key)!;
      sortedChildren.set(key, child);
      this.sortGroups(child, fields, depth + 1);
    });

    node.children = sortedChildren;
  }

  /**
   * Build the cell matrix
   */
  private buildCells(
    rowGroups: GroupNode,
    colGroups: GroupNode,
    valueFields: PivotAreaField[]
  ): PivotCellData[][] {
    const cells: PivotCellData[][] = [];
    const { showRowGrandTotals, showColGrandTotals } = this.pivot;

    // Build column headers
    const colPaths = this.getLeafPaths(colGroups);
    const colHeaderRows = this.buildColumnHeaders(colPaths, valueFields);
    cells.push(...colHeaderRows);

    // Build data rows
    const rowPaths = this.getLeafPaths(rowGroups);

    rowPaths.forEach((rowPath, rowIndex) => {
      const row: PivotCellData[] = [];

      // Row headers
      rowPath.forEach((key, level) => {
        // Only show label if it's different from previous row at this level
        const prevPath = rowIndex > 0 ? rowPaths[rowIndex - 1] : null;
        const showLabel = !prevPath ||
          !this.pivot.compactForm ||
          level === rowPath.length - 1 ||
          rowPath.slice(0, level + 1).join('|') !== prevPath.slice(0, level + 1).join('|');

        row.push({
          value: showLabel ? key : '',
          formattedValue: showLabel ? key : '',
          isHeader: true,
          isTotal: false,
          isSubtotal: false,
          rowPath: rowPath.slice(0, level + 1),
          colPath: [],
          level,
          isCollapsible: level < rowPath.length - 1,
          isExpanded: this.pivot.isExpanded[rowPath.slice(0, level + 1).join('|')] ?? true,
        });
      });

      // Data cells
      colPaths.forEach(colPath => {
        valueFields.forEach(valueField => {
          const value = this.calculateValue(rowPath, colPath, valueField);
          row.push({
            value,
            formattedValue: this.formatValue(value, valueField),
            isHeader: false,
            isTotal: false,
            isSubtotal: false,
            rowPath,
            colPath,
            fieldId: valueField.fieldId,
            level: 0,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      });

      // Row grand total
      if (showColGrandTotals && colPaths.length > 0) {
        valueFields.forEach(valueField => {
          const value = this.calculateRowTotal(rowPath, valueField);
          row.push({
            value,
            formattedValue: this.formatValue(value, valueField),
            isHeader: false,
            isTotal: true,
            isSubtotal: false,
            rowPath,
            colPath: ['Grand Total'],
            fieldId: valueField.fieldId,
            level: 0,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      }

      cells.push(row);
    });

    // Grand total row
    if (showRowGrandTotals && rowPaths.length > 0) {
      const grandTotalRow: PivotCellData[] = [];

      // Label cell
      grandTotalRow.push({
        value: 'Grand Total',
        formattedValue: 'Grand Total',
        isHeader: true,
        isTotal: true,
        isSubtotal: false,
        rowPath: ['Grand Total'],
        colPath: [],
        level: 0,
        isCollapsible: false,
        isExpanded: true,
      });

      // Fill remaining header cells
      for (let i = 1; i < this.pivot.rowFields.length; i++) {
        grandTotalRow.push({
          value: '',
          formattedValue: '',
          isHeader: true,
          isTotal: true,
          isSubtotal: false,
          rowPath: ['Grand Total'],
          colPath: [],
          level: i,
          isCollapsible: false,
          isExpanded: true,
        });
      }

      // Column totals
      colPaths.forEach(colPath => {
        valueFields.forEach(valueField => {
          const value = this.calculateColumnTotal(colPath, valueField);
          grandTotalRow.push({
            value,
            formattedValue: this.formatValue(value, valueField),
            isHeader: false,
            isTotal: true,
            isSubtotal: false,
            rowPath: ['Grand Total'],
            colPath,
            fieldId: valueField.fieldId,
            level: 0,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      });

      // Grand total of grand totals
      if (showColGrandTotals) {
        valueFields.forEach(valueField => {
          const value = this.calculateGrandTotal(valueField);
          grandTotalRow.push({
            value,
            formattedValue: this.formatValue(value, valueField),
            isHeader: false,
            isTotal: true,
            isSubtotal: false,
            rowPath: ['Grand Total'],
            colPath: ['Grand Total'],
            fieldId: valueField.fieldId,
            level: 0,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      }

      cells.push(grandTotalRow);
    }

    return cells;
  }

  /**
   * Get all leaf paths from a group tree
   */
  private getLeafPaths(group: GroupNode, currentPath: string[] = []): string[][] {
    if (group.children.size === 0) {
      return currentPath.length > 0 ? [currentPath] : [];
    }

    const paths: string[][] = [];
    group.children.forEach((child, key) => {
      const childPaths = this.getLeafPaths(child, [...currentPath, key]);
      paths.push(...childPaths);
    });

    return paths;
  }

  /**
   * Build column header rows
   */
  private buildColumnHeaders(
    colPaths: string[][],
    valueFields: PivotAreaField[]
  ): PivotCellData[][] {
    const headers: PivotCellData[][] = [];
    const numRowFields = Math.max(1, this.pivot.rowFields.length);
    const numColLevels = colPaths[0]?.length || 0;

    // Column field headers
    for (let level = 0; level < numColLevels; level++) {
      const row: PivotCellData[] = [];

      // Empty cells for row headers
      for (let i = 0; i < numRowFields; i++) {
        row.push({
          value: i === 0 && level === numColLevels - 1
            ? this.pivot.rowFields.map(f => getFieldDisplayName(f, this.pivot.fields)).join(' / ')
            : '',
          formattedValue: i === 0 && level === numColLevels - 1
            ? this.pivot.rowFields.map(f => getFieldDisplayName(f, this.pivot.fields)).join(' / ')
            : '',
          isHeader: true,
          isTotal: false,
          isSubtotal: false,
          rowPath: [],
          colPath: [],
          level: 0,
          isCollapsible: false,
          isExpanded: true,
        });
      }

      // Column headers
      let prevValue = '';
      colPaths.forEach(colPath => {
        const value = colPath[level] || '';
        const showLabel = value !== prevValue;
        prevValue = value;

        valueFields.forEach((vf, vfIndex) => {
          const label = level === numColLevels - 1 && valueFields.length > 1
            ? getFieldDisplayName(vf, this.pivot.fields)
            : (vfIndex === 0 ? value : '');

          row.push({
            value: showLabel || level === numColLevels - 1 ? label : '',
            formattedValue: showLabel || level === numColLevels - 1 ? label : '',
            isHeader: true,
            isTotal: false,
            isSubtotal: false,
            rowPath: [],
            colPath: colPath.slice(0, level + 1),
            level,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      });

      // Grand total header
      if (this.pivot.showColGrandTotals && colPaths.length > 0) {
        valueFields.forEach((vf, vfIndex) => {
          row.push({
            value: level === numColLevels - 1
              ? (valueFields.length > 1 ? getFieldDisplayName(vf, this.pivot.fields) : 'Grand Total')
              : (vfIndex === 0 ? 'Grand Total' : ''),
            formattedValue: level === numColLevels - 1
              ? (valueFields.length > 1 ? getFieldDisplayName(vf, this.pivot.fields) : 'Grand Total')
              : (vfIndex === 0 ? 'Grand Total' : ''),
            isHeader: true,
            isTotal: true,
            isSubtotal: false,
            rowPath: [],
            colPath: ['Grand Total'],
            level,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      }

      headers.push(row);
    }

    // If no column fields, add a simple header row for values
    if (numColLevels === 0 && valueFields.length > 0) {
      const row: PivotCellData[] = [];

      // Empty cells for row headers
      for (let i = 0; i < numRowFields; i++) {
        row.push({
          value: i === 0
            ? this.pivot.rowFields.map(f => getFieldDisplayName(f, this.pivot.fields)).join(' / ')
            : '',
          formattedValue: i === 0
            ? this.pivot.rowFields.map(f => getFieldDisplayName(f, this.pivot.fields)).join(' / ')
            : '',
          isHeader: true,
          isTotal: false,
          isSubtotal: false,
          rowPath: [],
          colPath: [],
          level: 0,
          isCollapsible: false,
          isExpanded: true,
        });
      }

      // Value field headers
      valueFields.forEach(vf => {
        row.push({
          value: getFieldDisplayName(vf, this.pivot.fields),
          formattedValue: getFieldDisplayName(vf, this.pivot.fields),
          isHeader: true,
          isTotal: false,
          isSubtotal: false,
          rowPath: [],
          colPath: [],
          fieldId: vf.fieldId,
          level: 0,
          isCollapsible: false,
          isExpanded: true,
        });
      });

      headers.push(row);
    }

    return headers;
  }

  /**
   * Calculate value for a specific row/column intersection
   */
  private calculateValue(
    rowPath: string[],
    colPath: string[],
    valueField: PivotAreaField
  ): number {
    const values = this.getMatchingValues(rowPath, colPath, valueField.fieldId);
    return aggregate(values, valueField.aggregateFunction || 'sum');
  }

  /**
   * Calculate row total (across all columns)
   */
  private calculateRowTotal(rowPath: string[], valueField: PivotAreaField): number {
    const values = this.getMatchingValues(rowPath, [], valueField.fieldId);
    return aggregate(values, valueField.aggregateFunction || 'sum');
  }

  /**
   * Calculate column total (across all rows)
   */
  private calculateColumnTotal(colPath: string[], valueField: PivotAreaField): number {
    const values = this.getMatchingValues([], colPath, valueField.fieldId);
    return aggregate(values, valueField.aggregateFunction || 'sum');
  }

  /**
   * Calculate grand total
   */
  private calculateGrandTotal(valueField: PivotAreaField): number {
    // Check if this is a calculated field
    const calcField = this.pivot.calculatedFields.find(cf => cf.id === valueField.fieldId);

    const values = this.filteredData
      .map(row => {
        if (calcField) {
          return evaluateCalculatedField(
            calcField.formula,
            row,
            this.pivot.fields,
            this.pivot.calculatedFields
          );
        }
        return row[valueField.fieldId];
      })
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    return aggregate(values, valueField.aggregateFunction || 'sum');
  }

  /**
   * Get values matching row and column paths
   */
  private getMatchingValues(
    rowPath: string[],
    colPath: string[],
    fieldId: string
  ): number[] {
    // Check if this is a calculated field
    const calcField = this.pivot.calculatedFields.find(cf => cf.id === fieldId);

    return this.filteredData
      .filter(row => {
        // Match row path
        for (let i = 0; i < rowPath.length; i++) {
          const field = this.pivot.rowFields[i];
          let value = row[field.fieldId];
          if (field.dateGrouping) {
            value = applyDateGrouping(value, field.dateGrouping);
          }
          if (String(value ?? '(blank)') !== rowPath[i]) return false;
        }

        // Match column path
        for (let i = 0; i < colPath.length; i++) {
          const field = this.pivot.columnFields[i];
          let value = row[field.fieldId];
          if (field.dateGrouping) {
            value = applyDateGrouping(value, field.dateGrouping);
          }
          if (String(value ?? '(blank)') !== colPath[i]) return false;
        }

        return true;
      })
      .map(row => {
        // If it's a calculated field, evaluate the formula
        if (calcField) {
          return evaluateCalculatedField(
            calcField.formula,
            row,
            this.pivot.fields,
            this.pivot.calculatedFields
          );
        }
        return row[fieldId];
      })
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  }

  /**
   * Format a value based on field settings
   */
  private formatValue(value: number, field: PivotAreaField): string {
    if (field.numberFormat) {
      // Basic number formatting - could be extended
      try {
        return new Intl.NumberFormat('en-US', {
          style: field.numberFormat.includes('$') ? 'currency' : 'decimal',
          currency: 'USD',
          minimumFractionDigits: field.numberFormat.includes('.')
            ? (field.numberFormat.split('.')[1]?.length || 0)
            : 0,
          maximumFractionDigits: field.numberFormat.includes('.')
            ? (field.numberFormat.split('.')[1]?.length || 2)
            : 0,
        }).format(value);
      } catch {
        return formatPivotValue(value, field.aggregateFunction || 'sum');
      }
    }
    return formatPivotValue(value, field.aggregateFunction || 'sum');
  }

  /**
   * Create an empty result
   */
  private createEmptyResult(): PivotResult {
    return {
      cells: [[{
        value: 'Add fields to create pivot table',
        formattedValue: 'Add fields to create pivot table',
        isHeader: true,
        isTotal: false,
        isSubtotal: false,
        rowPath: [],
        colPath: [],
        level: 0,
        isCollapsible: false,
        isExpanded: true,
      }]],
      rowCount: 1,
      colCount: 1,
    };
  }
}

/**
 * Create and run the pivot engine
 */
export function calculatePivot(pivot: PivotTable, sourceData: PivotCellValue[][]): PivotResult {
  const engine = new PivotEngine(pivot, sourceData);
  return engine.calculate();
}

export default PivotEngine;
