import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { can, type Permission } from '@/lib/rbac'

/**
 * Route-level permission gate. Wrap routes that need a specific permission;
 * users lacking it are bounced to the dashboard (not shown a dead link).
 */
export function RequireRole({ permission }: { permission: Permission }) {
  const { session } = useAuth()
  if (!can(session?.role, permission)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
