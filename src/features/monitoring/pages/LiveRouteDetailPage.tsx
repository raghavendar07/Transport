import { useParams } from 'react-router-dom'
import {
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  LogIn,
  ShieldCheck,
  PlayCircle,
  Flag,
  ArrowUpFromLine,
  ArrowDownToLine,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardBody, AsyncBoundary } from '@/components/ui'
import { MapView } from '@/components/domain'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import { cn } from '@/lib/cn'
import type { LiveEvent } from '@/lib/api/mock/monitoring'

import { useLiveRoute } from '../hooks'

const EVENT_META: Record<LiveEvent['kind'], { icon: LucideIcon; tone: string; bg: string }> = {
  check_in: { icon: LogIn, tone: 'text-status-active', bg: 'bg-status-active-bg' },
  safety: { icon: ShieldCheck, tone: 'text-brand', bg: 'bg-brand-100' },
  route: { icon: PlayCircle, tone: 'text-status-warn', bg: 'bg-status-warn-bg' },
  arrival: { icon: Flag, tone: 'text-brand', bg: 'bg-brand-100' },
  pickup: { icon: ArrowUpFromLine, tone: 'text-status-active', bg: 'bg-status-active-bg' },
  drop: { icon: ArrowDownToLine, tone: 'text-status-info', bg: 'bg-status-info-bg' },
  note: { icon: StickyNote, tone: 'text-text-muted', bg: 'bg-surface-hover' },
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Event log</CardTitle>
                <span className="text-xs text-text-subtle">{live.events.length} events</span>
              </CardHeader>
              <CardBody>
                <ol className="relative space-y-5">
                  {/* Vertical connector line */}
                  <span
                    className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
                    aria-hidden
                  />
                  {live.events.map((e, i) => {
                    const meta = EVENT_META[e.kind]
                    const Icon = meta.icon
                    return (
                      <li key={i} className="relative flex gap-3">
                        <span
                          className={cn(
                            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
                            meta.bg,
                            meta.tone,
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                                {initials(e.actor)}
                              </span>
                              {e.actor}
                            </span>
                            <span className="text-xs text-text-subtle">
                              {e.relative} · {e.time}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-text-muted">{e.label}</p>
                        </div>
                      </li>
                    )
                  })}
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
