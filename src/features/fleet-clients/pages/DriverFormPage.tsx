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
import { driverSchema, type DriverValues } from '../schema'
import { driversApi } from '../hooks'

/** Add/edit driver. Same form for both; edit prefills from the detail query. */
export function DriverFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = driversApi.useGet(id)
  const create = driversApi.useCreate()
  const update = driversApi.useUpdate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DriverValues>({
    resolver: zodResolver(driverSchema),
    values: existing
      ? {
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          licenceNumber: existing.licenceNumber,
          licenceExpiry: existing.licenceExpiry,
          address: existing.address,
          dob: existing.dob,
          photoUrl: existing.photoUrl,
          status: existing.status,
        }
      : undefined,
  })

  async function onSubmit(values: DriverValues) {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: values })
      toast.success('Driver updated')
    } else {
      await create.mutateAsync(values)
      toast.success('Driver added')
    }
    navigate('/drivers')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const status = watch('status')

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit driver' : 'Add driver'}
        breadcrumbs={[{ label: 'Drivers', to: '/drivers' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Full name" required error={errors.name?.message}>
              {(f) => <Input {...f} {...register('name')} />}
            </FormField>
            <FormField label="Email" required error={errors.email?.message}>
              {(f) => <Input type="email" {...f} {...register('email')} />}
            </FormField>
            <FormField label="Phone" required error={errors.phone?.message}>
              {(f) => <Input {...f} {...register('phone')} />}
            </FormField>
            <FormField label="Date of birth" required error={errors.dob?.message}>
              {(f) => <DatePicker {...f} {...register('dob')} />}
            </FormField>
            <FormField label="Licence number" required error={errors.licenceNumber?.message}>
              {(f) => <Input {...f} {...register('licenceNumber')} />}
            </FormField>
            <FormField label="Licence expiry" required error={errors.licenceExpiry?.message}>
              {(f) => <DatePicker {...f} {...register('licenceExpiry')} />}
            </FormField>
            <FormField label="Address" required error={errors.address?.message} className="sm:col-span-2">
              {(f) => <Input {...f} {...register('address')} />}
            </FormField>
            <FormField label="Status" error={errors.status?.message}>
              {(f) => (
                <Select
                  {...f}
                  value={status}
                  onValueChange={(v) => setValue('status', v as DriverValues['status'])}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              )}
            </FormField>
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/drivers')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add driver'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
