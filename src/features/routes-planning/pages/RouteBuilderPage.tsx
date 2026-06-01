import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Plus, Send, UserCog, Ban, Save } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormField,
  Select,
  Input,
  Spinner,
  EmptyState,
  ConfirmDialog,
  useToast,
} from '@/components/ui'
import { RouteStatusBadge } from '@/components/domain/StatusBadge'
import type { RoutePlan, RouteSession, RouteStop } from '@/lib/api/types'
import { useRoute, useRouteMutations, useCheckOverlap } from '../hooks'
import { useFleetOptions } from '../useFleetOptions'
import { SortableStops } from '../components/SortableStops'
import { AddStopPanel } from '../components/AddStopPanel'
import { SubstituteDriverModal } from '../components/SubstituteDriverModal'
import { CancelReasonDialog } from '../components/CancelReasonDialog'

let tmpStop = 0
const stopId = () => `news-${tmpStop++}`

export function RouteBuilderPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const { driverOptions, vehicleOptions, clients, isLoading: fleetLoading } = useFleetOptions()

  const existing = useRoute(id)
  const { create, update, publish, cancelRoute } = useRouteMutations()
  const overlap = useCheckOverlap()

  const [date, setDate] = useState(params.get('date') ?? '2026-06-01')
  const [session, setSession] = useState<RouteSession>((params.get('session') as RouteSession) ?? 'AM')
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [stops, setStops] = useState<RouteStop[]>([])
  const [status, setStatus] = useState<RoutePlan['status']>('draft')

  const [addOpen, setAddOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [substituteOpen, setSubstituteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  // Hydrate from existing route.
  useEffect(() => {
    const r = existing.data
    if (r) {
      setDate(r.date)
      setSession(r.session)
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
  function removeStop(sid: string) {
    setStops((prev) => prev.filter((s) => s.id !== sid).map((s, i) => ({ ...s, order: i })))
  }

  function payload(): Omit<RoutePlan, 'id' | 'tenantId' | 'createdAt'> {
    return { date, session, driverId, vehicleId, status, stops }
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

  if ((isEdit && existing.isLoading) || fleetLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const canEditFleet = status === 'draft' || status === 'published'
  const valid = !!driverId && !!vehicleId && stops.length > 0

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={isEdit ? 'Route' : 'Create route'}
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
        <div className="mb-4 flex items-start gap-3 rounded-md border border-status-warn-bg bg-status-warn-bg p-3" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warn" aria-hidden />
          <div className="text-sm text-status-warn">
            <p className="font-semibold">Scheduling conflict</p>
            {overlapResult?.driverConflict && <p>This driver is already booked for {session} on {date}.</p>}
            {overlapResult?.vehicleConflict && <p>This vehicle is already booked for {session} on {date}.</p>}
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Route details</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date" required>
            {(f) => <Input type="date" {...f} value={date} onChange={(e) => setDate(e.target.value)} disabled={!canEditFleet} />}
          </FormField>
          <FormField label="Session" required>
            {(f) => (
              <Select
                {...f}
                value={session}
                onValueChange={(v) => setSession(v as RouteSession)}
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' },
                ]}
              />
            )}
          </FormField>
          <FormField label="Driver" required>
            {(f) => <Select {...f} value={driverId} onValueChange={setDriverId} options={driverOptions} placeholder="Select driver" />}
          </FormField>
          <FormField label="Vehicle" required>
            {(f) => <Select {...f} value={vehicleId} onValueChange={setVehicleId} options={vehicleOptions} placeholder="Select vehicle" />}
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Stops ({stops.length})</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add stop
          </Button>
        </CardHeader>
        <CardBody>
          {stops.length === 0 ? (
            <EmptyState title="No stops yet" description="Add pickups and drops, then drag to reorder." />
          ) : (
            <SortableStops stops={stops} onChange={setStops} onRemove={removeStop} />
          )}
        </CardBody>
      </Card>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/routes')}>
          Back
        </Button>
        {status !== 'cancelled' && status !== 'completed' && (
          <>
            <Button variant="secondary" onClick={saveDraft} loading={create.isPending || update.isPending}>
              <Save className="h-4 w-4" />
              Save draft
            </Button>
            {status !== 'published' && status !== 'in_progress' && (
              <Button onClick={() => setPublishOpen(true)} disabled={!valid}>
                <Send className="h-4 w-4" />
                Publish
              </Button>
            )}
          </>
        )}
      </div>

      <AddStopPanel open={addOpen} onOpenChange={setAddOpen} clients={clients} onAdd={addStop} />

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
