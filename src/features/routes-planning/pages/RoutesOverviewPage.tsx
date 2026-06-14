import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Copy, Truck, Clock, MapPin, CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, Card, CardBody, AsyncBoundary, EmptyState } from '@/components/ui'
import { SearchInput, RowActionsMenu } from '@/components/domain'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { RouteStatus } from '@/lib/api/types'
import { useRoutesList, useRouteMutations } from '../hooks'
import { useFleetOptions } from '../useFleetOptions'
import { CopyRoutesDialog } from '../components/CopyRoutesDialog'

type TabKey = 'all' | RouteStatus

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Routes' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function RoutesOverviewPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [copyOpen, setCopyOpen] = useState(false)
  const { driverName, vehicleLabel } = useFleetOptions()

  const query = useRoutesList({ pageSize: 200 })
  const { remove } = useRouteMutations()
  const all = useMemo(() => query.data?.items ?? [], [query.data])

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: all.length, draft: 0, published: 0, in_progress: 0, completed: 0, cancelled: 0 }
    for (const r of all) c[r.status] += 1
    return c
  }, [all])

  const routes = all
    .filter((r) => (tab === 'all' ? true : r.status === tab))
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div>
      <PageHeader
        title="Route Planning"
        description="Plan, publish and track passenger transport routes."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCopyOpen(true)}>
              <Copy className="h-4 w-4" />
              Copy day
            </Button>
            <Button onClick={() => navigate('/routes/new')}>
              <Plus className="h-4 w-4" />
              Create route
            </Button>
          </div>
        }
      />

      <div role="tablist" aria-label="Route status" className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-brand text-brand'
                : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            {t.label}
            <span
              className={cn(
                'rounded-[2px] px-2 py-0.5 text-xs tabular-nums',
                tab === t.key ? 'bg-brand text-brand-fg' : 'bg-surface-hover text-text-muted',
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Search routes by name…" />
      </div>

      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        data={routes}
        onRetry={query.refetch}
        emptyFallback={
          <Card>
            <EmptyState
              icon={MapPin}
              title="No routes here"
              description="Create a route or adjust the filters above."
              action={
                <Button size="sm" onClick={() => navigate('/routes/new')}>
                  <Plus className="h-4 w-4" />
                  Create route
                </Button>
              }
            />
          </Card>
        }
      >
        {(list) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer transition-all hover:border-border-strong hover:-translate-y-px"
                onClick={() => navigate(`/routes/${r.id}`)}
              >
                <CardBody>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text">{r.name || 'Untitled route'}</span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <RouteStatusBadge status={r.status} />
                      <RowActionsMenu
                        itemLabel={r.name || 'route'}
                        onEdit={() => navigate(`/routes/${r.id}`)}
                        onDelete={() => remove.mutateAsync(r.id)}
                        deleteSuccessMessage="Route deleted"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-text-muted">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-text-subtle" aria-hidden />
                      {formatDate(r.date)} · {r.session} · {r.stops.length} stop{r.stops.length === 1 ? '' : 's'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-text-subtle" aria-hidden />
                      {driverName(r.driverId)} · {vehicleLabel(r.vehicleId)}
                    </p>
                    {r.stops[0] && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-text-subtle" aria-hidden />
                        First stop {r.stops[0].plannedTime} — {r.stops[0].clientName}
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </AsyncBoundary>

      <CopyRoutesDialog open={copyOpen} onOpenChange={setCopyOpen} defaultFrom="2026-06-01" />
    </div>
  )
}
