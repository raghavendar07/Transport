import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Plus, Truck, SlidersHorizontal, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, Checkbox, type Column } from '@/components/ui'
import { FilterBar, RowActionsMenu } from '@/components/domain'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { useListControls } from '@/lib/useListControls'
import type { Driver } from '@/lib/api/types'
import { driversApi } from '../hooks'
import { DRIVER_DOCUMENT_TYPES } from '../documents'

/** Compliance document columns surfaced in the drivers table. */
const COMPLIANCE_COLUMNS = DRIVER_DOCUMENT_TYPES.map((type) => ({
  key: `doc:${type}`,
  label: type,
}))

/** Persist user's column selection across page loads. */
const STORAGE_KEY = 'drivers-table-columns-v1'

/** Default visible compliance columns — show all by default on first load. */
const DEFAULT_VISIBLE = new Set<string>(COMPLIANCE_COLUMNS.map((c) => c.key))

function loadVisible(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VISIBLE
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return DEFAULT_VISIBLE
  }
}

function saveVisible(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore quota / private-mode errors — column state is non-critical. */
  }
}

function docFor(driver: Driver, type: string) {
  return driver.documents.find((d) => d.type === type)
}

export function DriversListPage() {
  const navigate = useNavigate()
  const { search, filters, page, setPage, setFilter, onSearchChange, clear, params } = useListControls()
  const { data, isLoading, isError, refetch } = driversApi.useList(params)
  const remove = driversApi.useRemove()

  const [visible, setVisible] = useState<Set<string>>(() => loadVisible())
  useEffect(() => saveVisible(visible), [visible])

  function toggleColumn(key: string) {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const complianceCols: Column<Driver>[] = useMemo(
    () =>
      COMPLIANCE_COLUMNS.filter((c) => visible.has(c.key)).map((c) => {
        const docType = c.key.slice(4)
        return {
          key: c.key,
          header: c.label,
          cell: (d) => {
            const doc = docFor(d, docType)
            if (!doc?.fileName) {
              return <span className="text-xs text-text-subtle">—</span>
            }
            return <ExpiryBadge date={doc.expiryDate} />
          },
          sortValue: (d) => docFor(d, docType)?.expiryDate ?? '9999-99-99',
          className: 'whitespace-nowrap min-w-[140px]',
        }
      }),
    [visible],
  )

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      className: 'min-w-[180px]',
      cell: (d) => (
        <div>
          <div className="font-semibold text-text">{d.name}</div>
          <div className="text-xs text-text-muted">{d.email}</div>
        </div>
      ),
      sortValue: (d) => d.name,
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'whitespace-nowrap min-w-[140px]',
      cell: (d) => <span className="whitespace-nowrap text-text-muted">{d.phone}</span>,
    },
    ...complianceCols,
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
  ]

  const visibleCount = complianceCols.length
  const totalCount = COMPLIANCE_COLUMNS.length

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Track driver compliance documents and expiry status."
        actions={
          <Button onClick={() => navigate('/drivers/new')}>
            <Plus className="h-4 w-4" />
            Add driver
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px]">
          <FilterBar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name, email, licence…"
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
              },
            ]}
            values={filters}
            onFilterChange={setFilter}
            onClear={clear}
          />
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Columns
              <span className="ml-1 rounded-[2px] bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold text-text-muted tabular-nums">
                {visibleCount}/{totalCount}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 w-64 rounded-[8px] border border-border bg-card p-1 shadow-pop"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Compliance columns
                </span>
                <button
                  type="button"
                  onClick={() => setVisible(new Set(COMPLIANCE_COLUMNS.map((c) => c.key)))}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  All
                </button>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {COMPLIANCE_COLUMNS.map((c) => {
                const checked = visible.has(c.key)
                return (
                  <DropdownMenu.CheckboxItem
                    key={c.key}
                    checked={checked}
                    onCheckedChange={() => toggleColumn(c.key)}
                    onSelect={(e) => e.preventDefault()}
                    className="flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-hover"
                  >
                    <Checkbox checked={checked} aria-hidden tabIndex={-1} />
                    <span className="flex-1">{c.label}</span>
                    {checked && <Check className="h-3.5 w-3.5 text-brand" aria-hidden />}
                  </DropdownMenu.CheckboxItem>
                )
              })}
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => setVisible(new Set())}
                className="w-full px-3 py-2 text-left text-xs font-medium text-text-muted hover:bg-surface-hover"
              >
                Hide all compliance columns
              </button>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(d) => navigate(`/drivers/${d.id}`)}
        rowActions={(d) => (
          <RowActionsMenu
            itemLabel={d.name}
            onEdit={() => navigate(`/drivers/${d.id}/edit`)}
            onDelete={() => remove.mutateAsync(d.id)}
            deleteSuccessMessage="Driver deleted"
          />
        )}
        pagination={{
          page,
          pageSize: params.pageSize!,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
        emptyTitle="No drivers found"
        emptyDescription="Add your first driver to start planning routes."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/drivers/new')}>
            <Truck className="h-4 w-4" />
            Add driver
          </Button>
        }
      />
    </div>
  )
}
