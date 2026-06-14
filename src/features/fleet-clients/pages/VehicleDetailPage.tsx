import { useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, Card, CardBody, CardHeader, CardTitle, AsyncBoundary } from '@/components/ui'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { formatDate } from '@/lib/format'
import { DocumentsSummary, DocumentExpiryAlert } from '../components/DocumentsSummary'
import { MaintenanceLogsSection } from '../components/MaintenanceLogsSection'
import { VehicleAttachmentsSection } from '../components/VehicleAttachmentsSection'
import { vehiclesApi } from '../hooks'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value}</dd>
    </div>
  )
}

export function VehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = vehiclesApi.useGet(id)

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={() => false}
    >
      {(v) => (
        <div>
          <PageHeader
            title={`${v.make} ${v.model}`}
            breadcrumbs={[{ label: 'Vehicles', to: '/vehicles' }, { label: v.registration }]}
            actions={
              <Button variant="secondary" onClick={() => navigate(`/vehicles/${v.id}/edit`)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          <div className="mb-6">
            <DocumentExpiryAlert documents={v.documents} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Registration" value={<span className="font-mono">{v.registration}</span>} />
                  <Field label="Status" value={<StatusBadge status={v.status} />} />
                  <Field label="Make / Model" value={`${v.make} ${v.model}`} />
                  <Field label="Year" value={v.year} />
                  <Field label="Capacity" value={`${v.capacity} seats`} />
                  <Field label="Fuel type" value={<span className="capitalize">{v.fuelType}</span>} />
                  <Field label="Odometer" value={`${v.odometer.toLocaleString()} mi`} />
                </dl>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="space-y-4">
                  <Field
                    label="Insurance expiry"
                    value={
                      <div className="flex items-center gap-2">
                        <ExpiryBadge date={v.insuranceExpiry} />
                        <span className="text-text-muted">{formatDate(v.insuranceExpiry)}</span>
                      </div>
                    }
                  />
                  <Field
                    label="Registration expiry"
                    value={
                      <div className="flex items-center gap-2">
                        <ExpiryBadge date={v.registrationExpiry} />
                        <span className="text-text-muted">{formatDate(v.registrationExpiry)}</span>
                      </div>
                    }
                  />
                </dl>
              </CardBody>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
              </CardHeader>
              <CardBody>
                <DocumentsSummary documents={v.documents} />
              </CardBody>
            </Card>
            <MaintenanceLogsSection vehicle={v} />
            <VehicleAttachmentsSection vehicle={v} />
          </div>
        </div>
      )}
    </AsyncBoundary>
  )
}
