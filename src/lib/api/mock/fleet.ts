import type { Driver, Vehicle, Client, SafetyChecklist, ListParams } from '@/lib/api/types'
import { Collection } from './store'
import { DRIVERS, VEHICLES, CLIENTS, CHECKLISTS } from './seed-fleet'

const drivers = new Collection<Driver>(DRIVERS, 'd', ['name', 'email', 'licenceNumber', 'phone'])
const vehicles = new Collection<Vehicle>(VEHICLES, 'v', ['registration', 'make', 'model'])
const clients = new Collection<Client>(CLIENTS, 'c', ['uci', 'name', 'contactName'])
const checklists = new Collection<SafetyChecklist>(CHECKLISTS, 'cl', ['name'])

export function makeCrud<T extends { id: string; tenantId: string }>(col: Collection<T>) {
  return {
    list: (tenantId: string, params?: ListParams) => col.list(tenantId, params),
    get: (tenantId: string, id: string) => col.get(tenantId, id),
    create: (tenantId: string, data: Omit<T, 'id' | 'tenantId' | 'createdAt'>) =>
      col.create(tenantId, data),
    update: (tenantId: string, id: string, data: Partial<T>) => col.update(tenantId, id, data),
    remove: (tenantId: string, id: string) => col.remove(tenantId, id),
  }
}

export const mockFleet = {
  drivers: makeCrud(drivers),
  vehicles: makeCrud(vehicles),
  clients: makeCrud(clients),
  checklists: makeCrud(checklists),
}

/** Exposed so route-planning mock can read fleet for dropdowns / overlap checks. */
export const fleetCollections = { drivers, vehicles, clients, checklists }
