import { ShieldX, AlertTriangle, ClipboardX } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody, AsyncBoundary, EmptyState } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
import { useAlerts } from '../hooks'
import type { Alert } from '@/lib/api/mock/monitoring'

const ICON = {
  licence: ShieldX,
  insurance: ShieldX,
  registration: ShieldX,
  checklist: ClipboardX,
} as const

/** Compliance alerts: expiring/expired licences & documents, checklist failures. */
export function AlertsPanel() {
  const query = useAlerts()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <AsyncBoundary
          isLoading={query.isLoading}
          isError={query.isError}
          data={query.data}
          onRetry={query.refetch}
          emptyFallback={<EmptyState title="No active alerts" description="Licences, documents and checks are all in good standing." />}
        >
          {(alerts: Alert[]) => (
            <ul className="divide-y divide-border">
              {alerts.map((a) => {
                const Icon = a.severity === 'expired' ? ICON[a.category] : AlertTriangle
                return (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <Icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${a.severity === 'expired' ? 'text-status-expired' : 'text-status-warn'}`}
                      aria-hidden
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{a.title}</p>
                      <p className="text-xs text-text-muted">{a.detail}</p>
                    </div>
                    <Badge tone={a.severity === 'expired' ? 'expired' : 'warn'}>
                      {a.severity === 'expired' ? 'Expired' : 'Action needed'}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </AsyncBoundary>
      </CardBody>
    </Card>
  )
}
