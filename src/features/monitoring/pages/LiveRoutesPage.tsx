import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardBody, AsyncBoundary, EmptyState } from '@/components/ui'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import { useRoutesList } from '@/features/routes-planning/hooks'
import { useFleetOptions } from '@/features/routes-planning/useFleetOptions'

const TODAY = '2026-06-01'

/** Live routes list — active routes for the day, click through to live detail. */
export function LiveRoutesPage() {
  const navigate = useNavigate()
  const [date] = useState(TODAY)
  const query = useRoutesList({ pageSize: 100, filters: { date } })
  const { driverName, vehicleLabel } = useFleetOptions()
  const active = (query.data?.items ?? []).filter((r) => r.status === 'published' || r.status === 'in_progress')

  return (
    <div>
      <PageHeader title="Live Routes" description="Routes currently published or in progress." />
      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        data={active}
        onRetry={query.refetch}
        emptyFallback={
          <Card>
            <EmptyState icon={Radio} title="No live routes" description="Published and in-progress routes appear here." />
          </Card>
        }
      >
        {(list) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {list.map((r) => (
              <Card key={r.id} className="cursor-pointer hover:shadow-pop" onClick={() => navigate(`/monitoring/${r.id}`)}>
                <CardBody>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">
                      {r.session} · {r.stops.length} stops
                    </span>
                    <RouteStatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-text-muted">
                    {driverName(r.driverId)} · {vehicleLabel(r.vehicleId)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}
