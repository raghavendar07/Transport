import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { canAccessPortal } from '@/lib/rbac'

/**
 * Gates the authenticated app. Redirects unauthenticated users to /login,
 * and blocks drivers from the web portal entirely (mobile-only role).
 */
export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!canAccessPortal(session.role)) {
    return <Navigate to="/no-access" replace />
  }
  if (session.mustSetPassword) {
    return <Navigate to="/first-time-setup" replace />
  }
  return <Outlet />
}
