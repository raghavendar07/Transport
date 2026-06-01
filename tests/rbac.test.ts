import { describe, it, expect } from 'vitest'
import { can, canAccessPortal } from '@/lib/rbac'

describe('rbac', () => {
  it('dispatcher cannot manage users or settings', () => {
    expect(can('dispatcher', 'users.manage')).toBe(false)
    expect(can('dispatcher', 'settings.manage')).toBe(false)
    expect(can('dispatcher', 'routes.manage')).toBe(true)
  })

  it('only super admin manages tenants', () => {
    expect(can('super_admin', 'tenants.manage')).toBe(true)
    expect(can('tenant_admin', 'tenants.manage')).toBe(false)
  })

  it('drivers are blocked from the portal entirely', () => {
    expect(canAccessPortal('driver')).toBe(false)
    expect(canAccessPortal('tenant_admin')).toBe(true)
  })
})
