import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Copy, Truck, Clock, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, Card, CardBody, Input, AsyncBoundary, EmptyState } from '@/components/ui'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import { cn } from '@/lib/cn'
import type { RouteSession } from '@/lib/api/types'
import { useRoutesList } from '../hooks'
import { useFleetOptions } from '../useFleetOptions'
import { CopyRoutesDialog } from '../components/CopyRoutesDialog'

const TODAY = '2026-06-01'

export function RoutesOverviewPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(TODAY)
  const [session, setSession] = useState<RouteSession>('AM')
  const [copyOpen, setCopyOpen] = useState(false)
  const { driverName, vehicleLabel } = useFleetOptions()

  const query = useRoutesList({ pageSize: 100, filters: { date } })
  const routes = (query.data?.items ?? []).filter((r) => r.session === session)

  return (
    <div>
      <PageHeader
        title="Route Planning"
        description="Plan and publish daily AM/PM routes."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCopyOpen(true)}>
              <Copy className="h-4 w-4" />
              Copy day
            </Button>
            <Button onClick={() => navigate(`/routes/new?date=${date}&session=${session}`)}>
              <Plus className="h-4 w-4" />
              Create route
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="route-date" className="mb-1.5 block text-sm font-medium text-text">
            Date
          </label>
          <Input id="route-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <div role="tablist" aria-label="Session" className="inline-flex rounded-md border border-border p-0.5">
          {(['AM', 'PM'] as RouteSession[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={session === s}
              onClick={() => setSession(s)}
              className={cn(
                'rounded px-4 py-1.5 text-sm font-medium transition-colors',
                session === s ? 'bg-brand text-brand-fg' : 'text-text-muted hover:text-text',
              )}
            >
              {s}
            </button>
          ))}
        </div>
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
              title={`No ${session} routes for this date`}
              description="Create a route or copy a previous day."
              action={
                <Button size="sm" onClick={() => navigate(`/routes/new?date=${date}&session=${session}`)}>
                  <Plus className="h-4 w-4" />
                  Create route
                </Button>
              }
            />
          </Card>
        }
      >
        {(list) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {list.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer transition-shadow hover:shadow-pop"
                onClick={() => navigate(`/routes/${r.id}`)}
              >
                <CardBody>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">
                      {r.session} · {r.stops.length} stop{r.stops.length === 1 ? '' : 's'}
                    </span>
                    <RouteStatusBadge status={r.status} />
                  </div>
                  <div className="space-y-1.5 text-sm text-text-muted">
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

      <CopyRoutesDialog open={copyOpen} onOpenChange={setCopyOpen} defaultFrom={date} />
    </div>
  )
}
