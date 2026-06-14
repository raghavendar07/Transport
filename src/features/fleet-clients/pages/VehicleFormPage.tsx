import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Accessibility, Minus, Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  FormField,
  Combobox,
  DatePicker,
  Spinner,
  useToast,
} from '@/components/ui'
import type { RequiredDocument } from '@/lib/api/types'
import { vehicleSchema, type VehicleValues } from '../schema'
import { vehiclesApi } from '../hooks'
import { RequiredDocumentsSection } from '../components/RequiredDocumentsSection'
import { VEHICLE_DOCUMENT_TYPES, mergeDocuments } from '../documents'

export function VehicleFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = vehiclesApi.useGet(id)
  const create = vehiclesApi.useCreate()
  const update = vehiclesApi.useUpdate()

  const [documents, setDocuments] = useState<RequiredDocument[]>(
    mergeDocuments(VEHICLE_DOCUMENT_TYPES),
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    values: existing
      ? {
          registration: existing.registration,
          make: existing.make,
          model: existing.model,
          year: existing.year,
          capacity: existing.capacity,
          wheelchairSpaces: existing.wheelchairSpaces ?? 0,
          size: existing.size ?? 'medium',
          fuelType: existing.fuelType,
          insuranceExpiry: existing.insuranceExpiry,
          registrationExpiry: existing.registrationExpiry,
          odometer: existing.odometer,
          status: existing.status,
          documents: existing.documents,
        }
      : undefined,
  })

  // Prefill the documents section once the existing vehicle loads.
  useEffect(() => {
    if (existing) setDocuments(mergeDocuments(VEHICLE_DOCUMENT_TYPES, existing.documents))
  }, [existing])

  async function onSubmit(values: VehicleValues) {
    const data = { ...values, documents }
    if (isEdit) {
      await update.mutateAsync({ id: id!, data })
      toast.success('Vehicle updated')
    } else {
      await create.mutateAsync(data)
      toast.success('Vehicle added')
    }
    navigate('/vehicles')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const fuelType = watch('fuelType')
  const status = watch('status')
  const size = watch('size')
  const capacity = Number(watch('capacity') ?? 0)
  const wheelchairSpaces = Number(watch('wheelchairSpaces') ?? 0)
  const SEATS_PER_WHEELCHAIR = 4
  const effectiveSeats = Math.max(0, capacity - wheelchairSpaces * SEATS_PER_WHEELCHAIR)
  const accessible = wheelchairSpaces > 0

  function toggleAccessible(next: boolean) {
    setValue('wheelchairSpaces', next ? 1 : 0, { shouldValidate: true })
  }
  function changeSpaces(delta: number) {
    const max = Math.floor(capacity / SEATS_PER_WHEELCHAIR)
    const v = Math.max(0, Math.min(max, wheelchairSpaces + delta))
    setValue('wheelchairSpaces', v, { shouldValidate: true })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit vehicle' : 'Add vehicle'}
        breadcrumbs={[{ label: 'Vehicles', to: '/vehicles' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Registration" required error={errors.registration?.message}>
              {(f) => <Input {...f} {...register('registration')} />}
            </FormField>
            <FormField label="Fuel type" required error={errors.fuelType?.message}>
              {(f) => (
                <Combobox
                  {...f}
                  value={fuelType}
                  onValueChange={(v) => setValue('fuelType', (v || 'diesel') as VehicleValues['fuelType'])}
                  clearable={false}
                  options={[
                    { value: 'diesel', label: 'Diesel' },
                    { value: 'petrol', label: 'Petrol' },
                    { value: 'electric', label: 'Electric' },
                    { value: 'hybrid', label: 'Hybrid' },
                  ]}
                />
              )}
            </FormField>
            <FormField label="Make" required error={errors.make?.message}>
              {(f) => <Input {...f} {...register('make')} />}
            </FormField>
            <FormField label="Model" required error={errors.model?.message}>
              {(f) => <Input {...f} {...register('model')} />}
            </FormField>
            <FormField label="Year" required error={errors.year?.message}>
              {(f) => <Input type="number" {...f} {...register('year')} />}
            </FormField>
            <FormField label="Vehicle size" required error={errors.size?.message}>
              {(f) => (
                <Combobox
                  {...f}
                  value={size}
                  onValueChange={(v) => setValue('size', (v || 'medium') as VehicleValues['size'])}
                  clearable={false}
                  options={[
                    { value: 'small', label: 'Small (up to 8 seats)' },
                    { value: 'medium', label: 'Medium (9 – 16 seats)' },
                    { value: 'large', label: 'Large (17+ seats)' },
                  ]}
                />
              )}
            </FormField>
            <FormField
              label="Capacity (seats)"
              required
              error={errors.capacity?.message}
              hint={accessible ? `Effective seats: ${effectiveSeats}` : undefined}
            >
              {(f) => <Input type="number" {...f} {...register('capacity')} />}
            </FormField>
            <FormField label="Insurance expiry" required error={errors.insuranceExpiry?.message}>
              {(f) => <DatePicker {...f} {...register('insuranceExpiry')} />}
            </FormField>
            <FormField label="Registration expiry" required error={errors.registrationExpiry?.message}>
              {(f) => <DatePicker {...f} {...register('registrationExpiry')} />}
            </FormField>
            <FormField label="Current odometer (mi)" required error={errors.odometer?.message}>
              {(f) => <Input type="number" {...f} {...register('odometer')} />}
            </FormField>
            <FormField label="Status" error={errors.status?.message}>
              {(f) => (
                <Combobox
                  {...f}
                  value={status}
                  onValueChange={(v) => setValue('status', (v || 'active') as VehicleValues['status'])}
                  clearable={false}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              )}
            </FormField>
          </CardBody>
        </Card>

        {/* Accessibility — wheelchair spaces */}
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="vehicle-accessible"
                checked={accessible}
                onCheckedChange={toggleAccessible}
                aria-label="Wheelchair accessible"
              />
              <label htmlFor="vehicle-accessible" className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-medium text-text">
                  <Accessibility className="h-4 w-4 text-brand" aria-hidden />
                  Wheelchair accessible
                </span>
                <span className="text-xs text-text-muted">
                  Each wheelchair space replaces {SEATS_PER_WHEELCHAIR} standard seats.
                </span>
              </label>
            </div>

            {accessible && (
              <div className="rounded-md border border-border bg-surface-hover/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-text">Wheelchair spaces</p>
                    <p className="text-xs text-text-muted">
                      {wheelchairSpaces} × {SEATS_PER_WHEELCHAIR} = {wheelchairSpaces * SEATS_PER_WHEELCHAIR} seats removed
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card">
                    <button
                      type="button"
                      aria-label="Decrease wheelchair spaces"
                      onClick={() => changeSpaces(-1)}
                      disabled={wheelchairSpaces <= 0}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-l-[8px] text-text-muted hover:bg-surface-hover hover:text-text disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-text">
                      {wheelchairSpaces}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase wheelchair spaces"
                      onClick={() => changeSpaces(1)}
                      disabled={wheelchairSpaces * SEATS_PER_WHEELCHAIR + SEATS_PER_WHEELCHAIR > capacity}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-r-[8px] text-text-muted hover:bg-surface-hover hover:text-text disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-md bg-card p-3">
                    <div className="text-text-muted">Total capacity</div>
                    <div className="mt-1 text-2xl font-bold text-text">{capacity}</div>
                  </div>
                  <div className="rounded-md bg-card p-3">
                    <div className="text-text-muted">Wheelchair spaces</div>
                    <div className="mt-1 text-2xl font-bold text-brand">{wheelchairSpaces}</div>
                  </div>
                  <div className="rounded-md bg-card p-3">
                    <div className="text-text-muted">Available seats</div>
                    <div className="mt-1 text-2xl font-bold text-status-active">{effectiveSeats}</div>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <RequiredDocumentsSection documents={documents} onChange={setDocuments} />

        <Card className="flex items-center justify-end gap-2 px-5 py-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/vehicles')}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add vehicle'}
          </Button>
        </Card>
      </form>
    </div>
  )
}
