import { FileText, CheckCircle2, AlertTriangle, XCircle, CircleDashed } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import type { RequiredDocument } from '@/lib/api/types'
import { documentStatus, type DocStatus } from '../documents'

const STATUS_META: Record<DocStatus, { tone: BadgeTone; label: string; icon: typeof CheckCircle2 }> = {
  missing: { tone: 'neutral', label: 'Not uploaded', icon: CircleDashed },
  active: { tone: 'active', label: 'Valid', icon: CheckCircle2 },
  expiring: { tone: 'warn', label: 'Expiring soon', icon: AlertTriangle },
  expired: { tone: 'expired', label: 'Expired', icon: XCircle },
}

/** Documents whose status needs attention (expiring/expired/missing), for alert banners. */
export function expiryAlerts(documents: RequiredDocument[]) {
  return documents.filter((d) => {
    const s = documentStatus(d)
    return s === 'expiring' || s === 'expired'
  })
}

/** Read-only list of required documents with per-document status. */
export function DocumentsSummary({ documents }: { documents: RequiredDocument[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents linked"
        description="Upload required documents by editing this record."
      />
    )
  }
  return (
    <ul className="divide-y divide-border">
      {documents.map((doc) => {
        const meta = STATUS_META[documentStatus(doc)]
        return (
          <li key={doc.type} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 text-text-subtle" aria-hidden />
              <div>
                <p className="text-sm font-medium text-text">{doc.type}</p>
                <p className="text-xs text-text-subtle">
                  {doc.fileName ?? 'No file'}
                  {doc.expiryDate ? ` · expires ${formatDate(doc.expiryDate)}` : ''}
                </p>
              </div>
            </div>
            <Badge tone={meta.tone} icon={meta.icon}>
              {meta.label}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}

/** Compact amber/red banner summarising documents needing attention. */
export function DocumentExpiryAlert({ documents }: { documents: RequiredDocument[] }) {
  const alerts = expiryAlerts(documents)
  if (alerts.length === 0) return null
  return (
    <Card className="border-status-warn-bg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-status-warn">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Document expiry alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardBody>
        <DocumentsSummary documents={alerts} />
      </CardBody>
    </Card>
  )
}
