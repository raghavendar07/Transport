import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'

/** Load active fleet/clients as Select options for route building. */
export function useFleetOptions() {
  const drivers = driversApi.useList({ pageSize: 100, filters: { status: 'active' } })
  const vehicles = vehiclesApi.useList({ pageSize: 100, filters: { status: 'active' } })
  const clients = clientsApi.useList({ pageSize: 100 })

  return {
    driverOptions: (drivers.data?.items ?? []).map((d) => ({ value: d.id, label: d.name })),
    vehicleOptions: (vehicles.data?.items ?? []).map((v) => ({ value: v.id, label: `${v.registration} · ${v.make} ${v.model}` })),
    clients: clients.data?.items ?? [],
    driverName: (id: string) => drivers.data?.items.find((d) => d.id === id)?.name ?? id,
    vehicleLabel: (id: string) => {
      const v = vehicles.data?.items.find((x) => x.id === id)
      return v ? `${v.registration}` : id
    },
    isLoading: drivers.isLoading || vehicles.isLoading || clients.isLoading,
  }
}
