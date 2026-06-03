import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from './Input'
import type { SelectOption } from './Select'

interface ComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  /** Placeholder shown inside the search box. */
  searchPlaceholder?: string
  id?: string
  disabled?: boolean
  /** Allow clearing the current selection. Default true. */
  clearable?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  className?: string
}

/**
 * Searchable single-select dropdown (autocomplete) skinned to match Select/Input.
 * Drop-in compatible with <Select>: same value/onValueChange/options API.
 * Supports search-as-you-type, keyboard navigation, and clearing the selection.
 */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  id,
  disabled,
  clearable = true,
  className,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Focus the search box and reset state when opening.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function choose(v: string) {
    onValueChange?.(v)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[active]
      if (opt) choose(opt.value)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={aria['aria-invalid']}
        aria-describedby={aria['aria-describedby']}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(inputClass, 'flex items-center justify-between text-left')}
      >
        <span className={cn('truncate', !selected && 'text-text-subtle')}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation()
                onValueChange?.('')
              }}
              className="rounded p-0.5 text-text-subtle hover:bg-surface-hover hover:text-text"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-text-subtle" aria-hidden />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-pop">
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
            <Search className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-text-subtle">No matches</li>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(opt.value)}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm text-text',
                      i === active && 'bg-surface-hover',
                      isSelected && 'font-medium',
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute left-2 h-4 w-4 text-brand" aria-hidden />
                    )}
                    {opt.label}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
