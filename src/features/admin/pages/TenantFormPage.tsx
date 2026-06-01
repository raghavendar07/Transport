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
  Spinner,
  useToast,
} from '@/components/ui'
import { tenantSchema, type TenantValues } from '../schema'
import { tenantsApi } from '../hooks'

const TIMEZONES = ['Europe/London', 'Europe/Dublin', 'Europe/Paris', 'UTC'].map((t) => ({ value: t, label: t }))
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'ga', label: 'Irish' },
]
const COUNTRIES = [
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IE', label: 'Ireland' },
  { value: 'FR', label: 'France' },
]

export function TenantFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = tenantsApi.useGet(id)
  const create = tenantsApi.useCreate()
  const update = tenantsApi.useUpdate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TenantValues>({
    resolver: zodResolver(tenantSchema),
    values: existing
      ? {
          name: existing.name,
          code: existing.code,
          country: existing.country,
          timezone: existing.timezone,
          defaultLanguage: existing.defaultLanguage,
          status: existing.status,
        }
      : { name: '', code: '', country: 'GB', timezone: 'Europe/London', defaultLanguage: 'en', status: 'active' },
  })

  async function onSubmit(values: TenantValues) {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: values })
      toast.success('Tenant updated')
    } else {
      await create.mutateAsync(values)
      toast.success('Tenant created')
    }
    navigate('/tenants')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const country = watch('country')
  const timezone = watch('timezone')
  const language = watch('defaultLanguage')

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={isEdit ? 'Edit tenant' : 'Create tenant'}
        breadcrumbs={[{ label: 'Tenants', to: '/tenants' }, { label: isEdit ? 'Edit' : 'Create' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Company name" required error={errors.name?.message} className="sm:col-span-2">
              {(f) => <Input {...f} {...register('name')} />}
            </FormField>
            <FormField label="Code" required error={errors.code?.message} hint="Short unique identifier">
              {(f) => <Input {...f} {...register('code')} />}
            </FormField>
            <FormField label="Country" required error={errors.country?.message}>
              {(f) => <Select {...f} value={country} onValueChange={(v) => setValue('country', v)} options={COUNTRIES} />}
            </FormField>
            <FormField label="Timezone" required error={errors.timezone?.message}>
              {(f) => <Select {...f} value={timezone} onValueChange={(v) => setValue('timezone', v)} options={TIMEZONES} />}
            </FormField>
            <FormField label="Default language" required error={errors.defaultLanguage?.message}>
              {(f) => <Select {...f} value={language} onValueChange={(v) => setValue('defaultLanguage', v)} options={LANGUAGES} />}
            </FormField>
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/tenants')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create tenant'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
