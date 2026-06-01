import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column } from '@/components/ui'
import { FilterBar } from '@/components/domain'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { formatDate } from '@/lib/format'
import { useListControls } from '@/lib/useListControls'
import type { Tenant } from '@/lib/api/types'
import { tenantsApi } from '../hooks'

export function TenantsListPage() {
  const navigate = useNavigate()
  const { search, filters, page, setPage, setFilter, onSearchChange, clear, params } = useListControls()
  const { data, isLoading, isError, refetch } = tenantsApi.useList(params)

  const columns: Column<Tenant>[] = [
    { key: 'name', header: 'Company', cell: (t) => <span className="font-medium">{t.name}</span>, sortValue: (t) => t.name },
    { key: 'code', header: 'Code', cell: (t) => <span className="font-mono">{t.code}</span> },
    { key: 'country', header: 'Country', cell: (t) => t.country },
    { key: 'timezone', header: 'Timezone', cell: (t) => <span className="text-text-muted">{t.timezone}</span> },
    { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
    { key: 'created', header: 'Created', cell: (t) => <span className="text-text-muted">{formatDate(t.createdAt)}</span>, sortValue: (t) => t.createdAt },
  ]

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Companies on the platform."
        actions={
          <Button onClick={() => navigate('/tenants/new')}>
            <Plus className="h-4 w-4" />
            Create tenant
          </Button>
        }
      />
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by company name or code…"
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
        rowKey={(t) => t.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(t) => navigate(`/tenants/${t.id}`)}
        rowActions={(t) => (
          <Button size="icon" variant="ghost" aria-label={`Edit ${t.name}`} onClick={() => navigate(`/tenants/${t.id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        pagination={{ page, pageSize: params.pageSize!, total: data?.total ?? 0, onPageChange: setPage }}
        emptyTitle="No tenants yet"
        emptyDescription="Create the first company to onboard them onto the platform."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/tenants/new')}>
            <Building2 className="h-4 w-4" />
            Create tenant
          </Button>
        }
      />
    </div>
  )
}
