import type { LucideIcon } from 'lucide-react'
import { Card, CardBody } from '@/components/ui'

/** Compact KPI tile used across the role dashboards. */
export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'bg-status-neutral-bg text-status-neutral',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-bold text-text">{value}</p>
          <p className="text-sm text-text-muted">{label}</p>
        </div>
      </CardBody>
    </Card>
  )
}
