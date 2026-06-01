import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { createResourceHooks } from '@/lib/useCrud'
import { useAuth } from '@/lib/auth'
import type { TenantSettings } from '@/lib/api/types'

export const usersApi = createResourceHooks('users', api.users)

export function useSettings() {
  const { session } = useAuth()
  const tenantId = session!.tenantId
  return useQuery({
    queryKey: ['settings', tenantId],
    queryFn: () => api.settings.get(tenantId),
  })
}

export function useUpdateSettings() {
  const { session } = useAuth()
  const qc = useQueryClient()
  const tenantId = session!.tenantId
  return useMutation({
    mutationFn: (data: Partial<TenantSettings>) => api.settings.update(tenantId, data),
    onSuccess: (next) => qc.setQueryData(['settings', tenantId], next),
  })
}
