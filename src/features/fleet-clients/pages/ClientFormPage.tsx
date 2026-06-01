import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Input,
  Textarea,
  FormField,
  Spinner,
  useToast,
} from '@/components/ui'
import { clientSchema, type ClientValues } from '../schema'
import { clientsApi } from '../hooks'

const EMPTY_ADDRESS = { id: '', label: '', line1: '', city: '', postcode: '', lat: null, lng: null }

export function ClientFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = clientsApi.useGet(id)
  const create = clientsApi.useCreate()
  const update = clientsApi.useUpdate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    values: existing
      ? {
          uci: existing.uci,
          name: existing.name,
          contactName: existing.contactName,
          contactPhone: existing.contactPhone,
          addresses: existing.addresses,
          emergencyContact: existing.emergencyContact,
          notes: existing.notes,
        }
      : { uci: '', name: '', contactName: '', contactPhone: '', addresses: [EMPTY_ADDRESS], emergencyContact: '', notes: '' },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'addresses' })

  async function onSubmit(values: ClientValues) {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: values })
      toast.success('Client updated')
    } else {
      await create.mutateAsync(values)
      toast.success('Client added')
    }
    navigate('/clients')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit client' : 'Add client'}
        breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client details</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="UCI" required error={errors.uci?.message} hint="Unique client identifier">
              {(f) => <Input {...f} {...register('uci')} />}
            </FormField>
            <FormField label="Name" required error={errors.name?.message}>
              {(f) => <Input {...f} {...register('name')} />}
            </FormField>
            <FormField label="Contact name" required error={errors.contactName?.message}>
              {(f) => <Input {...f} {...register('contactName')} />}
            </FormField>
            <FormField label="Contact phone" required error={errors.contactPhone?.message}>
              {(f) => <Input {...f} {...register('contactPhone')} />}
            </FormField>
            <FormField label="Emergency contact" required error={errors.emergencyContact?.message} className="sm:col-span-2">
              {(f) => <Input {...f} {...register('emergencyContact')} />}
            </FormField>
            <FormField label="Notes" error={errors.notes?.message} className="sm:col-span-2">
              {(f) => <Textarea {...f} {...register('notes')} />}
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Addresses</CardTitle>
            <Button type="button" size="sm" variant="secondary" onClick={() => append(EMPTY_ADDRESS)}>
              <Plus className="h-4 w-4" />
              Add address
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            {errors.addresses?.root && (
              <p className="text-sm text-status-expired">{errors.addresses.root.message}</p>
            )}
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-md border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Address {i + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove address ${i + 1}`}
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-4 w-4 text-status-expired" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Label" required error={errors.addresses?.[i]?.label?.message}>
                    {(f) => <Input {...f} {...register(`addresses.${i}.label`)} />}
                  </FormField>
                  <FormField label="Address line" required error={errors.addresses?.[i]?.line1?.message}>
                    {(f) => <Input {...f} {...register(`addresses.${i}.line1`)} />}
                  </FormField>
                  <FormField label="City" required error={errors.addresses?.[i]?.city?.message}>
                    {(f) => <Input {...f} {...register(`addresses.${i}.city`)} />}
                  </FormField>
                  <FormField label="Postcode" required error={errors.addresses?.[i]?.postcode?.message}>
                    {(f) => <Input {...f} {...register(`addresses.${i}.postcode`)} />}
                  </FormField>
                </div>
              </div>
            ))}
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add client'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
