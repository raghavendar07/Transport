import { ShieldCheck, AlertTriangle, ShieldX } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { expiryStatus, formatDate, type ExpiryStatus } from '@/lib/format'

const META: Record<ExpiryStatus, { tone: BadgeTone; label: string; icon: typeof ShieldCheck }> = {
  active: { tone: 'active', label: 'Valid', icon: ShieldCheck },
  expiring: { tone: 'warn', label: 'Expiring soon', icon: AlertTriangle },
  expired: { tone: 'expired', label: 'Expired', icon: ShieldX },
}

/**
 * The single expiry indicator used everywhere (licences, insurance, registration, docs).
 * Colour-blind-safe: tone + icon + text, never colour alone.
 * green = valid · amber = within 30 days · red = expired.
 */
export function ExpiryBadge({
  date,
  showDate = false,
}: {
  date: string | null | undefined
  showDate?: boolean
}) {
  const status = expiryStatus(date)
  if (!status) return <span className="text-text-subtle">—</span>
  const m = META[status]
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m.label}
      {showDate && date && <span className="font-normal opacity-80">· {formatDate(date)}</span>}
    </Badge>
  )
}
