// ═══════════════════════════════════════════════════════════════════════════
// POWER QUERY ENGINE — Data Transformation Pipeline
// ═══════════════════════════════════════════════════════════════════════════

import { escapeForExprString, safeEvaluate } from '../lib/safeExpression';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CellValue = string | number | boolean | null;
export type DataRow = Record<string, CellValue>;
export type DataTable = DataRow[];

export type TransformType =
  | 'filter'
  | 'sort'
  | 'removeColumns'
  | 'selectColumns'
  | 'renameColumn'
  | 'addColumn'
  | 'splitColumn'
  | 'mergeColumns'
  | 'replaceValues'
  | 'changeType'
  | 'pivot'
  | 'unpivot'
  | 'groupBy'
  | 'removeDuplicates'
  | 'fillDown'
  | 'fillUp'
  | 'transpose'
  | 'trimText'
  | 'uppercase'
  | 'lowercase';

export interface TransformStep {
  id: string;
  type: TransformType;
  params: Record<string, unknown>;
  enabled: boolean;
  label?: string;
}

export interface QueryPipeline {
  id: string;
  name: string;
  sourceSheetId: string;
  steps: TransformStep[];
  outputSheetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransformResult {
  data: DataTable;
  columns: string[];
  rowCount: number;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Transform Functions
// ─────────────────────────────────────────────────────────────────────────────

type TransformFn = (data: DataTable, params: Record<string, unknown>) => DataTable;

const transforms: Record<TransformType, TransformFn> = {
  filter: (data, params) => {
    const { column, operator, value } = params as { column: string; operator: string; value: CellValue };
    return data.filter((row) => {
      const cellVal = row[column];
      switch (operator) {
        case 'equals': return cellVal === value;
        case 'notEquals': return cellVal !== value;
        case 'contains': return String(cellVal ?? '').includes(String(value));
        case 'startsWith': return String(cellVal ?? '').startsWith(String(value));
        case 'endsWith': return String(cellVal ?? '').endsWith(String(value));
        case 'greaterThan': return Number(cellVal) > Number(value);
        case 'lessThan': return Number(cellVal) < Number(value);
        case 'isNull': return cellVal === null || cellVal === '';
        case 'isNotNull': return cellVal !== null && cellVal !== '';
        default: return true;
      }
    });
  },

  sort: (data, params) => {
    const { column, direction } = params as { column: string; direction: 'asc' | 'desc' };
    return [...data].sort((a, b) => {
      const va = a[column];
      const vb = b[column];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return direction === 'desc' ? -cmp : cmp;
    });
  },

  removeColumns: (data, params) => {
    const { columns } = params as { columns: string[] };
    return data.map((row) => {
      const newRow: DataRow = {};
      for (const [k, v] of Object.entries(row)) {
        if (!columns.includes(k)) newRow[k] = v;
      }
      return newRow;
    });
  },

  selectColumns: (data, params) => {
    const { columns } = params as { columns: string[] };
    return data.map((row) => {
      const newRow: DataRow = {};
      for (const col of columns) {
        newRow[col] = row[col] ?? null;
      }
      return newRow;
    });
  },

  renameColumn: (data, params) => {
    const { from, to } = params as { from: string; to: string };
    return data.map((row) => {
      const newRow: DataRow = {};
      for (const [k, v] of Object.entries(row)) {
        newRow[k === from ? to : k] = v;
      }
      return newRow;
    });
  },

  addColumn: (data, params) => {
    const { name, expression } = params as { name: string; expression: string };
    return data.map((row) => {
      let value: CellValue = null;
      try {
        // Simple expression evaluation: column references as [ColumnName]
        // SECURITY: escape embedded strings + whitelist-validated evaluation
        // (see lib/safeExpression) — blocks JS injection via cell values.
        const expr = expression.replace(/\[(\w+)\]/g, (_, col) => {
          const v = row[col];
          return typeof v === 'string' ? `"${escapeForExprString(v)}"` : String(v ?? 0);
        });
        value = safeEvaluate<CellValue>(expr, null);
      } catch { /* leave null */ }
      return { ...row, [name]: value };
    });
  },

  splitColumn: (data, params) => {
    const { column, delimiter, newNames } = params as { column: string; delimiter: string; newNames?: string[] };
    return data.map((row) => {
      const parts = String(row[column] ?? '').split(delimiter);
      const newRow: DataRow = { ...row };
      delete newRow[column];
      parts.forEach((part, i) => {
        const name = newNames?.[i] ?? `${column}_${i + 1}`;
        newRow[name] = part.trim();
      });
      return newRow;
    });
  },

  mergeColumns: (data, params) => {
    const { columns, separator, newName } = params as { columns: string[]; separator: string; newName: string };
    return data.map((row) => {
      const merged = columns.map((c) => String(row[c] ?? '')).join(separator);
      const newRow: DataRow = { ...row, [newName]: merged };
      for (const c of columns) delete newRow[c];
      return newRow;
    });
  },

  replaceValues: (data, params) => {
    const { column, find, replace } = params as { column: string; find: string; replace: string };
    return data.map((row) => ({
      ...row,
      [column]: String(row[column] ?? '').split(find).join(replace),
    }));
  },

  changeType: (data, params) => {
    const { column, targetType } = params as { column: string; targetType: 'text' | 'number' | 'boolean' };
    return data.map((row) => {
      const v = row[column];
      let converted: CellValue = v;
      switch (targetType) {
        case 'number': converted = Number(v) || 0; break;
        case 'text': converted = String(v ?? ''); break;
        case 'boolean': converted = Boolean(v); break;
      }
      return { ...row, [column]: converted };
    });
  },

  pivot: (data, params) => {
    const { rowColumn, pivotColumn, valueColumn, aggregation } = params as {
      rowColumn: string; pivotColumn: string; valueColumn: string; aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max';
    };
    const groups = new Map<string, Map<string, number[]>>();

    for (const row of data) {
      const rowKey = String(row[rowColumn] ?? '');
      const pivotKey = String(row[pivotColumn] ?? '');
      const val = Number(row[valueColumn]) || 0;

      if (!groups.has(rowKey)) groups.set(rowKey, new Map());
      const pivots = groups.get(rowKey)!;
      if (!pivots.has(pivotKey)) pivots.set(pivotKey, []);
      pivots.get(pivotKey)!.push(val);
    }

    const allPivotKeys = [...new Set(data.map((r) => String(r[pivotColumn] ?? '')))];
    const result: DataTable = [];

    for (const [rowKey, pivots] of groups) {
      const row: DataRow = { [rowColumn]: rowKey };
      for (const pk of allPivotKeys) {
        const vals = pivots.get(pk) || [];
        switch (aggregation) {
          case 'sum': row[pk] = vals.reduce((a, b) => a + b, 0); break;
          case 'count': row[pk] = vals.length; break;
          case 'avg': row[pk] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; break;
          case 'min': row[pk] = vals.length ? Math.min(...vals) : 0; break;
          case 'max': row[pk] = vals.length ? Math.max(...vals) : 0; break;
        }
      }
      result.push(row);
    }
    return result;
  },

  unpivot: (data, params) => {
    const { idColumns, valueColumnName, attributeColumnName } = params as {
      idColumns: string[]; valueColumnName: string; attributeColumnName: string;
    };
    const result: DataTable = [];
    for (const row of data) {
      for (const [k, v] of Object.entries(row)) {
        if (!idColumns.includes(k)) {
          const newRow: DataRow = {};
          for (const id of idColumns) newRow[id] = row[id];
          newRow[attributeColumnName] = k;
          newRow[valueColumnName] = v;
          result.push(newRow);
        }
      }
    }
    return result;
  },

  groupBy: (data, params) => {
    const { columns, aggregations } = params as {
      columns: string[];
      aggregations: Array<{ column: string; operation: 'sum' | 'count' | 'avg' | 'min' | 'max'; as: string }>;
    };
    const groups = new Map<string, DataRow[]>();

    for (const row of data) {
      const key = columns.map((c) => String(row[c] ?? '')).join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const result: DataTable = [];
    for (const [, rows] of groups) {
      const newRow: DataRow = {};
      for (const col of columns) newRow[col] = rows[0][col];

      for (const agg of aggregations) {
        const vals = rows.map((r) => Number(r[agg.column]) || 0);
        switch (agg.operation) {
          case 'sum': newRow[agg.as] = vals.reduce((a, b) => a + b, 0); break;
          case 'count': newRow[agg.as] = vals.length; break;
          case 'avg': newRow[agg.as] = vals.reduce((a, b) => a + b, 0) / vals.length; break;
          case 'min': newRow[agg.as] = Math.min(...vals); break;
          case 'max': newRow[agg.as] = Math.max(...vals); break;
        }
      }
      result.push(newRow);
    }
    return result;
  },

  removeDuplicates: (data, params) => {
    const { columns } = params as { columns?: string[] };
    const seen = new Set<string>();
    return data.filter((row) => {
      const key = (columns || Object.keys(row)).map((c) => String(row[c] ?? '')).join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  fillDown: (data, params) => {
    const { column } = params as { column: string };
    let lastValue: CellValue = null;
    return data.map((row) => {
      if (row[column] !== null && row[column] !== '' && row[column] !== undefined) {
        lastValue = row[column];
        return row;
      }
      return { ...row, [column]: lastValue };
    });
  },

  fillUp: (data, params) => {
    const { column } = params as { column: string };
    const result = [...data];
    for (let i = result.length - 2; i >= 0; i--) {
      if (result[i][column] === null || result[i][column] === '' || result[i][column] === undefined) {
        result[i] = { ...result[i], [column]: result[i + 1][column] };
      }
    }
    return result;
  },

  transpose: (data) => {
    if (data.length === 0) return data;
    const cols = Object.keys(data[0]);
    const result: DataTable = [];
    for (const col of cols) {
      const row: DataRow = { _column: col };
      data.forEach((r, i) => { row[`row_${i + 1}`] = r[col]; });
      result.push(row);
    }
    return result;
  },

  trimText: (data, params) => {
    const { column } = params as { column: string };
    return data.map((row) => ({
      ...row,
      [column]: typeof row[column] === 'string' ? row[column].trim() : row[column],
    }));
  },

  uppercase: (data, params) => {
    const { column } = params as { column: string };
    return data.map((row) => ({
      ...row,
      [column]: typeof row[column] === 'string' ? row[column].toUpperCase() : row[column],
    }));
  },

  lowercase: (data, params) => {
    const { column } = params as { column: string };
    return data.map((row) => ({
      ...row,
      [column]: typeof row[column] === 'string' ? row[column].toLowerCase() : row[column],
    }));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Executor
// ─────────────────────────────────────────────────────────────────────────────

export function executePipeline(sourceData: DataTable, steps: TransformStep[]): TransformResult {
  let data = [...sourceData];
  const errors: string[] = [];

  for (const step of steps) {
    if (!step.enabled) continue;

    const transformFn = transforms[step.type];
    if (!transformFn) {
      errors.push(`Unknown transform: ${step.type}`);
      continue;
    }

    try {
      data = transformFn(data, step.params);
    } catch (e) {
      errors.push(`Step "${step.label || step.type}" failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return {
    data,
    columns,
    rowCount: data.length,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert sheet cells to DataTable format */
export function sheetToDataTable(
  cells: Record<string, { value: string | number | boolean | null; displayValue: string }>,
  maxRow: number,
  maxCol: number
): DataTable {
  const data: DataTable = [];

  // First row = headers
  const headers: string[] = [];
  for (let col = 0; col <= maxCol; col++) {
    const key = `0:${col}`;
    const cell = cells[key];
    headers.push(cell?.displayValue || cell?.value?.toString() || String.fromCharCode(65 + col));
  }

  // Data rows
  for (let row = 1; row <= maxRow; row++) {
    const dataRow: DataRow = {};
    for (let col = 0; col <= maxCol; col++) {
      const key = `${row}:${col}`;
      const cell = cells[key];
      dataRow[headers[col]] = cell?.value ?? null;
    }
    data.push(dataRow);
  }

  return data;
}

/** Create a new transform step */
export function createStep(type: TransformType, params: Record<string, unknown>, label?: string): TransformStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    params,
    enabled: true,
    label: label || type,
  };
}
