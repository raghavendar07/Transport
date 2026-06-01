import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Input,
  FormField,
  Avatar,
  useToast,
} from '@/components/ui'
import { RoleBadge } from '@/components/domain/RoleBadge'
import { useAuth } from '@/lib/auth'
import { changePasswordSchema, type ChangePasswordValues } from '../schema'

export function AccountPage() {
  const { session } = useAuth()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Password changed')
    reset()
  }

  if (!session) return null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile & Password" description="Manage your account." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center gap-4">
          <Avatar name={session.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-text">{session.name}</p>
            <p className="text-sm text-text-muted">{session.email}</p>
            <div className="mt-1.5">
              <RoleBadge role={session.role} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardBody className="space-y-4">
            <FormField label="Current password" required error={errors.current?.message}>
              {(f) => <Input type="password" autoComplete="current-password" {...f} {...register('current')} />}
            </FormField>
            <FormField label="New password" required error={errors.next?.message}>
              {(f) => <Input type="password" autoComplete="new-password" {...f} {...register('next')} />}
            </FormField>
            <FormField label="Confirm new password" required error={errors.confirm?.message}>
              {(f) => <Input type="password" autoComplete="new-password" {...f} {...register('confirm')} />}
            </FormField>
          </CardBody>
          <CardFooter>
            <Button type="submit" loading={isSubmitting}>
              Update password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
