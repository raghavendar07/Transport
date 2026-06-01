/**
 * In-memory seed data for mock mode. Two tenants prove tenant isolation:
 * a session scoped to tenant A must never receive tenant B rows.
 * Feature phases extend this seed with their own entities.
 */
import type { Tenant, User } from '@/lib/api/types'

export const TENANTS: Tenant[] = [
  {
    id: 't1',
    name: 'Northwind Transport Ltd',
    code: 'NWT',
    country: 'GB',
    timezone: 'Europe/London',
    defaultLanguage: 'en',
    status: 'active',
    createdAt: '2025-01-12T09:00:00Z',
  },
  {
    id: 't2',
    name: 'Acme Logistics',
    code: 'ACME',
    country: 'IE',
    timezone: 'Europe/Dublin',
    defaultLanguage: 'en',
    status: 'active',
    createdAt: '2025-03-04T09:00:00Z',
  },
]

/**
 * Mock users. Password for everyone is "password" except `firsttime@nwt.test`
 * which has no password set yet (triggers the first-time-setup flow).
 */
export const USERS: (User & { password: string | null })[] = [
  {
    id: 'u1',
    tenantId: 't1',
    name: 'Alice Admin',
    email: 'admin@nwt.test',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-05-30T07:45:00Z',
    createdAt: '2025-01-12T09:30:00Z',
    password: 'password',
  },
  {
    id: 'u2',
    tenantId: 't1',
    name: 'Dan Dispatcher',
    email: 'dispatch@nwt.test',
    role: 'dispatcher',
    status: 'active',
    lastLoginAt: '2026-05-30T06:20:00Z',
    createdAt: '2025-02-01T10:00:00Z',
    password: 'password',
  },
  {
    id: 'u3',
    tenantId: 't1',
    name: 'Dora Driver',
    email: 'driver@nwt.test',
    role: 'driver',
    status: 'active',
    lastLoginAt: null,
    createdAt: '2025-02-10T10:00:00Z',
    password: 'password',
  },
  {
    id: 'u4',
    tenantId: 't1',
    name: 'Fred Firsttime',
    email: 'firsttime@nwt.test',
    role: 'dispatcher',
    status: 'active',
    lastLoginAt: null,
    createdAt: '2026-05-20T10:00:00Z',
    password: null,
  },
  {
    id: 'u5',
    tenantId: 't2',
    name: 'Bob Admin',
    email: 'admin@acme.test',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-05-28T11:00:00Z',
    createdAt: '2025-03-04T09:30:00Z',
    password: 'password',
  },
]

export const TENANT_NAME_BY_ID: Record<string, string> = {
  t1: 'Northwind Transport Ltd',
  t2: 'Acme Logistics',
}
