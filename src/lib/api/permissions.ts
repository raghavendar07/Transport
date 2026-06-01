/**
 * API-layer permission enforcement for mock mode.
 *
 * The real NestJS backend derives the caller's role from the auth token. In mock
 * mode there is no server, so the AuthProvider publishes the active session here
 * via `setApiSession`, and mutating mock endpoints call `assertCan` to reject
 * forbidden operations — exactly as the backend guard would. This makes hidden
 * navigation insufficient on its own: the API refuses the call regardless of UI.
 */
import type { Role, Permission } from '@/lib/rbac'
import { can } from '@/lib/rbac'
import { ApiError } from '@/lib/api/errors'

interface ApiSession {
  role: Role
  userId: string
  tenantId: string
}

let current: ApiSession | null = null

/** Called by AuthProvider whenever the session changes (login/logout/restore). */
export function setApiSession(session: ApiSession | null): void {
  current = session
}

export function getApiSession(): ApiSession | null {
  return current
}

/**
 * Throw ApiError('forbidden') if the active session lacks `permission`.
 * No session (e.g. during boot) is treated as forbidden for mutations.
 */
export function assertCan(permission: Permission): void {
  if (!current || !can(current.role, permission)) {
    throw new ApiError('forbidden', 'You do not have permission to perform this action.')
  }
}
