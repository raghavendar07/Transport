import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Plus,
  Send,
  UserCog,
  Ban,
  Save,
  MapPin,
  Route as RouteIcon,
  Users,
  Clock,
  Code2,
  Sparkles,
  Eye,
  CheckCircle2,
  CalendarDays,
  Truck,
  CheckCheck,
  User as UserIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormField,
  Combobox,
  Input,
  Spinner,
  EmptyState,
  ConfirmDialog,
  Modal,
  useToast,
} from '@/components/ui'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import { MapView, type MapMarker } from '@/components/domain'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { RoutePlan, RouteSession, RouteStop } from '@/lib/api/types'
import { useRoute, useRouteMutations, useCheckOverlap } from '../hooks'
import { useFleetOptions } from '../useFleetOptions'
import { PassengerStopTimeline } from '../components/PassengerStopTimeline'
import { AddStopPanel } from '../components/AddStopPanel'
import { SubstituteDriverModal } from '../components/SubstituteDriverModal'
import { CancelReasonDialog } from '../components/CancelReasonDialog'
import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'

let tmpStop = 0
const stopId = () => `news-${tmpStop++}`

/** Derive AM / PM from a HH:mm string. */
function sessionFromTime(t: string): RouteSession {
  const [h] = t.split(':').map(Number)
  return h < 12 ? 'AM' : 'PM'
}

export function RouteBuilderPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const {
    driverOptions,
    vehicleOptions,
    clients,
    driverName,
    vehicleLabel,
    driverAvailability,
    vehicleOnRoute,
    isLoading: fleetLoading,
  } = useFleetOptions()

  const existing = useRoute(id)
  const { create, update, publish, cancelRoute } = useRouteMutations()
  const overlap = useCheckOverlap()

  // Raw entities for capacity + map markers + driver status.
  const driversList = driversApi.useList({ pageSize: 200 })
  const vehiclesList = vehiclesApi.useList({ pageSize: 200 })
  const clientsList = clientsApi.useList({ pageSize: 200 })

  const [name, setName] = useState('')
  const [date, setDate] = useState(params.get('date') ?? '2026-06-01')
  const [startTime, setStartTime] = useState('08:00')
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [stops, setStops] = useState<RouteStop[]>([])
  const [status, setStatus] = useState<RoutePlan['status']>('draft')

  const [addOpen, setAddOpen] = useState(false)
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [substituteOpen, setSubstituteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const session = sessionFromTime(startTime)

  // Hydrate from existing route.
  useEffect(() => {
    const r = existing.data
    if (r) {
      setName(r.name)
      setDate(r.date)
      setStartTime(r.startTime ?? (r.session === 'AM' ? '08:00' : '15:00'))
      setDriverId(r.driverId)
      setVehicleId(r.vehicleId)
      setStops(r.stops)
      setStatus(r.status)
    }
  }, [existing.data])

  // Re-check overlap whenever the slot/fleet changes.
  useEffect(() => {
    if (driverId && vehicleId && date) {
      overlap.mutate({ date, session, driverId, vehicleId, excludeRouteId: id })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, session, driverId, vehicleId, id])

  const overlapResult = overlap.data
  const hasOverlap = !!(overlapResult?.driverConflict || overlapResult?.vehicleConflict)

  function addStop(s: Omit<RouteStop, 'id' | 'order' | 'status'>) {
    setStops((prev) => [...prev, { ...s, id: stopId(), order: prev.length, status: 'pending' }])
  }
  function updateStop(sid: string, patch: Omit<RouteStop, 'id' | 'order' | 'status'>) {
    setStops((prev) => prev.map((s) => (s.id === sid ? { ...s, ...patch } : s)))
    setEditingStop(null)
  }
  function removeStop(sid: string) {
    setStops((prev) => prev.filter((s) => s.id !== sid).map((s, i) => ({ ...s, order: i })))
  }
  function openEdit(stop: RouteStop) {
    setEditingStop(stop)
    setAddOpen(true)
  }

  function payload(): Omit<RoutePlan, 'id' | 'tenantId' | 'createdAt'> {
    return { name, date, startTime, session, driverId, vehicleId, status, stops }
  }

  async function saveDraft() {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: payload() })
      toast.success('Route saved')
    } else {
      const created = await create.mutateAsync({ ...payload(), status: 'draft' })
      toast.success('Draft created')
      navigate(`/routes/${created.id}`, { replace: true })
    }
  }

  async function doPublish() {
    let routeId = id
    if (!isEdit) {
      const created = await create.mutateAsync({ ...payload(), status: 'draft' })
      routeId = created.id
    } else {
      await update.mutateAsync({ id: id!, data: payload() })
    }
    await publish.mutateAsync(routeId!)
    toast.success('Route published')
    setPublishOpen(false)
    navigate('/routes')
  }

  // Derived metrics for the summary panel.
  const selectedVehicle = vehiclesList.data?.items.find((v) => v.id === vehicleId)
  const selectedDriver = driversList.data?.items.find((d) => d.id === driverId)
  const passengers = useMemo(() => new Set(stops.map((s) => s.clientId)).size, [stops])
  const capacity = selectedVehicle?.capacity ?? 0
  const occupancyPct = capacity ? Math.min(100, Math.round((passengers / capacity) * 100)) : 0
  const durationMin = stops.length * 10
  const distanceKm = stops.length * 2

  // Map markers from stop addresses with coordinates.
  const markers: MapMarker[] = useMemo(() => {
    const out: MapMarker[] = []
    for (const s of stops) {
      const c = clientsList.data?.items.find((x) => x.id === s.clientId)
      const a = c?.addresses.find((x) => x.id === s.addressId)
      if (a?.lat != null && a?.lng != null) out.push({ lat: a.lat, lng: a.lng, label: s.clientName })
    }
    return out
  }, [stops, clientsList.data])

  if ((isEdit && existing.isLoading) || fleetLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const valid = !!name && !!date && !!startTime && !!driverId && !!vehicleId && stops.length > 0
  const locked = status === 'cancelled' || status === 'completed'
  const pendingSave = create.isPending || update.isPending
  const overCapacity = capacity > 0 && passengers > capacity

  return (
    <div>
      <PageHeader
        title="Route Planning"
        description="Create and publish passenger transport routes."
        breadcrumbs={[{ label: 'Route Planning', to: '/routes' }, { label: isEdit ? 'Edit' : 'Create' }]}
        actions={
          isEdit ? (
            <div className="flex items-center gap-2">
              <RouteStatusBadge status={status} />
              {(status === 'published' || status === 'in_progress') && (
                <Button variant="secondary" onClick={() => setSubstituteOpen(true)}>
                  <UserCog className="h-4 w-4" />
                  Substitute
                </Button>
              )}
              {status !== 'cancelled' && status !== 'completed' && (
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" />
                  Cancel route
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {hasOverlap && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-status-warn-bg bg-status-warn-bg p-3" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warn" aria-hidden />
          <div className="text-sm text-status-warn">
            <p className="font-semibold">Scheduling conflict</p>
            {overlapResult?.driverConflict && <p>This driver is already booked for {session} on {date}.</p>}
            {overlapResult?.vehicleConflict && <p>This vehicle is already booked for {session} on {date}.</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Route Information + Passenger Stops */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-border">
              <SectionHeader icon={CalendarDays} title="Route Information" subtitle="Schedule, driver & vehicle assignment" />
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Route name" required className="sm:col-span-2">
                {(f) => (
                  <Input {...f} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AM City Centre Loop" disabled={locked} />
                )}
              </FormField>
              <FormField label="Route date" required>
                {(f) => <Input type="date" {...f} value={date} onChange={(e) => setDate(e.target.value)} disabled={locked} />}
              </FormField>
              <FormField label="Route start time" required>
                {(f) => <Input type="time" {...f} value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={locked} />}
              </FormField>
              <div>
                <FormField label="Driver selection" required>
                  {(f) => (
                    <Combobox
                      {...f}
                      value={driverId}
                      onValueChange={setDriverId}
                      options={driverOptions}
                      placeholder="Select driver"
                      disabled={locked}
                    />
                  )}
                </FormField>
                {selectedDriver && hasOverlap && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-status-expired">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    Conflict · already booked
                  </p>
                )}
                {selectedDriver && !hasOverlap && (() => {
                  const avail = driverAvailability(selectedDriver.id)
                  if (avail === 'available')
                    return (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-status-active">
                        <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                        Available · {session} shift
                      </p>
                    )
                  if (avail === 'on_route')
                    return (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-status-warn">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        On route · finishing current trip
                      </p>
                    )
                  return (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-text-subtle">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      Off duty
                    </p>
                  )
                })()}
              </div>
              <div>
                <FormField label="Vehicle selection" required>
                  {(f) => (
                    <Combobox
                      {...f}
                      value={vehicleId}
                      onValueChange={setVehicleId}
                      options={vehicleOptions}
                      placeholder="Select vehicle"
                      disabled={locked}
                    />
                  )}
                </FormField>
                {selectedVehicle && (() => {
                  const inUse = vehicleOnRoute(selectedVehicle.id)
                  if (inUse)
                    return (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-status-warn">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        In use · {selectedVehicle.capacity} seats · {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                    )
                  return (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-status-active">
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                      Available · {selectedVehicle.capacity} seats · {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                  )
                })()}
              </div>
            </CardBody>
          </Card>

          {/* Passenger Stops */}
          <Card>
            <CardHeader className="flex items-center justify-between border-b border-border">
              <SectionHeader
                icon={MapPin}
                title="Passenger Stops"
                count={stops.length}
              />
              <Button
                size="sm"
                onClick={() => {
                  setEditingStop(null)
                  setAddOpen(true)
                }}
                disabled={locked}
              >
                <Plus className="h-4 w-4" />
                Add Passenger
              </Button>
            </CardHeader>
            <CardBody>
              {stops.length === 0 ? (
                <EmptyState
                  icon={RouteIcon}
                  title="No passengers added"
                  description="Add passengers and their pickup or drop-off locations to build your transport route."
                  action={
                    <Button
                      onClick={() => {
                        setEditingStop(null)
                        setAddOpen(true)
                      }}
                      disabled={locked}
                    >
                      <Plus className="h-4 w-4" />
                      Add First Passenger
                    </Button>
                  }
                />
              ) : (
                <PassengerStopTimeline
                  stops={stops}
                  onChange={setStops}
                  onEdit={openEdit}
                  onRemove={removeStop}
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Route Summary panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <SectionHeader icon={RouteIcon} title="Route Summary" />
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Metric icon={Users} label="Passengers" value={String(passengers)} />
                <Metric icon={MapPin} label="Stops" value={String(stops.length)} />
                <Metric icon={Clock} label="Est. Duration" value={String(durationMin)} unit="min" />
                <Metric icon={Code2} label="Distance" value={String(distanceKm)} unit="km" />
              </div>

              <dl className="space-y-3 border-t border-border pt-4 text-sm">
                <SummaryRow
                  label={
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                      Driver
                    </span>
                  }
                  value={
                    selectedDriver ? (
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-xs font-semibold text-white">
                          {selectedDriver.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <span className="font-medium text-text">{selectedDriver.name}</span>
                      </span>
                    ) : (
                      <span className="text-text-subtle">Not selected</span>
                    )
                  }
                />
                <SummaryRow
                  label={
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                      Vehicle
                    </span>
                  }
                  value={
                    selectedVehicle ? (
                      <span className="inline-flex items-center rounded-md bg-surface-hover px-2 py-1 font-mono text-xs font-semibold text-text">
                        {selectedVehicle.registration}
                      </span>
                    ) : (
                      <span className="text-text-subtle">Not selected</span>
                    )
                  }
                />
                <SummaryRow
                  label={
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                      Driver Status
                    </span>
                  }
                  value={(() => {
                    const avail = selectedDriver ? driverAvailability(selectedDriver.id) : 'available'
                    let tone = 'text-status-active'
                    let dot = 'bg-status-active'
                    let label = 'Available'
                    if (hasOverlap) {
                      tone = 'text-status-expired'
                      dot = 'bg-status-expired'
                      label = 'Conflict'
                    } else if (avail === 'on_route') {
                      tone = 'text-status-warn'
                      dot = 'bg-status-warn'
                      label = 'On route'
                    } else if (avail === 'off_duty') {
                      tone = 'text-text-subtle'
                      dot = 'bg-text-subtle'
                      label = 'Off duty'
                    }
                    return (
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone)}>
                        <span className={cn('h-2 w-2 rounded-full', dot)} />
                        {label}
                      </span>
                    )
                  })()}
                />
                <SummaryRow
                  label={
                    <span className="flex items-center gap-1.5">
                      <Save className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                      Status
                    </span>
                  }
                  value={<RouteStatusBadge status={status} />}
                />
                {stops.length >= 3 && (
                  <SummaryRow
                    label={
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                        Route Quality
                      </span>
                    }
                    value={
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Optimised
                      </span>
                    }
                  />
                )}
              </dl>

              {capacity > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                      <Users className="h-4 w-4 text-text-subtle" aria-hidden />
                      Vehicle Occupancy
                    </span>
                    <span className={cn('text-sm font-semibold tabular-nums', overCapacity ? 'text-status-expired' : 'text-text')}>
                      {passengers} / {capacity}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className={cn('h-full transition-all', overCapacity ? 'bg-status-expired' : 'bg-brand')}
                      style={{ width: `${overCapacity ? 100 : occupancyPct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-text-muted">
                    <span>
                      {overCapacity
                        ? `Over by ${passengers - capacity}`
                        : `${capacity - passengers} seats remaining`}
                    </span>
                    <span>{occupancyPct}% full</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Route Preview */}
          <Card>
            <CardHeader className="border-b border-border">
              <SectionHeader icon={MapPin} title="Route Preview" />
            </CardHeader>
            <CardBody className="p-3">
              {markers.length > 0 ? (
                <MapView markers={markers} path={markers} height={220} />
              ) : (
                <div className="flex h-[220px] items-center justify-center rounded-lg bg-surface-hover text-xs text-text-subtle">
                  Add stops with coordinates to preview the route map.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Action bar */}
      <Card className="mt-6 flex flex-wrap items-center justify-end gap-2 px-5 py-4">
        <Button variant="secondary" onClick={() => navigate('/routes')}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={saveDraft} loading={pendingSave} disabled={locked}>
          <Save className="h-4 w-4" />
          Save draft
        </Button>
        <Button variant="secondary" onClick={() => setPreviewOpen(true)} disabled={!valid}>
          <Eye className="h-4 w-4" />
          Preview route
        </Button>
        {status !== 'published' && status !== 'in_progress' && (
          <Button onClick={() => setPublishOpen(true)} disabled={!valid || locked}>
            <Send className="h-4 w-4" />
            Publish route
          </Button>
        )}
      </Card>

      <AddStopPanel
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o)
          if (!o) setEditingStop(null)
        }}
        clients={clients}
        onAdd={addStop}
        editing={editingStop}
        onUpdate={updateStop}
      />

      <Modal open={previewOpen} onOpenChange={setPreviewOpen} title="Preview route" size="lg">
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Review label="Route name" value={name || '—'} />
            <Review label="Date" value={formatDate(date)} />
            <Review label="Start time" value={`${startTime} (${session})`} />
            <Review label="Driver" value={driverName(driverId)} />
            <Review label="Vehicle" value={vehicleLabel(vehicleId)} />
            <Review label="Passengers" value={`${passengers} / ${capacity || '—'}`} />
          </dl>
          <div className="rounded-lg border border-border">
            {stops.length === 0 ? (
              <p className="px-5 py-4 text-sm text-text-subtle">No stops added.</p>
            ) : (
              <ol className="divide-y divide-border">
                {stops.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-hover text-xs font-medium text-text-muted">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium',
                        s.type === 'pickup' ? 'bg-brand-100 text-brand-700' : 'bg-status-active-bg text-status-active',
                      )}
                    >
                      {s.type === 'pickup' ? 'Pickup' : 'Drop-off'}
                    </span>
                    <span className="font-medium text-text">{s.plannedTime}</span>
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <CheckCircle2 className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                      ETA on time
                    </span>
                    <span className="text-text-muted">
                      · {s.clientUci} · {s.clientName}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish route?"
        description={
          hasOverlap
            ? 'There is a scheduling conflict. Publishing anyway may double-book a driver or vehicle.'
            : 'Drivers will see this route on their mobile app. You can still substitute the driver later.'
        }
        confirmLabel="Publish"
        variant={hasOverlap ? 'danger' : 'primary'}
        loading={publish.isPending || create.isPending || update.isPending}
        onConfirm={doPublish}
      />

      {isEdit && (
        <>
          <SubstituteDriverModal
            open={substituteOpen}
            onOpenChange={setSubstituteOpen}
            routeId={id!}
            currentDriverId={driverId}
            inProgress={status === 'in_progress'}
            driverOptions={driverOptions}
          />
          <CancelReasonDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            title="Cancel route?"
            description="The whole route will be cancelled. This cannot be undone."
            loading={cancelRoute.isPending}
            onConfirm={async (reason) => {
              await cancelRoute.mutateAsync({ id: id!, reason })
              toast.success('Route cancelled')
              setCancelOpen(false)
              navigate('/routes')
            }}
          />
        </>
      )}
    </div>
  )
}

function Metric({ icon: Icon, label, value, unit }: { icon: typeof Users; label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
        <Icon className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold leading-none text-text">{value}</span>
        {unit && <span className="text-xs font-medium text-text-subtle">{unit}</span>}
      </div>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: typeof Users
  title: string
  subtitle?: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium tabular-nums text-brand-700">
              {count}
            </span>
          )}
        </h3>
        {subtitle && <p className="text-xs text-text-subtle">{subtitle}</p>}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-text">{value}</dd>
    </div>
  )
}
