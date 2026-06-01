import { useState } from 'react'
import { Route as RouteIcon, Truck, Car, CheckCheck, Loader, FileEdit, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardBody, Spinner, Input } from '@/components/ui'
import { AlertsPanel } from '../components/AlertsPanel'
import { useDashboard } from '../hooks'

const TODAY = '2026-06-01'

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Truck; label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-semibold text-text">{value}</p>
          <p className="text-sm text-text-muted">{label}</p>
        </div>
      </CardBody>
    </Card>
  )
}

export function DashboardPage() {
  const [date, setDate] = useState(TODAY)
  const { data, isLoading, isFetching } = useDashboard(date)

  return (
    <div>
      <PageHeader
        title="Operational Dashboard"
        description="Live view of today's operations — refreshes every 30 seconds."
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-text-subtle">
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
              {isFetching ? 'Updating…' : 'Live'}
            </span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi icon={RouteIcon} label="Routes today" value={data.totalRoutes} tone="bg-status-info-bg text-status-info" />
            <Kpi icon={Truck} label="Drivers active" value={data.driversActive} tone="bg-brand-100 text-brand-700" />
            <Kpi icon={Car} label="Vehicles in use" value={data.vehiclesInUse} tone="bg-status-neutral-bg text-status-neutral" />
            <Kpi icon={CheckCheck} label="Completed" value={data.completed} tone="bg-status-active-bg text-status-active" />
            <Kpi icon={Loader} label="In progress" value={data.inProgress} tone="bg-status-warn-bg text-status-warn" />
            <Kpi icon={FileEdit} label="Drafts" value={data.draft} tone="bg-status-neutral-bg text-status-neutral" />
          </div>

          <div className="mt-6">
            <AlertsPanel />
          </div>
        </>
      )}
    </div>
  )
}
