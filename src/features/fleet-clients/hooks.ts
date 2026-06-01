import { api } from '@/lib/api/client'
import { createResourceHooks } from '@/lib/useCrud'

export const driversApi = createResourceHooks('drivers', api.drivers)
export const vehiclesApi = createResourceHooks('vehicles', api.vehicles)
export const clientsApi = createResourceHooks('clients', api.clients)
export const checklistsApi = createResourceHooks('checklists', api.checklists)
