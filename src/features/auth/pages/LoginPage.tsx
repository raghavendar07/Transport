import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AuthLayout } from '@/components/layout'
import { Button, Input, FormField } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api/errors'
import { loginSchema, type LoginValues } from '../schema'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    try {
      await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'account_locked') return navigate('/account-locked')
        if (err.code === 'must_set_password') return navigate('/first-time-setup')
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access your transport compliance portal">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <div
            className="rounded-md border border-status-expired-bg bg-status-expired-bg px-3 py-2 text-sm text-status-expired"
            role="alert"
          >
            {formError}
          </div>
        )}
        <FormField label="Email" required error={errors.email?.message}>
          {(f) => <Input type="email" autoComplete="email" placeholder="you@company.com" {...f} {...register('email')} />}
        </FormField>
        <FormField label="Password" required error={errors.password?.message}>
          {(f) => <Input type="password" autoComplete="current-password" {...f} {...register('password')} />}
        </FormField>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-text-subtle">
        Demo: admin@nwt.test (Admin) / dispatch@nwt.test (Dispatcher) · password
      </p>
    </AuthLayout>
  )
}
