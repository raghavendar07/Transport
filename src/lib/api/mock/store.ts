import type { ID, ListParams, Paginated } from '@/lib/api/types'
import { ApiError } from '@/lib/api/errors'
import { delay, deepClone } from './latency'

let idCounter = 1000
export function nextId(prefix: string): ID {
  idCounter += 1
  return `${prefix}${idCounter}`
}

interface HasTenant {
  id: ID
  tenantId: ID
}

/**
 * Generic in-memory collection with tenant-scoped CRUD + list (search/sort/paginate).
 * Every read is filtered by tenantId, enforcing strict isolation in mock mode the
 * same way the backend must — a tenant can never read another tenant's rows.
 */
export class Collection<T extends HasTenant> {
  private rows: T[]
  constructor(
    seed: T[],
    private prefix: string,
    /** Fields scanned by free-text search. */
    private searchable: (keyof T)[] = [],
  ) {
    this.rows = deepClone(seed)
  }

  async list(tenantId: ID, params: ListParams = {}): Promise<Paginated<T>> {
    const { page = 1, pageSize = 10, search = '', sort, filters = {} } = params
    let items = this.rows.filter((r) => r.tenantId === tenantId)

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((r) =>
        this.searchable.some((k) => String(r[k] ?? '').toLowerCase().includes(q)),
      )
    }

    for (const [key, val] of Object.entries(filters)) {
      if (val) items = items.filter((r) => String((r as Record<string, unknown>)[key]) === val)
    }

    if (sort) {
      const desc = sort.startsWith('-')
      const key = (desc ? sort.slice(1) : sort) as keyof T
      items = [...items].sort((a, b) => {
        const av = a[key]
        const bv = b[key]
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return desc ? -cmp : cmp
      })
    }

    const total = items.length
    const start = (page - 1) * pageSize
    return delay({ items: deepClone(items.slice(start, start + pageSize)), total, page, pageSize })
  }

  async get(tenantId: ID, id: ID): Promise<T> {
    const row = this.rows.find((r) => r.id === id && r.tenantId === tenantId)
    if (!row) throw new ApiError('not_found', 'Record not found')
    return delay(deepClone(row))
  }

  async create(tenantId: ID, data: Omit<T, 'id' | 'tenantId' | 'createdAt'>): Promise<T> {
    // Stamp server-managed fields. createdAt is harmless for entities without it.
    const row = {
      ...(data as T),
      id: nextId(this.prefix),
      tenantId,
      createdAt: new Date().toISOString(),
    }
    this.rows.unshift(row)
    return delay(deepClone(row))
  }

  async update(tenantId: ID, id: ID, data: Partial<T>): Promise<T> {
    const idx = this.rows.findIndex((r) => r.id === id && r.tenantId === tenantId)
    if (idx === -1) throw new ApiError('not_found', 'Record not found')
    this.rows[idx] = { ...this.rows[idx], ...data, id, tenantId }
    return delay(deepClone(this.rows[idx]))
  }

  async remove(tenantId: ID, id: ID): Promise<void> {
    this.rows = this.rows.filter((r) => !(r.id === id && r.tenantId === tenantId))
    return delay(undefined)
  }

  /** Direct access for cross-collection mock logic (e.g. route overlap checks). */
  raw(tenantId: ID): T[] {
    return this.rows.filter((r) => r.tenantId === tenantId)
  }
}
