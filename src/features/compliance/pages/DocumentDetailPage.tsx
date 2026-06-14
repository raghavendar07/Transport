import { useParams } from 'react-router-dom'
import { FileText, RefreshCw, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, Card, CardBody, CardHeader, CardTitle, AsyncBoundary, useToast } from '@/components/ui'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { formatDate, expiryCountdown } from '@/lib/format'
import { documentsApi } from '../hooks'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value}</dd>
    </div>
  )
}

export function DocumentDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const query = documentsApi.useGet(id)

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={() => false}
    >
      {(doc) => (
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title={doc.title}
            breadcrumbs={[{ label: 'Documents', to: '/documents' }, { label: doc.title }]}
            actions={
              <Button variant="secondary" onClick={() => toast.success('Replace', 'Upload a new version (mock).')}>
                <RefreshCw className="h-4 w-4" />
                Replace
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Type" value={doc.type} />
                  <Field label="Scope" value={<span className="capitalize">{doc.scope}</span>} />
                  <Field label="Issued" value={formatDate(doc.issueDate)} />
                  <Field label="Expiry" value={doc.expiryDate ? formatDate(doc.expiryDate) : 'No expiry'} />
                  <Field label="Notes" value={doc.notes || '—'} />
                </dl>
                <div className="mt-4 flex items-center justify-between rounded-md border border-border p-3">
                  <span className="flex items-center gap-2 text-sm text-text">
                    <FileText className="h-4 w-4 text-text-subtle" aria-hidden />
                    {doc.fileName}
                    <span className="text-text-subtle">({(doc.fileSize / 1024).toFixed(0)} KB)</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => toast.success('Downloading…')}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expiry</CardTitle>
              </CardHeader>
              <CardBody className="text-center">
                {doc.expiryDate ? (
                  <>
                    <ExpiryBadge date={doc.expiryDate} />
                    <p className="mt-3 text-2xl font-bold text-text">{expiryCountdown(doc.expiryDate)}</p>
                    <p className="text-sm text-text-muted">{formatDate(doc.expiryDate)}</p>
                  </>
                ) : (
                  <p className="text-sm text-text-muted">This document has no expiry date.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </AsyncBoundary>
  )
}
