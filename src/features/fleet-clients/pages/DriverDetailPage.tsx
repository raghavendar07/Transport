import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  Tabs,
  TabsList,
  TabTrigger,
  TabPanel,
  Avatar,
  AsyncBoundary,
  EmptyState,
} from '@/components/ui'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { formatDate } from '@/lib/format'
import { DocumentsSummary } from '../components/DocumentsSummary'
import { driversApi } from '../hooks'

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-text-subtle" aria-hidden />
      <div>
        <dt className="text-xs text-text-subtle">{label}</dt>
        <dd className="text-sm text-text">{value}</dd>
      </div>
    </div>
  )
}

export function DriverDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = driversApi.useGet(id)

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={() => false}
    >
      {(driver) => (
        <div>
          <PageHeader
            title={driver.name}
            breadcrumbs={[{ label: 'Drivers', to: '/drivers' }, { label: driver.name }]}
            actions={
              <Button variant="secondary" onClick={() => navigate(`/drivers/${driver.id}/edit`)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardBody className="flex flex-col items-center text-center">
                <Avatar name={driver.name} src={driver.photoUrl} size="lg" />
                <h2 className="mt-3 text-base font-semibold text-text">{driver.name}</h2>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <StatusBadge status={driver.status} />
                  <ExpiryBadge date={driver.licenceExpiry} />
                </div>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardBody>
                <Tabs defaultValue="profile">
                  <TabsList>
                    <TabTrigger value="profile">Profile</TabTrigger>
                    <TabTrigger value="documents">Documents</TabTrigger>
                    <TabTrigger value="history">Assignment history</TabTrigger>
                  </TabsList>
                  <TabPanel value="profile">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InfoRow icon={Mail} label="Email" value={driver.email} />
                      <InfoRow icon={Phone} label="Phone" value={driver.phone} />
                      <InfoRow icon={Calendar} label="Date of birth" value={formatDate(driver.dob)} />
                      <InfoRow icon={MapPin} label="Address" value={driver.address} />
                      <InfoRow
                        icon={Calendar}
                        label="Licence number"
                        value={driver.licenceNumber}
                      />
                      <InfoRow
                        icon={Calendar}
                        label="Licence expiry"
                        value={formatDate(driver.licenceExpiry)}
                      />
                    </dl>
                  </TabPanel>
                  <TabPanel value="documents">
                    <DocumentsSummary documents={driver.documents} />
                  </TabPanel>
                  <TabPanel value="history">
                    <EmptyState
                      title="No assignments yet"
                      description="Route assignment history appears here once routes are planned."
                    />
                  </TabPanel>
                </Tabs>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </AsyncBoundary>
  )
}
