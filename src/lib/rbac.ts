/**
 * Role-based access control. Single source of truth for who can do what.
 * Enforced on routes (RequireRole) and surfaced in the UI (Sidebar items, action buttons).
 *
 * Driver is intentionally listed but has ZERO web permissions — drivers use the
 * mobile app only and are blocked from the portal entirely (see RequireAuth).
 */
export type Role = 'super_admin' | 'tenant_admin' | 'dispatcher' | 'driver'

export type Permission =
  | 'tenants.manage' // super-admin only: create/edit tenant companies
  | 'users.manage' // add/edit/deactivate admins & dispatchers
  | 'settings.manage' // tenant settings: general + branding
  | 'fleet.manage' // drivers + vehicles CRUD
  | 'clients.manage' // clients + checklist builder
  | 'routes.view'
  | 'routes.manage' // plan/publish/cancel/substitute
  | 'monitoring.view'
  | 'reports.view'
  | 'documents.manage'
  | 'audit.view'
  | 'account.self' // own profile / notifications

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'tenants.manage',
    'users.manage',
    'settings.manage',
    'fleet.manage',
    'clients.manage',
    'routes.view',
    'routes.manage',
    'monitoring.view',
    'reports.view',
    'documents.manage',
    'audit.view',
    'account.self',
  ],
  tenant_admin: [
    'users.manage',
    'settings.manage',
    'fleet.manage',
    'clients.manage',
    'routes.view',
    'routes.manage',
    'monitoring.view',
    'reports.view',
    'documents.manage',
    'audit.view',
    'account.self',
  ],
  // Operations only — no user management, no settings.
  dispatcher: [
    'fleet.manage',
    'clients.manage',
    'routes.view',
    'routes.manage',
    'monitoring.view',
    'reports.view',
    'documents.manage',
    'account.self',
  ],
  driver: [],
}

/** True if the role holds the given permission. */
export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** True if the role may access the web portal at all (drivers cannot). */
export function canAccessPortal(role: Role | undefined): boolean {
  return !!role && role !== 'driver'
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'Tenant Admin',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
}
