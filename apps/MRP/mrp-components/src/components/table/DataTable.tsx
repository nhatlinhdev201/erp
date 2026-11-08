'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Checkbox } from '../common/Checkbox'

/* ═══════════════════════════════════════════════════════════════════════════════
   L-ERP MRP DATA TABLE
   "Excel-First" Design - PRESERVE ALL EXISTING TABLE STRUCTURE

   QUAN TRONG:
   - KHONG thay doi columns
   - KHONG thay doi thu tu columns
   - KHONG thay doi data formatting
   - CHI thay doi visual styling
   ═══════════════════════════════════════════════════════════════════════════════ */

export type SortDirection = 'asc' | 'desc' | null

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  className?: string
  headerClassName?: string
  render?: (value: any, row: T, index: number) => React.ReactNode
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  // Selection
  selectable?: boolean
  selectedKeys?: Set<string | number>
  onSelectionChange?: (selectedKeys: Set<string | number>) => void
  // Sorting
  sortColumn?: string
  sortDirection?: SortDirection
  onSort?: (column: string, direction: SortDirection) => void
  // Row interaction
  onRowClick?: (row: T, index: number) => void
  onRowDoubleClick?: (row: T, index: number) => void
  // Styling
  className?: string
  stickyHeader?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  // Loading/Empty states
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  onRowDoubleClick,
  className = '',
  stickyHeader = true,
  striped = false,
  bordered = true,
  compact = false,
  loading = false,
  emptyMessage = 'Khong co du lieu',
}: DataTableProps<T>) {
  // Selection helpers
  const allSelected = useMemo(() => {
    if (data.length === 0) return false
    return data.every((row) => selectedKeys.has(row[keyField]))
  }, [data, selectedKeys, keyField])

  const someSelected = useMemo(() => {
    if (data.length === 0) return false
    const selectedCount = data.filter((row) => selectedKeys.has(row[keyField])).length
    return selectedCount > 0 && selectedCount < data.length
  }, [data, selectedKeys, keyField])

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      const newSelection = new Set(data.map((row) => row[keyField]))
      onSelectionChange(newSelection as Set<string | number>)
    }
  }, [allSelected, data, keyField, onSelectionChange])

  const handleSelectRow = useCallback(
    (row: T) => {
      if (!onSelectionChange) return
      const key = row[keyField]
      const newSelection = new Set(selectedKeys)
      if (newSelection.has(key)) {
        newSelection.delete(key)
      } else {
        newSelection.add(key)
      }
      onSelectionChange(newSelection)
    },
    [keyField, onSelectionChange, selectedKeys]
  )

  // Sort handler
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSort) return
      let newDirection: SortDirection = 'asc'
      if (sortColumn === columnKey) {
        if (sortDirection === 'asc') newDirection = 'desc'
        else if (sortDirection === 'desc') newDirection = null
      }
      onSort(columnKey, newDirection)
    },
    [onSort, sortColumn, sortDirection]
  )

  // Get cell value
  const getCellValue = (row: T, column: Column<T>, index: number) => {
    const value = column.key.toString().includes('.')
      ? column.key.toString().split('.').reduce((obj: any, key) => obj?.[key], row)
      : row[column.key as keyof T]

    if (column.render) {
      return column.render(value, row, index)
    }
    return value
  }

  // Render sort icon
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const isActive = sortColumn === column.key
    const Icon = isActive
      ? sortDirection === 'asc'
        ? ChevronUp
        : sortDirection === 'desc'
        ? ChevronDown
        : ChevronsUpDown
      : ChevronsUpDown

    return (
      <Icon
        size={14}
        className={`ml-1 inline-block ${
          isActive && sortDirection ? 'text-info-cyan' : 'text-mrp-text-muted opacity-50'
        }`}
      />
    )
  }

  return (
    <div className={`overflow-auto flex-1 ${className}`}>
      <table
        className={`w-full text-base border-collapse ${
          bordered ? '' : '[&_th]:border-0 [&_td]:border-0 [&_th]:border-b [&_td]:border-b'
        }`}
      >
        {/* ═══ HEADER - STICKY, EXCEL-LIKE ═══ */}
        <thead>
          <tr>
            {/* Checkbox column */}
            {selectable && (
              <th
                className={`
                  ${stickyHeader ? 'sticky top-0 z-10' : ''}
                  bg-gunmetal text-sm font-medium uppercase tracking-wide
                  text-mrp-text-muted text-center
                  ${compact ? 'p-1.5' : 'p-2'}
                  border border-mrp-border
                  w-10
                `}
              >
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                />
              </th>
            )}

            {/* Data columns - PRESERVE ORDER */}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`
                  ${stickyHeader ? 'sticky top-0 z-10' : ''}
                  bg-gunmetal text-sm font-medium uppercase tracking-wide
                  text-mrp-text-muted whitespace-nowrap
                  ${compact ? 'p-1.5' : 'p-2'}
                  border border-mrp-border
                  ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                  ${column.sortable ? 'cursor-pointer select-none hover:bg-slate' : ''}
                  ${column.headerClassName || ''}
                `}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                }}
                onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
              >
                {column.header}
                {renderSortIcon(column)}
              </th>
            ))}
          </tr>
        </thead>

        {/* ═══ BODY - EXCEL-LIKE ROW BEHAVIOR ═══ */}
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="p-8 text-center text-mrp-text-muted"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-info-cyan border-t-transparent rounded-full animate-spin" />
                  Dang tai...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="p-8 text-center text-mrp-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = row[keyField]
              const isSelected = selectedKeys.has(rowKey)

              return (
                <tr
                  key={String(rowKey)}
                  className={`
                    group transition-colors
                    ${isSelected ? 'selected' : ''}
                    ${striped && rowIndex % 2 === 1 ? 'bg-[rgba(45,49,57,0.3)]' : ''}
                    ${onRowClick || onRowDoubleClick ? 'cursor-pointer' : ''}
                    hover:bg-[rgba(61,68,80,0.3)]
                  `}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  onDoubleClick={() => onRowDoubleClick?.(row, rowIndex)}
                >
                  {/* Checkbox cell */}
                  {selectable && (
                    <td
                      className={`
                        text-center border border-mrp-border
                        ${compact ? 'p-1.5' : 'p-2'}
                        ${isSelected ? 'bg-info-cyan-dim border-l-2 border-l-info-cyan' : 'bg-transparent'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectRow(row)
                      }}
                    >
                      <Checkbox checked={isSelected} onChange={() => {}} />
                    </td>
                  )}

                  {/* Data cells - PRESERVE STRUCTURE */}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`
                        border border-mrp-border
                        ${compact ? 'p-1.5' : 'p-2'}
                        ${isSelected ? 'bg-info-cyan-dim' : 'bg-transparent'}
                        ${column.align === 'right' ? 'text-right font-mono' : column.align === 'center' ? 'text-center' : 'text-left'}
                        ${column.className || ''}
                      `}
                    >
                      {getCellValue(row, column, rowIndex)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
