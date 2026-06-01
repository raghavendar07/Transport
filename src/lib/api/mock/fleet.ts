import type { Driver, Vehicle, Client, SafetyChecklist, ListParams } from '@/lib/api/types'
import type { Permission } from '@/lib/rbac'
import { Collection } from './store'
import { assertCan } from '@/lib/api/permissions'
import { DRIVERS, VEHICLES, CLIENTS, CHECKLISTS } from './seed-fleet'

const drivers = new Collection<Driver>(DRIVERS, 'd', ['name', 'email', 'licenceNumber', 'phone'])
const vehicles = new Collection<Vehicle>(VEHICLES, 'v', ['registration', 'make', 'model'])
const clients = new Collection<Client>(CLIENTS, 'c', ['uci', 'name', 'contactName'])
const checklists = new Collection<SafetyChecklist>(CHECKLISTS, 'cl', ['name'])

/**
 * Standard CRUD over a Collection. `mutatePermission`, when set, is enforced at
 * the API boundary on create/update/remove — the mock equivalent of a backend
 * guard. Reads are not gated here (route guards + nav already scope visibility).
 */
export function makeCrud<T extends { id: string; tenantId: string }>(
  col: Collection<T>,
  mutatePermission?: Permission,
) {
  const guard = () => {
    if (mutatePermission) assertCan(mutatePermission)
  }
  return {
    list: (tenantId: string, params?: ListParams) => col.list(tenantId, params),
    get: (tenantId: string, id: string) => col.get(tenantId, id),
    create: (tenantId: string, data: Omit<T, 'id' | 'tenantId' | 'createdAt'>) => {
      guard()
      return col.create(tenantId, data)
    },
    update: (tenantId: string, id: string, data: Partial<T>) => {
      guard()
      return col.update(tenantId, id, data)
    },
    remove: (tenantId: string, id: string) => {
      guard()
      return col.remove(tenantId, id)
    },
  }
}

export const mockFleet = {
  drivers: makeCrud(drivers),
  vehicles: makeCrud(vehicles),
  clients: makeCrud(clients),
  // Checklist templates are admin-only setup.
  checklists: makeCrud(checklists, 'checklists.manage'),
}

/** Exposed so route-planning mock can read fleet for dropdowns / overlap checks. */
export const fleetCollections = { drivers, vehicles, clients, checklists }
