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
  RadioGroup,
  Spinner,
  useToast,
} from '@/components/ui'
import { userSchema, type UserValues } from '../schema'
import { usersApi } from '../hooks'

export function UserFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = usersApi.useGet(id)
  const create = usersApi.useCreate()
  const update = usersApi.useUpdate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    values: existing
      ? {
          name: existing.name,
          email: existing.email,
          role: existing.role as UserValues['role'],
          status: existing.status,
        }
      : { name: '', email: '', role: 'dispatcher', status: 'active' },
  })

  async function onSubmit(values: UserValues) {
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: values })
      toast.success('User updated')
    } else {
      // New users receive an email to set their password (mock).
      await create.mutateAsync({ ...values, lastLoginAt: null })
      toast.success('User invited', 'They will receive an email to set their password.')
    }
    navigate('/users')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const role = watch('role')

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={isEdit ? 'Edit user' : 'Add user'}
        breadcrumbs={[{ label: 'Users', to: '/users' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardBody className="space-y-4">
            <FormField label="Full name" required error={errors.name?.message}>
              {(f) => <Input {...f} {...register('name')} />}
            </FormField>
            <FormField label="Email" required error={errors.email?.message} hint="They sign in with this email">
              {(f) => <Input type="email" {...f} {...register('email')} />}
            </FormField>
            <FormField label="Role" required error={errors.role?.message}>
              {() => (
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setValue('role', v as UserValues['role'])}
                  options={[
                    { value: 'tenant_admin', label: 'Tenant Admin', description: 'Full access within the company' },
                    { value: 'dispatcher', label: 'Dispatcher', description: 'Operations only — no user or settings management' },
                  ]}
                />
              )}
            </FormField>
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Send invite'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
