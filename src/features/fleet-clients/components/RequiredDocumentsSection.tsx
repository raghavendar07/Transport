import { Card, CardBody, CardHeader, CardTitle, FormField, Input, FileUpload } from '@/components/ui'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { FileText, CheckCircle2, AlertTriangle, XCircle, CircleDashed } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { RequiredDocument } from '@/lib/api/types'
import { documentStatus, type DocStatus } from '../documents'

interface Props {
  documents: RequiredDocument[]
  onChange: (next: RequiredDocument[]) => void
}

const STATUS_META: Record<DocStatus, { tone: BadgeTone; label: string; icon: typeof CheckCircle2 }> = {
  missing: { tone: 'neutral', label: 'Not uploaded', icon: CircleDashed },
  active: { tone: 'active', label: 'Valid', icon: CheckCircle2 },
  expiring: { tone: 'warn', label: 'Expiring soon', icon: AlertTriangle },
  expired: { tone: 'expired', label: 'Expired', icon: XCircle },
}

/** Upload + dated metadata for a fixed set of required documents (driver or vehicle). */
export function RequiredDocumentsSection({ documents, onChange }: Props) {
  function patch(i: number, partial: Partial<RequiredDocument>) {
    onChange(documents.map((d, idx) => (idx === i ? { ...d, ...partial } : d)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-text-subtle" aria-hidden />
          Required Documents
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {documents.map((doc, i) => {
          const meta = STATUS_META[documentStatus(doc)]
          return (
            <div key={doc.type} className="rounded-md border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-text">{doc.type}</span>
                <Badge tone={meta.tone} icon={meta.icon}>
                  {meta.label}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Issue date">
                  {(f) => (
                    <Input
                      {...f}
                      type="date"
                      value={doc.issueDate}
                      onChange={(e) => patch(i, { issueDate: e.target.value })}
                    />
                  )}
                </FormField>
                <FormField label="Expiry date">
                  {(f) => (
                    <Input
                      {...f}
                      type="date"
                      value={doc.expiryDate}
                      onChange={(e) => patch(i, { expiryDate: e.target.value })}
                    />
                  )}
                </FormField>
                <FormField label="Upload file" className="sm:col-span-2">
                  {(f) => (
                    <FileUpload
                      {...f}
                      value={
                        doc.fileName
                          ? ({ name: doc.fileName, size: doc.fileSize ?? 0 } as unknown as File)
                          : null
                      }
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(file) =>
                        patch(i, { fileName: file?.name ?? null, fileSize: file?.size ?? null })
                      }
                    />
                  )}
                </FormField>
              </div>
              {doc.fileName && doc.expiryDate && (
                <p className="mt-2 text-xs text-text-subtle">
                  {doc.fileName} · expires {formatDate(doc.expiryDate)}
                </p>
              )}
            </div>
          )
        })}
      </CardBody>
    </Card>
  )
}
