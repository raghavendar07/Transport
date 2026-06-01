import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button, Input, FormField } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api/errors'
import { useState } from 'react'
import { z } from 'zod'

const schema = z.object({ password: z.string().min(1, 'Password is required') })
type Values = z.infer<typeof schema>

/**
 * Re-authentication modal shown when the session expires mid-session.
 * Keeps the user on their current page; a successful re-login dismisses it.
 */
export function SessionExpiredModal() {
  const { session, expired, login, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  if (!expired || !session) return null

  async function onSubmit(values: Values) {
    setError(null)
    try {
      await login(session!.email, values.password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.')
    }
  }

  return (
    <Modal
      open
      onOpenChange={() => {}}
      title="Session expired"
      description={`Re-enter your password to continue as ${session.email}.`}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
          <Button type="submit" form="reauth-form" loading={isSubmitting}>
            Continue
          </Button>
        </>
      }
    >
      <form id="reauth-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        {error && (
          <p className="rounded-md bg-status-expired-bg px-3 py-2 text-sm text-status-expired" role="alert">
            {error}
          </p>
        )}
        <FormField label="Password" required error={errors.password?.message}>
          {(f) => <Input type="password" autoComplete="current-password" {...f} {...register('password')} />}
        </FormField>
      </form>
    </Modal>
  )
}
