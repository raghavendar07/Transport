import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, MapPin, Crosshair, ShieldCheck, FileSignature, Calendar, CalendarX } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  AsyncBoundary,
  Modal,
  Input,
  FormField,
  useToast,
} from '@/components/ui'
import { MapView, type MapMarker } from '@/components/domain'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { expiryStatus, formatDate } from '@/lib/format'
import type { Client, ClientAddress } from '@/lib/api/types'
import { clientsApi } from '../hooks'

export function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const query = clientsApi.useGet(id)
  const update = clientsApi.useUpdate()
  const [editing, setEditing] = useState<ClientAddress | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  function openOverride(addr: ClientAddress) {
    setEditing(addr)
    setLat(addr.lat?.toString() ?? '')
    setLng(addr.lng?.toString() ?? '')
  }

  async function saveOverride() {
    if (!editing || !query.data) return
    const addresses = query.data.addresses.map((a) =>
      a.id === editing.id ? { ...a, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null } : a,
    )
    await update.mutateAsync({ id: query.data.id, data: { addresses } })
    toast.success('Coordinates updated')
    setEditing(null)
  }

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={() => false}
    >
      {(client) => {
        const markers: MapMarker[] = client.addresses
          .filter((a) => a.lat != null && a.lng != null)
          .map((a) => ({ lat: a.lat!, lng: a.lng!, label: a.label }))
        return (
          <div>
            <PageHeader
              title={client.name}
              breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: client.uci }]}
              actions={
                <Button variant="secondary" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              }
            />
            <AuthorizationCard client={client} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {client.addresses.map((a) => (
                    <div key={a.id} className="flex items-start justify-between rounded-md border border-border p-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-text-subtle" aria-hidden />
                        <div>
                          <p className="text-sm font-medium text-text">{a.role === 'pickup' ? 'Pickup' : 'Drop-off'}</p>
                          <p className="text-sm text-text-muted">
                            {a.line1}, {a.city}, {a.state} {a.postcode}
                          </p>
                          <p className="mt-0.5 text-xs text-text-subtle">
                            {a.lat != null && a.lng != null
                              ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`
                              : 'No coordinates — using geocode'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openOverride(a)}>
                        <Crosshair className="h-4 w-4" />
                        Override
                      </Button>
                    </div>
                  ))}
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Map</CardTitle>
                </CardHeader>
                <CardBody>
                  <MapView markers={markers} height={320} />
                </CardBody>
              </Card>
            </div>

            <Modal
              open={!!editing}
              onOpenChange={(o) => !o && setEditing(null)}
              title="Override coordinates"
              description={`Manually set the location for "${editing?.label}".`}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveOverride} loading={update.isPending}>
                    Save
                  </Button>
                </>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Latitude">
                  {(f) => <Input {...f} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="53.4451" />}
                </FormField>
                <FormField label="Longitude">
                  {(f) => <Input {...f} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-2.2299" />}
                </FormField>
              </div>
            </Modal>
          </div>
        )
      }}
    </AsyncBoundary>
  )
}

function AuthorizationCard({ client }: { client: Client }) {
  const status = client.authorizationExpiry ? expiryStatus(client.authorizationExpiry) : null
  const expired = status === 'expired'
  return (
    <Card
      className={cnEdge(
        'mb-6 border-l-4',
        expired ? 'border-l-status-expired' : status === 'expiring' ? 'border-l-status-warn' : 'border-l-status-active',
      )}
    >
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
          Authorization
        </CardTitle>
        {client.authorizationExpiry && <ExpiryBadge date={client.authorizationExpiry} />}
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AuthField
            icon={FileSignature}
            label="Authorization Number"
            value={client.authorizationNumber ? <span className="font-mono">{client.authorizationNumber}</span> : '—'}
          />
          <AuthField
            icon={Calendar}
            label="Start Date"
            value={client.authorizationStartDate ? formatDate(client.authorizationStartDate) : '—'}
          />
          <AuthField
            icon={CalendarX}
            label="Expiration Date"
            value={client.authorizationExpiry ? formatDate(client.authorizationExpiry) : '—'}
            valueClass={expired ? 'text-status-expired font-semibold' : status === 'expiring' ? 'text-status-warn font-semibold' : undefined}
          />
        </dl>
      </CardBody>
    </Card>
  )
}

function AuthField({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof ShieldCheck
  label: string
  value: React.ReactNode
  valueClass?: string
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <Icon className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
        {label}
      </dt>
      <dd className={cnEdge('mt-1 text-sm text-text', valueClass)}>{value}</dd>
    </div>
  )
}

function cnEdge(...c: (string | undefined | false)[]) {
  return c.filter(Boolean).join(' ')
}
