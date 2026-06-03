import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useAuth } from '@/lib/auth'
import type { RoutePlan, RouteSession, ListParams } from '@/lib/api/types'

const KEY = 'routes'

function useTenantId() {
  const { session } = useAuth()
  return session!.tenantId
}

export function useRoutesList(params: ListParams = {}) {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: [KEY, tenantId, 'list', params],
    queryFn: () => api.routes.list(tenantId, params),
    placeholderData: keepPreviousData,
  })
}

export function useRoute(id: string | undefined) {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: [KEY, tenantId, 'detail', id],
    queryFn: () => api.routes.get(tenantId, id!),
    enabled: !!id,
  })
}

export function useRouteMutations() {
  const tenantId = useTenantId()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY, tenantId] })

  return {
    create: useMutation({
      mutationFn: (data: Omit<RoutePlan, 'id' | 'tenantId' | 'createdAt'>) => api.routes.create(tenantId, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.routes.remove(tenantId, id),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<RoutePlan> }) => api.routes.update(tenantId, id, data),
      onSuccess: invalidate,
    }),
    publish: useMutation({
      mutationFn: (id: string) => api.routes.publish(tenantId, id),
      onSuccess: invalidate,
    }),
    substitute: useMutation({
      mutationFn: ({ id, driverId, reason }: { id: string; driverId: string; reason: string }) =>
        api.routes.substituteDriver(tenantId, id, driverId, reason),
      onSuccess: invalidate,
    }),
    cancelRoute: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => api.routes.cancelRoute(tenantId, id, reason),
      onSuccess: invalidate,
    }),
    cancelStop: useMutation({
      mutationFn: ({ id, stopId, reason }: { id: string; stopId: string; reason: string }) =>
        api.routes.cancelStop(tenantId, id, stopId, reason),
      onSuccess: invalidate,
    }),
    copyDay: useMutation({
      mutationFn: (args: { fromDate: string; toDate: string; reassign?: { driverId?: string; vehicleId?: string } }) =>
        api.routes.copyDay(tenantId, args.fromDate, args.toDate, args.reassign),
      onSuccess: invalidate,
    }),
  }
}

export function useCheckOverlap() {
  const tenantId = useTenantId()
  return useMutation({
    mutationFn: (args: { date: string; session: RouteSession; driverId: string; vehicleId: string; excludeRouteId?: string }) =>
      api.routes.checkOverlap(tenantId, args),
  })
}
