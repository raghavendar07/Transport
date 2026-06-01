import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import type { CrudApi, CreateInput } from '@/lib/api/client'
import type { ListParams } from '@/lib/api/types'

/**
 * Builds tenant-scoped TanStack Query hooks for a CRUD resource.
 * tenantId is taken from the session so screens never pass it manually,
 * and every cache key is namespaced by tenant (isolation in the cache too).
 */
export function createResourceHooks<T extends { id: string; tenantId: string }>(
  key: string,
  resource: CrudApi<T>,
) {
  function useList(params: ListParams = {}) {
    const { session } = useAuth()
    const tenantId = session!.tenantId
    return useQuery({
      queryKey: [key, tenantId, 'list', params],
      queryFn: () => resource.list(tenantId, params),
      placeholderData: keepPreviousData,
    })
  }

  function useGet(id: string | undefined) {
    const { session } = useAuth()
    const tenantId = session!.tenantId
    return useQuery({
      queryKey: [key, tenantId, 'detail', id],
      queryFn: () => resource.get(tenantId, id!),
      enabled: !!id,
    })
  }

  function useCreate() {
    const { session } = useAuth()
    const qc = useQueryClient()
    const tenantId = session!.tenantId
    return useMutation({
      mutationFn: (data: CreateInput<T>) => resource.create(tenantId, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key, tenantId] }),
    })
  }

  function useUpdate() {
    const { session } = useAuth()
    const qc = useQueryClient()
    const tenantId = session!.tenantId
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        resource.update(tenantId, id, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key, tenantId] }),
    })
  }

  function useRemove() {
    const { session } = useAuth()
    const qc = useQueryClient()
    const tenantId = session!.tenantId
    return useMutation({
      mutationFn: (id: string) => resource.remove(tenantId, id),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key, tenantId] }),
    })
  }

  return { useList, useGet, useCreate, useUpdate, useRemove }
}
