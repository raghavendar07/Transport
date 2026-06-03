import { Route as RouteIcon, Truck, Car, Percent, MapPin } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody, Spinner } from '@/components/ui'
import { MapView } from '@/components/domain'
import { AlertsPanel } from './AlertsPanel'
import { StatCard } from './StatCard'
import type { DashboardSummary } from '@/lib/api/mock/monitoring'

const STATUS_BARS: { key: keyof DashboardSummary; label: string; color: string }[] = [
  { key: 'completed', label: 'Completed', color: 'bg-status-active' },
  { key: 'inProgress', label: 'In progress', color: 'bg-status-warn' },
  { key: 'published', label: 'Published', color: 'bg-brand' },
  { key: 'draft', label: 'Draft', color: 'bg-status-neutral' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-status-expired' },
]

const DEMO_PATH = [
  { lat: 53.4451, lng: -2.2299 },
  { lat: 53.4612, lng: -2.2401 },
  { lat: 53.4779, lng: -2.2452 },
]

export function DispatcherDashboard({ data, isLoading }: { data?: DashboardSummary; isLoading: boolean }) {
  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const totalForBars = STATUS_BARS.reduce((s, b) => s + (data[b.key] as number), 0) || 1

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={RouteIcon} label="Total Routes" value={data.totalRoutes} tone="bg-status-info-bg text-status-info" />
        <StatCard icon={Truck} label="Drivers Active" value={data.driversActive} tone="bg-brand-100 text-brand-700" />
        <StatCard icon={Car} label="Vehicles In Use" value={data.vehiclesInUse} tone="bg-status-neutral-bg text-status-neutral" />
        <StatCard icon={Percent} label="Route Completion" value={`${data.completionPct}%`} tone="bg-status-active-bg text-status-active" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Route Map</CardTitle>
          </CardHeader>
          <CardBody>
            <MapView path={DEMO_PATH} markers={DEMO_PATH.map((p, i) => ({ ...p, label: `Vehicle ${i + 1}` }))} height={300} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Status Distribution</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {STATUS_BARS.map((b) => {
              const v = data[b.key] as number
              return (
                <div key={b.key}>
                  <div className="mb-1 flex justify-between text-xs text-text-muted">
                    <span>{b.label}</span>
                    <span className="font-medium text-text">{v}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div className={`h-full ${b.color}`} style={{ width: `${(v / totalForBars) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Route Activity Timeline</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3 text-sm">
              {[
                { t: '08:02', l: 'AM route started — driver checked in' },
                { t: '08:16', l: 'Arrived at Sunrise Care Home' },
                { t: '08:19', l: 'Pickup confirmed with attestation' },
                { t: '08:45', l: 'Drop completed at Bridgewater Day Centre' },
              ].map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex items-center gap-1 text-xs font-medium text-text-subtle">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {e.t}
                  </span>
                  <span className="text-text">{e.l}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <div>
          <AlertsPanel />
        </div>
      </div>
    </div>
  )
}
