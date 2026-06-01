import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Contact } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column } from '@/components/ui'
import { SearchInput } from '@/components/domain'
import { useListControls } from '@/lib/useListControls'
import type { Client } from '@/lib/api/types'
import { clientsApi } from '../hooks'

export function ClientsListPage() {
  const navigate = useNavigate()
  const { search, page, setPage, onSearchChange, params } = useListControls()
  const { data, isLoading, isError, refetch } = clientsApi.useList(params)

  const columns: Column<Client>[] = [
    { key: 'uci', header: 'UCI', cell: (c) => <span className="font-mono font-medium">{c.uci}</span>, sortValue: (c) => c.uci },
    { key: 'name', header: 'Name', cell: (c) => c.name, sortValue: (c) => c.name },
    { key: 'contact', header: 'Contact', cell: (c) => (
      <div className="text-text-muted">
        <div>{c.contactName}</div>
        <div className="text-xs">{c.contactPhone}</div>
      </div>
    ) },
    { key: 'addresses', header: 'Addresses', cell: (c) => `${c.addresses.length}`, align: 'right' },
  ]

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Searchable by UCI or name."
        actions={
          <Button onClick={() => navigate('/clients/new')}>
            <Plus className="h-4 w-4" />
            Add client
          </Button>
        }
      />
      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={onSearchChange} placeholder="Search by UCI or name…" />
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(c) => navigate(`/clients/${c.id}`)}
        rowActions={(c) => (
          <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => navigate(`/clients/${c.id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        pagination={{ page, pageSize: params.pageSize!, total: data?.total ?? 0, onPageChange: setPage }}
        emptyTitle="No clients found"
        emptyDescription="Add a client to begin scheduling pickups and drops."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/clients/new')}>
            <Contact className="h-4 w-4" />
            Add client
          </Button>
        }
      />
    </div>
  )
}
