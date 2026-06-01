import { type ReactNode, useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Checkbox } from './Checkbox'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Pagination } from './Pagination'

export interface Column<T> {
  key: string
  header: string
  /** Cell renderer. */
  cell: (row: T) => ReactNode
  /** Enable client-side sort by returning a comparable value. */
  sortValue?: (row: T) => string | number
  className?: string
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Row click → detail navigation. */
  onRowClick?: (row: T) => void
  /** Per-row action menu / buttons. */
  rowActions?: (row: T) => ReactNode
  /** Enable bulk selection; emits selected keys. */
  selectable?: boolean
  selectedKeys?: string[]
  onSelectionChange?: (keys: string[]) => void
  /** Client-side pagination. Omit for server-side / no pagination. */
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (p: number) => void }
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  onRetry,
  onRowClick,
  rowActions,
  selectable,
  selectedKeys = [],
  onSelectionChange,
  pagination,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return -1 * factor
      if (av > bv) return 1 * factor
      return 0
    })
  }, [rows, sort, columns])

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const allSelected = rows.length > 0 && selectedKeys.length === rows.length
  const someSelected = selectedKeys.length > 0 && !allSelected

  function toggleAll() {
    onSelectionChange?.(allSelected ? [] : rows.map(rowKey))
  }
  function toggleRow(key: string) {
    onSelectionChange?.(
      selectedKeys.includes(key)
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key],
    )
  }

  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover/50">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-text-muted',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                    aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
              {rowActions && <th className="w-16 px-4 py-3 text-right" />}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: colSpan }).map((__, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={colSpan}>
                  <ErrorState onRetry={onRetry} />
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const key = rowKey(row)
                const selected = selectedKeys.includes(key)
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-surface-hover',
                      selected && 'bg-brand-50',
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleRow(key)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3.5 text-text',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && !isLoading && !isError && sortedRows.length > 0 && (
        <div className="border-t border-border px-2">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  )
}
