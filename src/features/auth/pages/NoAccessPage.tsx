import { ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'

/** Shown when a driver (mobile-only role) reaches the web portal. */
export function NoAccessPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <AuthLayout title="Web access not available">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-status-expired-bg">
          <ShieldX className="h-6 w-6 text-status-expired" aria-hidden />
        </div>
        <p className="text-sm text-text-muted">
          Driver accounts use the mobile app. The web portal is for administrators and dispatchers only.
        </p>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          Back to sign in
        </Button>
      </div>
    </AuthLayout>
  )
}
