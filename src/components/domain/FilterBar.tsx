import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Select, type SelectOption } from '@/components/ui/Select'
import { SearchInput } from './SearchInput'

export interface FilterDef {
  key: string
  label: string
  options: SelectOption[]
}

interface FilterBarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterDef[]
  values?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onClear?: () => void
  /** Extra controls (e.g. AM/PM toggle, date picker). */
  children?: ReactNode
}

/** Composable filter row: search + dropdown filters + custom controls. */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  values = {},
  onFilterChange,
  onClear,
  children,
}: FilterBarProps) {
  const hasActive = Object.values(values).some(Boolean) || (search?.length ?? 0) > 0

  // Radix Select forbids empty-string item values, so "all" uses a sentinel
  // that maps back to '' at the call site.
  const ALL = '__all__'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSearchChange && (
        <SearchInput
          value={search ?? ''}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="min-w-[220px] flex-1"
        />
      )}
      {filters.map((f) => (
        <Select
          key={f.key}
          value={values[f.key] ? values[f.key] : ALL}
          onValueChange={(v) => onFilterChange?.(f.key, v === ALL ? '' : v)}
          options={[{ value: ALL, label: `All ${f.label.toLowerCase()}` }, ...f.options]}
          placeholder={f.label}
          className="w-auto min-w-[150px]"
        />
      ))}
      {children}
      {hasActive && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-text-muted hover:text-text"
        >
          <X className="h-4 w-4" aria-hidden />
          Clear
        </button>
      )}
    </div>
  )
}
