import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { AuthLayout } from '@/components/layout'

/** Shown after 5 failed sign-in attempts → 15-minute lockout, with a live countdown. */
export function AccountLockedPage() {
  const [remaining, setRemaining] = useState(15 * 60)

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const unlocked = remaining === 0

  return (
    <AuthLayout title="Account temporarily locked">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-status-warn-bg">
          <Lock className="h-6 w-6 text-status-warn" aria-hidden />
        </div>
        <p className="text-sm text-text-muted">
          Too many failed sign-in attempts. For your security, this account is locked for 15 minutes.
        </p>
        {!unlocked ? (
          <p className="mt-4 font-mono text-2xl font-bold text-text" aria-live="polite">
            {mm}:{ss}
          </p>
        ) : (
          <p className="mt-4 text-sm font-medium text-status-active">You can try signing in again.</p>
        )}
        <Link to="/login" className="mt-5 text-sm text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
