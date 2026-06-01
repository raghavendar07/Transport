import { useNavigate } from 'react-router-dom'
import {
  Route as RouteIcon,
  Truck,
  Car,
  Contact,
  ShieldCheck,
  ShieldAlert,
  IdCard,
  FileWarning,
  ClipboardX,
  ScrollText,
  FileBarChart,
  UserPlus,
  Upload,
  ClipboardCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody, Button } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/format'
import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'
import { useComplianceSummary, useReports, useAuditList } from '@/features/compliance/hooks'
import { StatCard } from './StatCard'
import type { DashboardSummary } from '@/lib/api/mock/monitoring'

export function AdminDashboard({ data }: { data?: DashboardSummary }) {
  const navigate = useNavigate()
  const drivers = driversApi.useList({ pageSize: 1 })
  const vehicles = vehiclesApi.useList({ pageSize: 1 })
  const clients = clientsApi.useList({ pageSize: 1 })
  const { summary } = useComplianceSummary()
  const reports = useReports()
  const audit = useAuditList({ pageSize: 5 })

  const compliant = summary.activeIssues === 0
  const reportsReady = (reports.data ?? []).filter((r) => r.status === 'ready').length

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigate('/users/new')}>
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate('/documents/upload')}>
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate('/checklists')}>
          <ClipboardCheck className="h-4 w-4" /> Configure Checklist
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate('/reports')}>
          <FileBarChart className="h-4 w-4" /> Generate Report
        </Button>
      </div>

      {/* Business totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={RouteIcon} label="Total Routes (today)" value={data?.totalRoutes ?? '—'} tone="bg-status-info-bg text-status-info" />
        <StatCard icon={Truck} label="Total Drivers" value={drivers.data?.total ?? '—'} tone="bg-brand-100 text-brand-700" />
        <StatCard icon={Car} label="Total Vehicles" value={vehicles.data?.total ?? '—'} tone="bg-status-neutral-bg text-status-neutral" />
        <StatCard icon={Contact} label="Total Clients" value={clients.data?.total ?? '—'} tone="bg-status-neutral-bg text-status-neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Compliance status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-2 text-center">
            {compliant ? (
              <>
                <ShieldCheck className="h-10 w-10 text-status-active" aria-hidden />
                <Badge tone="active">All compliant</Badge>
              </>
            ) : (
              <>
                <ShieldAlert className="h-10 w-10 text-status-warn" aria-hidden />
                <Badge tone="warn">{summary.activeIssues} active issue{summary.activeIssues === 1 ? '' : 's'}</Badge>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => navigate('/compliance')}>
              Open Compliance Dashboard
            </Button>
          </CardBody>
        </Card>

        {/* Expiry counts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expiring & Failures</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Mini icon={IdCard} label="Expiring Licenses" value={summary.driversExpiringSoon + summary.driversExpired} />
            <Mini icon={Car} label="Expiring Insurance" value={summary.vehiclesExpiringSoon + summary.vehiclesExpired} />
            <Mini icon={FileWarning} label="Expiring Documents" value={summary.documentsExpiringSoon + summary.documentsExpired} />
            <Mini icon={ClipboardX} label="Checklist Failures" value={summary.failedChecklists} />
          </CardBody>
        </Card>

        {/* Recent audit */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Audit Activity</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {(audit.data?.items ?? []).map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                  <ScrollText className="mt-0.5 h-4 w-4 text-text-subtle" aria-hidden />
                  <div className="flex-1">
                    <p className="text-sm text-text">
                      <span className="font-medium">{e.actorName}</span> — {e.action}
                    </p>
                    <p className="text-xs text-text-subtle">{formatDateTime(e.createdAt)}</p>
                  </div>
                </li>
              ))}
              {audit.data?.items.length === 0 && <li className="px-5 py-4 text-sm text-text-subtle">No recent activity.</li>}
            </ul>
          </CardBody>
        </Card>

        {/* Reports generated */}
        <Card>
          <CardHeader>
            <CardTitle>Reports Generated</CardTitle>
          </CardHeader>
          <CardBody className="text-center">
            <p className="text-4xl font-semibold text-text">{reports.data?.length ?? 0}</p>
            <p className="text-sm text-text-muted">{reportsReady} ready to download</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => navigate('/reports')}>
              View reports
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Mini({ icon: Icon, label, value }: { icon: typeof IdCard; label: string; value: number }) {
  return (
    <div className="text-center">
      <Icon className={`mx-auto h-6 w-6 ${value > 0 ? 'text-status-warn' : 'text-text-subtle'}`} aria-hidden />
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
