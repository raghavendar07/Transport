import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { createResourceHooks } from '@/lib/useCrud'
import { useAuth } from '@/lib/auth'
import type { TenantSettings, Tenant, ListParams } from '@/lib/api/types'

export const usersApi = createResourceHooks('users', api.users)

/**
 * Tenants are platform-level (super admin), not tenant-scoped, so they get
 * bespoke hooks rather than the tenant-scoped createResourceHooks.
 */
export const tenantsApi = {
  useList(params: ListParams = {}) {
    return useQuery({
      queryKey: ['tenants', 'list', params],
      queryFn: () => api.tenants.list('', params),
      placeholderData: keepPreviousData,
    })
  },
  useGet(id: string | undefined) {
    return useQuery({
      queryKey: ['tenants', 'detail', id],
      queryFn: () => api.tenants.get('', id!),
      enabled: !!id,
    })
  },
  useCreate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (data: Omit<Tenant, 'id' | 'createdAt'>) => api.tenants.create('', data),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
    })
  },
  useUpdate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) => api.tenants.update('', id, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
    })
  },
}

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
