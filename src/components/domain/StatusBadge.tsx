import { CheckCircle2, Circle, FileEdit, Send, Truck, CheckCheck, Ban } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import type { EntityStatus, RouteStatus } from '@/lib/api/types'

const ENTITY_META: Record<EntityStatus, { tone: BadgeTone; label: string; icon: typeof Circle }> = {
  active: { tone: 'active', label: 'Active', icon: CheckCircle2 },
  inactive: { tone: 'neutral', label: 'Inactive', icon: Circle },
}

/** Active/inactive entity status — colour + icon + text. */
export function StatusBadge({ status }: { status: EntityStatus }) {
  const m = ENTITY_META[status]
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m.label}
    </Badge>
  )
}

const ROUTE_META: Record<RouteStatus, { tone: BadgeTone; label: string; icon: typeof Circle }> = {
  draft: { tone: 'neutral', label: 'Draft', icon: FileEdit },
  published: { tone: 'info', label: 'Published', icon: Send },
  in_progress: { tone: 'warn', label: 'In progress', icon: Truck },
  completed: { tone: 'active', label: 'Completed', icon: CheckCheck },
  cancelled: { tone: 'expired', label: 'Cancelled', icon: Ban },
}

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const m = ROUTE_META[status]
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m.label}
    </Badge>
  )
}
