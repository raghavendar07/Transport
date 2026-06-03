import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  FormField,
  Combobox,
  Spinner,
  useToast,
} from '@/components/ui'
import type { AddressRole } from '@/lib/api/types'
import { clientSchema, type ClientValues } from '../schema'
import { clientsApi } from '../hooks'

const EMPTY: ClientValues = {
  name: '',
  contactName: '',
  contactPhone: '',
  emergencyContact: '',
  notes: '',
  status: 'active',
  addresses: [
    { id: '', label: 'Pickup', role: 'pickup', line1: '', city: '', state: '', postcode: '', lat: null, lng: null },
    { id: '', label: 'Drop-off', role: 'dropoff', line1: '', city: '', state: '', postcode: '', lat: null, lng: null },
  ],
}

const ADDRESS_BLOCKS: { role: AddressRole; title: string }[] = [
  { role: 'pickup', title: 'Pickup Address' },
  { role: 'dropoff', title: 'Drop-off Address' },
]

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    values: existing
      ? {
          name: existing.name,
          contactName: existing.contactName,
          contactPhone: existing.contactPhone,
          emergencyContact: existing.emergencyContact,
          notes: existing.notes,
          status: existing.status,
          // Normalise to exactly [pickup, dropoff] in that order.
          addresses: ADDRESS_BLOCKS.map(
            (b) =>
              existing.addresses.find((a) => a.role === b.role) ?? {
                id: '',
                label: b.title.replace(' Address', ''),
                role: b.role,
                line1: '',
                city: '',
                state: '',
                postcode: '',
                lat: null,
                lng: null,
              },
          ),
        }
      : EMPTY,
  })

  const status = watch('status')

  async function onSubmit(values: ClientValues) {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: values })
      toast.success('Client updated')
    } else {
      // uci is ignored by the API and assigned server-side; pass a placeholder.
      await create.mutateAsync({ ...values, uci: '' })
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
            <FormField label="UCI" hint="Auto-generated and unique — assigned on save.">
              {(f) => (
                <Input
                  {...f}
                  value={existing?.uci ?? 'Assigned automatically'}
                  readOnly
                  disabled
                  className="font-mono"
                />
              )}
            </FormField>
            <FormField label="Status">
              {(f) => (
                <Combobox
                  {...f}
                  value={status}
                  onValueChange={(v) => setValue('status', (v || 'active') as ClientValues['status'])}
                  clearable={false}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              )}
            </FormField>
            <FormField label="Client name" required error={errors.name?.message}>
              {(f) => <Input {...f} {...register('name')} />}
            </FormField>
            <FormField label="Contact name" required error={errors.contactName?.message}>
              {(f) => <Input {...f} {...register('contactName')} />}
            </FormField>
            <FormField label="Contact phone" required error={errors.contactPhone?.message}>
              {(f) => <Input {...f} {...register('contactPhone')} />}
            </FormField>
            <FormField label="Emergency contact" required error={errors.emergencyContact?.message}>
              {(f) => <Input {...f} {...register('emergencyContact')} />}
            </FormField>
            <FormField label="Notes" error={errors.notes?.message} className="sm:col-span-2">
              {(f) => <Textarea {...f} {...register('notes')} />}
            </FormField>
          </CardBody>
        </Card>

        {ADDRESS_BLOCKS.map((block, i) => (
          <Card key={block.role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-text-subtle" aria-hidden />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input type="hidden" {...register(`addresses.${i}.role`)} />
              <input type="hidden" {...register(`addresses.${i}.label`)} />
              <FormField label="Address line" required error={errors.addresses?.[i]?.line1?.message} className="sm:col-span-2">
                {(f) => <Input {...f} {...register(`addresses.${i}.line1`)} />}
              </FormField>
              <FormField label="City" required error={errors.addresses?.[i]?.city?.message}>
                {(f) => <Input {...f} {...register(`addresses.${i}.city`)} />}
              </FormField>
              <FormField label="State" required error={errors.addresses?.[i]?.state?.message}>
                {(f) => <Input {...f} {...register(`addresses.${i}.state`)} />}
              </FormField>
              <FormField label="Postal code" required error={errors.addresses?.[i]?.postcode?.message}>
                {(f) => <Input {...f} {...register(`addresses.${i}.postcode`)} />}
              </FormField>
              <FormField label="Map location (lat, lng)" hint="Optional — leave blank to geocode from address">
                {(f) => (
                  <div className="flex gap-2">
                    <Input
                      {...f}
                      type="number"
                      step="any"
                      placeholder="Lat"
                      {...register(`addresses.${i}.lat`, { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Lng"
                      {...register(`addresses.${i}.lng`, { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                    />
                  </div>
                )}
              </FormField>
            </CardBody>
          </Card>
        ))}

        <Card className="flex items-center justify-end gap-2 px-5 py-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add client'}
          </Button>
        </Card>
      </form>
    </div>
  )
}
