import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { AuthLayout } from '@/components/layout'
import { Button, Input, FormField, useToast } from '@/components/ui'
import { api } from '@/lib/api/client'
import { resetSchema, type ResetValues } from '../schema'
import { PasswordRequirements } from '../components/PasswordRequirements'

/** Reset password via emailed token. Reused for "set new password" flows. */
export function ResetPasswordPage({
  mode = 'reset',
}: {
  mode?: 'reset' | 'first-time'
}) {
  const [params] = useSearchParams()
  const token = params.get('token') ?? 'mock-token'
  const navigate = useNavigate()
  const toast = useToast()
  const [pwd, setPwd] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  async function onSubmit(values: ResetValues) {
    await api.auth.resetPassword(token, values.password)
    toast.success(mode === 'first-time' ? 'Password set' : 'Password updated', 'You can now sign in.')
    navigate('/login')
  }

  const isFirst = mode === 'first-time'
  return (
    <AuthLayout
      title={isFirst ? 'Set your password' : 'Choose a new password'}
      subtitle={isFirst ? 'Welcome — secure your account to continue' : undefined}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="New password" required error={errors.password?.message}>
          {(f) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...f}
              {...register('password', { onChange: (e) => setPwd(e.target.value) })}
            />
          )}
        </FormField>
        <PasswordRequirements value={pwd} />
        <FormField label="Confirm password" required error={errors.confirm?.message}>
          {(f) => <Input type="password" autoComplete="new-password" {...f} {...register('confirm')} />}
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {isFirst ? 'Set password & continue' : 'Update password'}
        </Button>
        {!isFirst && (
          <div className="text-center">
            <Link to="/login" className="text-sm text-brand hover:underline">
              Back to sign in
            </Link>
          </div>
        )}
      </form>
    </AuthLayout>
  )
}
