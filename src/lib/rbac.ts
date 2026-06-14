/**
 * Role-based access control. Single source of truth for who can do what.
 * Enforced at every layer: UI (nav + action buttons), route guards (RequireRole),
 * and the API boundary (lib/api/permissions assertCan).
 *
 * SVS Transport Compliance Platform — EXACTLY three business roles:
 *  - admin      (Admin / Owner)      full business + compliance oversight
 *  - dispatcher (Office / Dispatcher) daily operations only
 *  - driver     mobile app only — ZERO web permissions, blocked from the portal
 */
export type Role = 'admin' | 'dispatcher' | 'driver'

export type Permission =
  | 'users.manage' // add/edit/deactivate admins & dispatchers
  | 'settings.manage' // company settings: general + branding
  | 'fleet.manage' // drivers + vehicles CRUD
  | 'clients.manage' // clients/passengers CRUD
  | 'checklists.manage' // safety checklist templates (admin only)
  | 'routes.view'
  | 'routes.manage' // plan/publish/duplicate/cancel/substitute
  | 'monitoring.view' // dashboard + live tracking
  | 'alerts.view' // expiry/compliance alerts (dispatcher view-only surface)
  | 'reports.view'
  | 'documents.manage' // compliance document repository (admin only)
  | 'compliance.view' // compliance dashboard (admin only)
  | 'audit.view' // audit logs (admin only)
  | 'account.self' // own profile / notifications

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin / Owner — everything a dispatcher can do, plus governance & compliance.
  admin: [
    'users.manage',
    'settings.manage',
    'fleet.manage',
    'clients.manage',
    'checklists.manage',
    'routes.view',
    'routes.manage',
    'monitoring.view',
    'alerts.view',
    'reports.view',
    'documents.manage',
    'compliance.view',
    'audit.view',
    'account.self',
  ],
  // Office / Dispatcher — daily operations only. No users/settings/documents/
  // checklist-setup/audit. Alerts are view-only.
  dispatcher: [
    'fleet.manage',
    'clients.manage',
    'routes.view',
    'routes.manage',
    'monitoring.view',
    'alerts.view',
    'reports.view',
    'compliance.view',
    'account.self',
  ],
  // Driver — mobile app only.
  driver: [],
}

/** True if the role holds the given permission. Accepts a single role or an array (union). */
export function can(role: Role | Role[] | undefined, permission: Permission): boolean {
  if (!role) return false
  const list = Array.isArray(role) ? role : [role]
  return list.some((r) => ROLE_PERMISSIONS[r].includes(permission))
}

/** Union of permissions across all assigned roles. */
export function permissionsFor(roles: Role[]): Permission[] {
  const set = new Set<Permission>()
  for (const r of roles) ROLE_PERMISSIONS[r].forEach((p) => set.add(p))
  return [...set]
}

/**
 * Resolve the effective permission set for a user.
 * Either role's permissions can be customized per-user via overrides.
 */
export function permissionsForUser(
  roles: Role[],
  adminOverride?: Permission[] | string[],
  dispatcherOverride?: Permission[] | string[],
): Permission[] {
  const set = new Set<Permission>()
  for (const r of roles) {
    if (r === 'admin' && adminOverride) {
      for (const p of adminOverride as Permission[]) set.add(p)
    } else if (r === 'dispatcher' && dispatcherOverride) {
      for (const p of dispatcherOverride as Permission[]) set.add(p)
    } else {
      ROLE_PERMISSIONS[r].forEach((p) => set.add(p))
    }
  }
  return [...set]
}

/** Permissions an owner can grant to either role. Same surface for both. */
const ALL_GRANTABLE: Permission[] = [
  'users.manage',
  'settings.manage',
  'fleet.manage',
  'clients.manage',
  'checklists.manage',
  'routes.view',
  'routes.manage',
  'monitoring.view',
  'alerts.view',
  'reports.view',
  'documents.manage',
  'compliance.view',
  'audit.view',
  'account.self',
]

export const ADMIN_GRANTABLE: Permission[] = ALL_GRANTABLE

export const DISPATCHER_GRANTABLE: Permission[] = [
  'fleet.manage',
  'clients.manage',
  'routes.view',
  'routes.manage',
  'monitoring.view',
  'alerts.view',
  'reports.view',
  'compliance.view',
  'documents.manage',
  'checklists.manage',
  'account.self',
]

export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = ROLE_PERMISSIONS.admin
export const DEFAULT_DISPATCHER_PERMISSIONS: Permission[] = ROLE_PERMISSIONS.dispatcher

/** True if any assigned role may access the web portal at all (drivers cannot). */
export function canAccessPortal(role: Role | Role[] | undefined): boolean {
  if (!role) return false
  const list = Array.isArray(role) ? role : [role]
  return list.some((r) => r !== 'driver')
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
}
