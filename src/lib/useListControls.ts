import { useState, useMemo } from 'react'
import type { ListParams } from '@/lib/api/types'

/** Local state for search + filters + pagination, packaged as ListParams. */
export function useListControls(pageSize = 10) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }
  function onSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }
  function clear() {
    setSearch('')
    setFilters({})
    setPage(1)
  }

  const params = useMemo<ListParams>(
    () => ({ search, filters, page, pageSize }),
    [search, filters, page, pageSize],
  )

  return { search, filters, page, setPage, setFilter, onSearchChange, clear, params }
}
