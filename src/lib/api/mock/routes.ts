import type { RoutePlan, RouteSession, ListParams } from '@/lib/api/types'
import { ApiError } from '@/lib/api/errors'
import { Collection } from './store'
import { ROUTES } from './seed-routes'
import { delay, deepClone } from './latency'

const routes = new Collection<RoutePlan>(ROUTES, 'r', [])

/** Shared so monitoring reflects live route state (created/published/cancelled). */
export const routesCollection = routes

export interface OverlapResult {
  driverConflict: RoutePlan | null
  vehicleConflict: RoutePlan | null
}

export const mockRoutes = {
  list: (tenantId: string, params?: ListParams) => routes.list(tenantId, params),
  get: (tenantId: string, id: string) => routes.get(tenantId, id),
  create: (tenantId: string, data: Omit<RoutePlan, 'id' | 'tenantId' | 'createdAt'>) =>
    routes.create(tenantId, data),
  update: (tenantId: string, id: string, data: Partial<RoutePlan>) => routes.update(tenantId, id, data),
  remove: (tenantId: string, id: string) => routes.remove(tenantId, id),

  /** Detect whether the driver or vehicle is already booked for that date+session. */
  async checkOverlap(
    tenantId: string,
    args: { date: string; session: RouteSession; driverId: string; vehicleId: string; excludeRouteId?: string },
  ): Promise<OverlapResult> {
    const sameSlot = routes
      .raw(tenantId)
      .filter(
        (r) =>
          r.date === args.date &&
          r.session === args.session &&
          r.status !== 'cancelled' &&
          r.id !== args.excludeRouteId,
      )
    return delay({
      driverConflict: sameSlot.find((r) => r.driverId === args.driverId) ?? null,
      vehicleConflict: sameSlot.find((r) => r.vehicleId === args.vehicleId) ?? null,
    })
  },

  async publish(tenantId: string, id: string): Promise<RoutePlan> {
    const route = await routes.get(tenantId, id)
    if (route.stops.length === 0) throw new ApiError('validation', 'Add at least one stop before publishing.')
    return routes.update(tenantId, id, { status: 'published' })
  },

  /** Substitute the driver, optionally only from the next pending stop onward. */
  async substituteDriver(
    tenantId: string,
    id: string,
    newDriverId: string,
    _reason: string,
  ): Promise<RoutePlan> {
    void _reason // recorded to audit log in the real backend
    return routes.update(tenantId, id, { driverId: newDriverId })
  },

  async cancelRoute(tenantId: string, id: string, _reason: string): Promise<RoutePlan> {
    void _reason
    return routes.update(tenantId, id, { status: 'cancelled' })
  },

  async cancelStop(tenantId: string, id: string, stopId: string, _reason: string): Promise<RoutePlan> {
    void _reason
    const route = await routes.get(tenantId, id)
    const stops = route.stops.map((s) => (s.id === stopId ? { ...s, status: 'cancelled' as const } : s))
    return routes.update(tenantId, id, { stops })
  },

  /** Duplicate all routes from one date to another, optionally reassigning fleet. */
  async copyDay(
    tenantId: string,
    fromDate: string,
    toDate: string,
    reassign?: { driverId?: string; vehicleId?: string },
  ): Promise<number> {
    const source = routes.raw(tenantId).filter((r) => r.date === fromDate && r.status !== 'cancelled')
    for (const r of source) {
      const clone = deepClone(r)
      await routes.create(tenantId, {
        name: clone.name,
        date: toDate,
        startTime: clone.startTime,
        session: clone.session,
        driverId: reassign?.driverId ?? clone.driverId,
        vehicleId: reassign?.vehicleId ?? clone.vehicleId,
        status: 'draft',
        stops: clone.stops.map((s) => ({ ...s, status: 'pending' as const })),
      })
    }
    return delay(source.length)
  },
}
