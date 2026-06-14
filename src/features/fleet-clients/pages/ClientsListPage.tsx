import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Contact } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column } from '@/components/ui'
import { SearchInput, RowActionsMenu } from '@/components/domain'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { formatDate } from '@/lib/format'
import { useListControls } from '@/lib/useListControls'
import { useRoutesList } from '@/features/routes-planning/hooks'
import type { Client, ClientAddress, AddressRole } from '@/lib/api/types'
import { clientsApi } from '../hooks'

const ACTIVE_ROUTE_STATUSES = new Set(['draft', 'published', 'in_progress'])

function addressLine(addr: ClientAddress | undefined) {
  if (!addr) return <span className="text-text-subtle">—</span>
  return (
    <span className="text-text-muted">
      {addr.line1}, {addr.city} {addr.postcode}
    </span>
  )
}

export function ClientsListPage() {
  const navigate = useNavigate()
  const { search, page, setPage, onSearchChange, params } = useListControls()
  const { data, isLoading, isError, refetch } = clientsApi.useList(params)
  const remove = clientsApi.useRemove()
  const routesQuery = useRoutesList({ pageSize: 200 })

  // Count active routes that reference each client via a stop.
  const activeRoutesByClient = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of routesQuery.data?.items ?? []) {
      if (!ACTIVE_ROUTE_STATUSES.has(r.status)) continue
      const clientIds = new Set(r.stops.map((s) => s.clientId))
      for (const cid of clientIds) counts[cid] = (counts[cid] ?? 0) + 1
    }
    return counts
  }, [routesQuery.data])

  const addr = (c: Client, role: AddressRole) => c.addresses.find((a) => a.role === role)

  const columns: Column<Client>[] = [
    { key: 'uci', header: 'UCI', cell: (c) => <span className="font-mono font-medium">{c.uci}</span>, sortValue: (c) => c.uci },
    { key: 'name', header: 'Client Name', cell: (c) => <span className="font-medium">{c.name}</span>, sortValue: (c) => c.name },
    { key: 'phone', header: 'Phone', className: 'whitespace-nowrap', cell: (c) => <span className="whitespace-nowrap text-text-muted">{c.contactPhone}</span> },
    {
      key: 'authNumber',
      header: 'Authorization #',
      className: 'whitespace-nowrap',
      cell: (c) =>
        c.authorizationNumber ? (
          <span className="whitespace-nowrap font-mono text-xs text-text">{c.authorizationNumber}</span>
        ) : (
          <span className="text-text-subtle">—</span>
        ),
      sortValue: (c) => c.authorizationNumber ?? '',
    },
    {
      key: 'authExpiry',
      header: 'Auth Expiry',
      className: 'whitespace-nowrap',
      cell: (c) =>
        c.authorizationExpiry ? (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <ExpiryBadge date={c.authorizationExpiry} />
            <span className="text-xs text-text-subtle tabular-nums">{formatDate(c.authorizationExpiry)}</span>
          </div>
        ) : (
          <span className="text-text-subtle">—</span>
        ),
      sortValue: (c) => c.authorizationExpiry ?? '',
    },
    { key: 'pickup', header: 'Pickup Address', cell: (c) => addressLine(addr(c, 'pickup')) },
    { key: 'dropoff', header: 'Drop-off Address', cell: (c) => addressLine(addr(c, 'dropoff')) },
    {
      key: 'activeRoutes',
      header: 'Active Routes',
      align: 'center',
      sortValue: (c) => activeRoutesByClient[c.id] ?? 0,
      cell: (c) => <span className="font-medium tabular-nums">{activeRoutesByClient[c.id] ?? 0}</span>,
    },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} />, sortValue: (c) => c.status },
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
          <RowActionsMenu
            itemLabel={c.name}
            onEdit={() => navigate(`/clients/${c.id}/edit`)}
            onDelete={() => remove.mutateAsync(c.id)}
            deleteSuccessMessage="Client deleted"
          />
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
