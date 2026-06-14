import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'
import type { DriverAvailability } from '@/lib/api/types'
import { useRoutesList } from './hooks'

/**
 * Resolved driver availability state. Order of precedence:
 *  1. Driver record's explicit `availability` field (mock dispatch override).
 *  2. Driver currently assigned to an `in_progress` route → `en_route`.
 *  3. Driver assigned to any `published` (future) route → `scheduled`.
 *  4. Else `available` (if EntityStatus is active).
 */
export type ResolvedAvailability = DriverAvailability

export const AVAILABILITY_LABEL: Record<ResolvedAvailability, string> = {
  available: 'Available',
  scheduled: 'Scheduled',
  en_route: 'En-route',
  sick: 'Unavailable (Sick)',
  other: 'Other',
}

/** Load active fleet/clients as Select options for route building, with live availability hints. */
export function useFleetOptions() {
  const drivers = driversApi.useList({ pageSize: 100 })
  const vehicles = vehiclesApi.useList({ pageSize: 100 })
  const clients = clientsApi.useList({ pageSize: 100 })
  const routes = useRoutesList({ pageSize: 200 })

  // Build sets of fleet IDs currently in active routes to derive availability.
  const onRouteDrivers = new Set<string>()
  const onRouteVehicles = new Set<string>()
  const scheduledDrivers = new Set<string>()
  for (const r of routes.data?.items ?? []) {
    if (r.status === 'in_progress') {
      onRouteDrivers.add(r.driverId)
      onRouteVehicles.add(r.vehicleId)
    } else if (r.status === 'published') {
      scheduledDrivers.add(r.driverId)
    }
  }

  function driverAvailability(id: string): ResolvedAvailability {
    const d = drivers.data?.items.find((x) => x.id === id)
    if (!d) return 'available'
    // Explicit override wins (covers sick/other and any pinned status).
    if (d.availability) return d.availability
    if (d.status !== 'active') return 'other'
    if (onRouteDrivers.has(id)) return 'en_route'
    if (scheduledDrivers.has(id)) return 'scheduled'
    return 'available'
  }

  function availabilityNote(id: string): string | undefined {
    return drivers.data?.items.find((x) => x.id === id)?.availabilityNote
  }

  return {
    driverOptions: (drivers.data?.items ?? []).map((d) => ({
      value: d.id,
      label: `${d.name} — ${AVAILABILITY_LABEL[driverAvailability(d.id)]}`,
    })),
    vehicleOptions: (vehicles.data?.items ?? []).map((v) => ({
      value: v.id,
      label: `${v.registration} — ${v.make} ${v.model} (${v.capacity} seats)`,
    })),
    clients: clients.data?.items ?? [],
    driverName: (id: string) => drivers.data?.items.find((d) => d.id === id)?.name ?? id,
    vehicleLabel: (id: string) => {
      const v = vehicles.data?.items.find((x) => x.id === id)
      return v ? `${v.registration}` : id
    },
    driverAvailability,
    availabilityNote,
    vehicleOnRoute: (id: string) => onRouteVehicles.has(id),
    isLoading: drivers.isLoading || vehicles.isLoading || clients.isLoading,
  }
}
