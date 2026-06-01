import { useNavigate } from 'react-router-dom'
import { Plus, FolderArchive } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column, Badge } from '@/components/ui'
import { FilterBar } from '@/components/domain'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { formatDate } from '@/lib/format'
import { useListControls } from '@/lib/useListControls'
import type { ComplianceDocument } from '@/lib/api/types'
import { documentsApi } from '../hooks'

const SCOPE_LABEL = { business: 'Business', driver: 'Driver', vehicle: 'Vehicle' } as const

export function DocumentsListPage() {
  const navigate = useNavigate()
  const { search, filters, page, setPage, setFilter, onSearchChange, clear, params } = useListControls()
  const { data, isLoading, isError, refetch } = documentsApi.useList(params)

  const columns: Column<ComplianceDocument>[] = [
    { key: 'title', header: 'Title', cell: (d) => <span className="font-medium">{d.title}</span>, sortValue: (d) => d.title },
    { key: 'scope', header: 'Scope', cell: (d) => <Badge tone="neutral">{SCOPE_LABEL[d.scope]}</Badge> },
    { key: 'type', header: 'Type', cell: (d) => d.type },
    { key: 'issue', header: 'Issued', cell: (d) => <span className="text-text-muted">{formatDate(d.issueDate)}</span> },
    {
      key: 'expiry',
      header: 'Expiry',
      cell: (d) => (d.expiryDate ? <ExpiryBadge date={d.expiryDate} showDate /> : <span className="text-text-subtle">No expiry</span>),
      sortValue: (d) => d.expiryDate ?? '',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Compliance Documents"
        description="Central repository for business, driver and vehicle documents."
        actions={
          <Button onClick={() => navigate('/documents/upload')}>
            <Plus className="h-4 w-4" />
            Upload document
          </Button>
        }
      />
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by title or type…"
          filters={[
            {
              key: 'scope',
              label: 'Scope',
              options: [
                { value: 'business', label: 'Business' },
                { value: 'driver', label: 'Driver' },
                { value: 'vehicle', label: 'Vehicle' },
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
        onRowClick={(d) => navigate(`/documents/${d.id}`)}
        pagination={{ page, pageSize: params.pageSize!, total: data?.total ?? 0, onPageChange: setPage }}
        emptyTitle="No documents"
        emptyDescription="Upload your first compliance document."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/documents/upload')}>
            <FolderArchive className="h-4 w-4" />
            Upload document
          </Button>
        }
      />
    </div>
  )
}
