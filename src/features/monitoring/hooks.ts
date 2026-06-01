import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { usePolledQuery } from '@/lib/query'
import { useAuth } from '@/lib/auth'

function useTenantId() {
  const { session } = useAuth()
  return session!.tenantId
}

/** Dashboard summary — auto-refreshes every 30s (swap to WS later via usePolledQuery). */
export function useDashboard(date: string) {
  const tenantId = useTenantId()
  return usePolledQuery({
    queryKey: ['dashboard', tenantId, date],
    queryFn: () => api.monitoring.dashboard(tenantId, date),
  })
}

export function useAlerts() {
  const tenantId = useTenantId()
  return usePolledQuery({
    queryKey: ['alerts', tenantId],
    queryFn: () => api.monitoring.alerts(tenantId),
  })
}

export function useLiveRoute(id: string | undefined) {
  const tenantId = useTenantId()
  return useQuery({
    queryKey: ['live-route', tenantId, id],
    queryFn: () => api.monitoring.liveRoute(tenantId, id!),
    enabled: !!id,
    refetchInterval: 30_000,
  })
}
