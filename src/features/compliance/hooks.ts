import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { createResourceHooks } from '@/lib/useCrud'
import { usePolledQuery } from '@/lib/query'
import { useAuth } from '@/lib/auth'
import type { NotificationPreferences, ReportType } from '@/lib/api/types'

function useTenantId() {
  const { session } = useAuth()
  return session!.tenantId
}

export const documentsApi = createResourceHooks('documents', api.documents)

// Audit (read-only)
export function useAuditList(params = {}) {
  const tenantId = useTenantId()
  return useQuery({ queryKey: ['audit', tenantId, params], queryFn: () => api.audit.list(tenantId, params) })
}
export function useAuditExport() {
  const tenantId = useTenantId()
  return useMutation({ mutationFn: () => api.audit.exportCsv(tenantId) })
}

// Notifications
export function useNotifications() {
  const tenantId = useTenantId()
  return useQuery({ queryKey: ['notifications', tenantId], queryFn: () => api.notifications.list(tenantId) })
}
export function useNotificationMutations() {
  const tenantId = useTenantId()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications', tenantId] })
  return {
    markRead: useMutation({ mutationFn: (id: string) => api.notifications.markRead(tenantId, id), onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: () => api.notifications.markAllRead(tenantId), onSuccess: invalidate }),
  }
}
export function usePrefs() {
  return useQuery({ queryKey: ['notification-prefs'], queryFn: () => api.notifications.getPrefs() })
}
export function useUpdatePrefs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (next: NotificationPreferences) => api.notifications.updatePrefs(next),
    onSuccess: (data) => qc.setQueryData(['notification-prefs'], data),
  })
}

// Reports — list polls so queued → generating → ready transitions show live.
export function useReports() {
  const tenantId = useTenantId()
  return usePolledQuery({
    queryKey: ['reports', tenantId],
    queryFn: () => api.reports.list(tenantId),
    intervalMs: 2000,
  })
}
export function useGenerateReport() {
  const tenantId = useTenantId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { type: ReportType; dateFrom: string; dateTo: string; filters: Record<string, string> }) =>
      api.reports.generate(tenantId, args),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', tenantId] }),
  })
}
