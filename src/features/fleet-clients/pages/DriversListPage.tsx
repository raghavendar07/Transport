import { useNavigate } from 'react-router-dom'
import { Plus, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column } from '@/components/ui'
import { FilterBar, RowActionsMenu } from '@/components/domain'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { formatDate } from '@/lib/format'
import { useListControls } from '@/lib/useListControls'
import type { Driver } from '@/lib/api/types'
import { driversApi } from '../hooks'

export function DriversListPage() {
  const navigate = useNavigate()
  const { search, filters, page, setPage, setFilter, onSearchChange, clear, params } = useListControls()
  const { data, isLoading, isError, refetch } = driversApi.useList(params)
  const remove = driversApi.useRemove()

  const columns: Column<Driver>[] = [
    { key: 'name', header: 'Name', cell: (d) => <span className="font-medium">{d.name}</span>, sortValue: (d) => d.name },
    { key: 'email', header: 'Contact', cell: (d) => (
      <div className="text-text-muted">
        <div>{d.email}</div>
        <div className="text-xs">{d.phone}</div>
      </div>
    ) },
    { key: 'licence', header: 'Licence', cell: (d) => <span className="font-mono text-xs">{d.licenceNumber}</span> },
    {
      key: 'licenceExpiry',
      header: 'Licence expiry',
      cell: (d) => (
        <div className="flex items-center gap-2">
          <ExpiryBadge date={d.licenceExpiry} />
          <span className="text-xs text-text-subtle">{formatDate(d.licenceExpiry)}</span>
        </div>
      ),
      sortValue: (d) => d.licenceExpiry,
    },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Manage drivers and monitor licence expiry."
        actions={
          <Button onClick={() => navigate('/drivers/new')}>
            <Plus className="h-4 w-4" />
            Add driver
          </Button>
        }
      />

      <div className="mb-4">
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
