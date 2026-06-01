import { Shield, Building2, Route as RouteIcon, Truck } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { type Role, ROLE_LABELS } from '@/lib/rbac'

const META: Record<Role, { tone: BadgeTone; icon: typeof Shield }> = {
  super_admin: { tone: 'info', icon: Shield },
  tenant_admin: { tone: 'info', icon: Building2 },
  dispatcher: { tone: 'neutral', icon: RouteIcon },
  driver: { tone: 'neutral', icon: Truck },
}

export function RoleBadge({ role }: { role: Role }) {
  const m = META[role]
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}
