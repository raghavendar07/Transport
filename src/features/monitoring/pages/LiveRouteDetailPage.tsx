import { useParams } from 'react-router-dom'
import { MapPin, Clock, Image as ImageIcon, CheckCircle2, Circle } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardBody, AsyncBoundary } from '@/components/ui'
import { MapView } from '@/components/domain'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'

import { useLiveRoute } from '../hooks'

export function LiveRouteDetailPage() {
  const { id } = useParams()
  const query = useLiveRoute(id)

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={() => false}
    >
      {(live) => (
        <div>
          <PageHeader
            title={`Live route — ${live.route.session}`}
            breadcrumbs={[{ label: 'Live Routes', to: '/monitoring' }, { label: live.route.id }]}
            actions={<RouteStatusBadge status={live.route.status} />}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>GPS path</CardTitle>
              </CardHeader>
              <CardBody>
                <MapView
                  path={live.path}
                  markers={live.path.map((p, i) => ({ ...p, label: `Point ${i + 1}` }))}
                  height={360}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event log</CardTitle>
              </CardHeader>
              <CardBody>
                <ol className="space-y-3">
                  {live.events.map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex items-center gap-1 text-xs font-medium text-text-subtle">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {e.time}
                      </span>
                      <span className="text-sm text-text">{e.label}</span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Stop timeline</CardTitle>
              </CardHeader>
              <CardBody>
                <ol className="space-y-3">
                  {live.route.stops.map((s) => {
                    const done = s.status === 'completed'
                    return (
                      <li key={s.id} className="flex items-start gap-3">
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-status-active" aria-hidden />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 text-text-subtle" aria-hidden />
                        )}
                        <div>
                          <p className="text-sm font-medium text-text">{s.clientName}</p>
                          <p className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin className="h-3 w-3" aria-hidden />
                            {s.clientUci} · {s.type} · planned {s.plannedTime}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Driver photos</CardTitle>
              </CardHeader>
              <CardBody>
                {live.photos.length === 0 ? (
                  <p className="text-sm text-text-subtle">No photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {live.photos.map((p) => (
                      <div key={p.id} className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-hover text-center">
                        <ImageIcon className="h-6 w-6 text-text-subtle" aria-hidden />
                        <span className="mt-1 px-1 text-xs text-text-subtle">{p.stopName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </AsyncBoundary>
  )
}
