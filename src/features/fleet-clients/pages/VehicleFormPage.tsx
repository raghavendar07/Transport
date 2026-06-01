import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Input,
  FormField,
  Select,
  DatePicker,
  Spinner,
  useToast,
} from '@/components/ui'
import { vehicleSchema, type VehicleValues } from '../schema'
import { vehiclesApi } from '../hooks'

export function VehicleFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = vehiclesApi.useGet(id)
  const create = vehiclesApi.useCreate()
  const update = vehiclesApi.useUpdate()

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
          fuelType: existing.fuelType,
          insuranceExpiry: existing.insuranceExpiry,
          registrationExpiry: existing.registrationExpiry,
          odometer: existing.odometer,
          status: existing.status,
        }
      : undefined,
  })

  async function onSubmit(values: VehicleValues) {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: values })
      toast.success('Vehicle updated')
    } else {
      await create.mutateAsync(values)
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit vehicle' : 'Add vehicle'}
        breadcrumbs={[{ label: 'Vehicles', to: '/vehicles' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Registration" required error={errors.registration?.message}>
              {(f) => <Input {...f} {...register('registration')} />}
            </FormField>
            <FormField label="Fuel type" required error={errors.fuelType?.message}>
              {(f) => (
                <Select
                  {...f}
                  value={fuelType}
                  onValueChange={(v) => setValue('fuelType', v as VehicleValues['fuelType'])}
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
            <FormField label="Capacity (seats)" required error={errors.capacity?.message}>
              {(f) => <Input type="number" {...f} {...register('capacity')} />}
            </FormField>
            <FormField label="Insurance expiry" required error={errors.insuranceExpiry?.message}>
              {(f) => <DatePicker {...f} {...register('insuranceExpiry')} />}
            </FormField>
            <FormField label="Registration expiry" required error={errors.registrationExpiry?.message}>
              {(f) => <DatePicker {...f} {...register('registrationExpiry')} />}
            </FormField>
            <FormField label="Current odometer (km)" required error={errors.odometer?.message}>
              {(f) => <Input type="number" {...f} {...register('odometer')} />}
            </FormField>
            <FormField label="Status" error={errors.status?.message}>
              {(f) => (
                <Select
                  {...f}
                  value={status}
                  onValueChange={(v) => setValue('status', v as VehicleValues['status'])}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              )}
            </FormField>
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/vehicles')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add vehicle'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
