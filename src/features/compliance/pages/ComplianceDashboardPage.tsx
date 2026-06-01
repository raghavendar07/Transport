import { IdCard, Car, FileWarning, ShieldAlert, ClipboardX } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardBody, Spinner } from '@/components/ui'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { AlertsPanel } from '@/features/monitoring/components/AlertsPanel'
import { driversApi, vehiclesApi } from '@/features/fleet-clients/hooks'
import { expiryStatus } from '@/lib/format'
import { StatCard } from '@/features/monitoring/components/StatCard'
import { useComplianceSummary, documentsApi } from '../hooks'

function ExpiryRow({ name, sub, date }: { name: string; sub: string; date: string | null }) {
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{name}</p>
        <p className="truncate text-xs text-text-subtle">{sub}</p>
      </div>
      {date ? <ExpiryBadge date={date} showDate /> : <span className="text-xs text-text-subtle">No expiry</span>}
    </li>
  )
}

function ExpirySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <ul className="divide-y divide-border">{children}</ul>
      </CardBody>
    </Card>
  )
}

const flagged = (date: string | null) => {
  const s = expiryStatus(date)
  return s === 'expiring' || s === 'expired'
}

export function ComplianceDashboardPage() {
  const { summary, isLoading } = useComplianceSummary()
  const drivers = driversApi.useList({ pageSize: 200 })
  const vehicles = vehiclesApi.useList({ pageSize: 200 })
  const docs = documentsApi.useList({ pageSize: 200 })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const driverRows = (drivers.data?.items ?? []).filter((d) => flagged(d.licenceExpiry))
  const insuranceRows = (vehicles.data?.items ?? []).filter((v) => flagged(v.insuranceExpiry))
  const registrationRows = (vehicles.data?.items ?? []).filter((v) => flagged(v.registrationExpiry))
  const docRows = (docs.data?.items ?? []).filter((d) => flagged(d.expiryDate))

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        description="Expiry tracking and compliance posture across drivers, vehicles and documents."
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={IdCard} label="Drivers Expiring Soon" value={summary.driversExpiringSoon + summary.driversExpired} tone="bg-status-warn-bg text-status-warn" />
        <StatCard icon={Car} label="Vehicles Expiring Soon" value={summary.vehiclesExpiringSoon + summary.vehiclesExpired} tone="bg-status-warn-bg text-status-warn" />
        <StatCard icon={FileWarning} label="Documents Expiring Soon" value={summary.documentsExpiringSoon + summary.documentsExpired} tone="bg-status-warn-bg text-status-warn" />
        <StatCard icon={ShieldAlert} label="Active Compliance Issues" value={summary.activeIssues} tone="bg-status-expired-bg text-status-expired" />
        <StatCard icon={ClipboardX} label="Failed Checklists" value={summary.failedChecklists} tone="bg-status-expired-bg text-status-expired" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpirySection title="Driver License Expiry">
          {driverRows.length ? (
            driverRows.map((d) => <ExpiryRow key={d.id} name={d.name} sub={`Licence ${d.licenceNumber}`} date={d.licenceExpiry} />)
          ) : (
            <li className="px-5 py-4 text-sm text-text-subtle">All driver licences valid.</li>
          )}
        </ExpirySection>

        <ExpirySection title="Vehicle Insurance Expiry">
          {insuranceRows.length ? (
            insuranceRows.map((v) => <ExpiryRow key={v.id} name={v.registration} sub={`${v.make} ${v.model}`} date={v.insuranceExpiry} />)
          ) : (
            <li className="px-5 py-4 text-sm text-text-subtle">All insurance valid.</li>
          )}
        </ExpirySection>

        <ExpirySection title="Vehicle Registration Expiry">
          {registrationRows.length ? (
            registrationRows.map((v) => <ExpiryRow key={v.id} name={v.registration} sub={`${v.make} ${v.model}`} date={v.registrationExpiry} />)
          ) : (
            <li className="px-5 py-4 text-sm text-text-subtle">All registrations valid.</li>
          )}
        </ExpirySection>

        <ExpirySection title="Compliance Document Expiry">
          {docRows.length ? (
            docRows.map((d) => <ExpiryRow key={d.id} name={d.title} sub={d.type} date={d.expiryDate} />)
          ) : (
            <li className="px-5 py-4 text-sm text-text-subtle">No documents expiring.</li>
          )}
        </ExpirySection>

        <div className="lg:col-span-2">
          <AlertsPanel />
        </div>
      </div>
    </div>
  )
}
