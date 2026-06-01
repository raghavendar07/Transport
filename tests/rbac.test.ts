import { describe, it, expect } from 'vitest'
import { can, canAccessPortal } from '@/lib/rbac'

describe('rbac', () => {
  it('dispatcher is operations-only — no users/settings/documents/checklists/compliance/audit', () => {
    expect(can('dispatcher', 'users.manage')).toBe(false)
    expect(can('dispatcher', 'settings.manage')).toBe(false)
    expect(can('dispatcher', 'documents.manage')).toBe(false)
    expect(can('dispatcher', 'checklists.manage')).toBe(false)
    expect(can('dispatcher', 'compliance.view')).toBe(false)
    expect(can('dispatcher', 'audit.view')).toBe(false)
  })

  it('dispatcher can run operations and view alerts/reports', () => {
    expect(can('dispatcher', 'routes.manage')).toBe(true)
    expect(can('dispatcher', 'fleet.manage')).toBe(true)
    expect(can('dispatcher', 'clients.manage')).toBe(true)
    expect(can('dispatcher', 'alerts.view')).toBe(true)
    expect(can('dispatcher', 'reports.view')).toBe(true)
  })

  it('admin holds full governance + compliance permissions', () => {
    for (const p of [
      'users.manage',
      'settings.manage',
      'documents.manage',
      'checklists.manage',
      'compliance.view',
      'audit.view',
    ] as const) {
      expect(can('admin', p)).toBe(true)
    }
  })

  it('drivers are blocked from the portal entirely', () => {
    expect(canAccessPortal('driver')).toBe(false)
    expect(canAccessPortal('admin')).toBe(true)
    expect(canAccessPortal('dispatcher')).toBe(true)
  })
})
