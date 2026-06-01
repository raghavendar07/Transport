import { useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, Card, CardBody, CardHeader, CardTitle, AsyncBoundary } from '@/components/ui'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { formatDate } from '@/lib/format'
import { tenantsApi } from '../hooks'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value}</dd>
    </div>
  )
}

export function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = tenantsApi.useGet(id)

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={() => false}
    >
      {(t) => (
        <div>
          <PageHeader
            title={t.name}
            breadcrumbs={[{ label: 'Tenants', to: '/tenants' }, { label: t.code }]}
            actions={
              <Button variant="secondary" onClick={() => navigate(`/tenants/${t.id}/edit`)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Company details</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Company name" value={t.name} />
                <Field label="Code" value={<span className="font-mono">{t.code}</span>} />
                <Field label="Country" value={t.country} />
                <Field label="Timezone" value={t.timezone} />
                <Field label="Default language" value={t.defaultLanguage.toUpperCase()} />
                <Field label="Status" value={<StatusBadge status={t.status} />} />
                <Field label="Created" value={formatDate(t.createdAt)} />
              </dl>
            </CardBody>
          </Card>
        </div>
      )}
    </AsyncBoundary>
  )
}
