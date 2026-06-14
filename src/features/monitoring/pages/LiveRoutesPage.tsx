import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Radio,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Truck,
  CalendarDays,
  RefreshCw,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardBody, AsyncBoundary, EmptyState, Button } from '@/components/ui'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import { useRoutesList } from '@/features/routes-planning/hooks'
import { useFleetOptions } from '@/features/routes-planning/useFleetOptions'
import { driversApi, vehiclesApi } from '@/features/fleet-clients/hooks'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { RoutePlan } from '@/lib/api/types'

const TODAY = '2026-06-01'

type TabKey = 'all' | 'in_progress' | 'published'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Active' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'published', label: 'Published' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function nextStop(route: RoutePlan) {
  return route.stops.find((s) => s.status === 'pending') ?? null
}

function progressPct(route: RoutePlan) {
  if (route.stops.length === 0) return 0
  const done = route.stops.filter((s) => s.status === 'completed').length
  return Math.round((done / route.stops.length) * 100)
}

export function LiveRoutesPage() {
  const navigate = useNavigate()
  const [date] = useState(TODAY)
  const [tab, setTab] = useState<TabKey>('all')
  const query = useRoutesList({ pageSize: 100, filters: { date } })
  const { driverName } = useFleetOptions()
  const driversList = driversApi.useList({ pageSize: 200 })
  const vehiclesList = vehiclesApi.useList({ pageSize: 200 })

  const allActive = useMemo(
    () =>
      (query.data?.items ?? []).filter(
        (r) => r.status === 'published' || r.status === 'in_progress',
      ),
    [query.data],
  )

  const counts = useMemo(() => {
    const inProgress = allActive.filter((r) => r.status === 'in_progress').length
    const published = allActive.filter((r) => r.status === 'published').length
    return { all: allActive.length, in_progress: inProgress, published }
  }, [allActive])

  const visible = allActive.filter((r) => (tab === 'all' ? true : r.status === tab))

  function vehicleReg(id: string) {
    return vehiclesList.data?.items.find((v) => v.id === id)?.registration ?? '—'
  }
  function driverObj(id: string) {
    return driversList.data?.items.find((d) => d.id === id) ?? null
  }

  return (
    <div>
      <PageHeader
        title="Live Routes"
        description={`Real-time view of routes on the road · ${formatDate(date)}`}
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
        }
      />

      <div role="tablist" aria-label="Live route status" className="mb-4 flex flex-wrap gap-1 border-b border-border">
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

      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        data={visible}
        onRetry={query.refetch}
        emptyFallback={
          <Card>
            <EmptyState
              icon={Radio}
              title="No live routes right now"
              description="Routes appear here when dispatchers publish them or drivers start a trip."
            />
          </Card>
        }
      >
        {(list) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => {
              const driver = driverObj(r.driverId)
              const reg = vehicleReg(r.vehicleId)
              const next = nextStop(r)
              const pct = progressPct(r)
              const done = r.stops.filter((s) => s.status === 'completed').length
              const passengers = new Set(r.stops.map((s) => s.clientId)).size
              const live = r.status === 'in_progress'
              return (
                <Card
                  key={r.id}
                  className="cursor-pointer transition-all hover:border-border-strong hover:-translate-y-px"
                  onClick={() => navigate(`/monitoring/${r.id}`)}
                >
                  <CardBody className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
                          {live && (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-active opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-active" />
                            </span>
                          )}
                          <span>{r.session} · {r.startTime}</span>
                        </div>
                        <h3 className="truncate text-sm font-semibold text-text">
                          {r.name || 'Untitled route'}
                        </h3>
                      </div>
                      <RouteStatusBadge status={r.status} />
                    </div>

                    <div className="space-y-1.5 text-sm text-text-muted">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-text-subtle" aria-hidden />
                        {formatDate(r.date)} · {r.stops.length} stop{r.stops.length === 1 ? '' : 's'}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-brand-100 text-[10px] font-semibold text-brand-700">
                          {driver ? initials(driver.name) : '—'}
                        </span>
                        <span className="truncate">{driverName(r.driverId)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-text-subtle" aria-hidden />
                        <span className="font-mono">{reg}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-text-subtle" aria-hidden />
                        {passengers} passenger{passengers === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="border-t border-border pt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-text-muted">
                          <MapPin className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                          Stops
                        </span>
                        <span className="tabular-nums text-text">
                          {done}/{r.stops.length} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                        <div
                          className={cn('h-full transition-all', live ? 'bg-status-active' : 'bg-brand')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {next ? (
                      <p className="flex items-center gap-2 text-sm text-text-muted">
                        <Clock className="h-4 w-4 text-text-subtle" aria-hidden />
                        Next stop {next.plannedTime} — {next.clientName}
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-status-active">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        All stops completed
                      </p>
                    )}
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}
