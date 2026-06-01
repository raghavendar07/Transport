import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from '@/components/layout'
import { Button, Input, FormField } from '@/components/ui'
import { api } from '@/lib/api/client'
import { forgotSchema, type ForgotValues } from '../schema'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })

  async function onSubmit(values: ForgotValues) {
    await api.auth.requestPasswordReset(values.email)
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-status-active-bg">
            <MailCheck className="h-6 w-6 text-status-active" aria-hidden />
          </div>
          <p className="text-sm text-text-muted">
            If an account exists for that email, we’ve sent a link to reset your password. The link
            expires in 60 minutes.
          </p>
          <Link to="/login" className="mt-5 text-sm text-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We’ll email you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email" required error={errors.email?.message}>
          {(f) => <Input type="email" autoComplete="email" placeholder="you@company.com" {...f} {...register('email')} />}
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
        <div className="text-center">
          <Link to="/login" className="text-sm text-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
