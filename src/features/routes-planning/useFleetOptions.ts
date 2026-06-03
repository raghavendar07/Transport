import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'
import { useRoutesList } from './hooks'

export type DriverAvailability = 'available' | 'on_route' | 'off_duty'

/** Load active fleet/clients as Select options for route building, with live availability hints. */
export function useFleetOptions() {
  const drivers = driversApi.useList({ pageSize: 100 })
  const vehicles = vehiclesApi.useList({ pageSize: 100 })
  const clients = clientsApi.useList({ pageSize: 100 })
  const routes = useRoutesList({ pageSize: 200 })

  // Build sets of fleet IDs currently in active routes to derive availability.
  const onRouteDrivers = new Set<string>()
  const onRouteVehicles = new Set<string>()
  for (const r of routes.data?.items ?? []) {
    if (r.status === 'in_progress') {
      onRouteDrivers.add(r.driverId)
      onRouteVehicles.add(r.vehicleId)
    }
  }

  function driverAvailability(id: string, status: string): DriverAvailability {
    if (status !== 'active') return 'off_duty'
    if (onRouteDrivers.has(id)) return 'on_route'
    return 'available'
  }

  const AVAIL_LABEL: Record<DriverAvailability, string> = {
    available: 'Available',
    on_route: 'On route',
    off_duty: 'Off duty',
  }

  return {
    driverOptions: (drivers.data?.items ?? []).map((d) => ({
      value: d.id,
      label: `${d.name} — ${AVAIL_LABEL[driverAvailability(d.id, d.status)]}`,
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
    driverAvailability: (id: string) => {
      const d = drivers.data?.items.find((x) => x.id === id)
      return d ? driverAvailability(d.id, d.status) : 'available'
    },
    vehicleOnRoute: (id: string) => onRouteVehicles.has(id),
    isLoading: drivers.isLoading || vehicles.isLoading || clients.isLoading,
  }
}
