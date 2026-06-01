import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { createResourceHooks } from '@/lib/useCrud'
import { usePolledQuery } from '@/lib/query'
import { useAuth } from '@/lib/auth'
import { expiryStatus } from '@/lib/format'
import type { NotificationPreferences, ReportType } from '@/lib/api/types'

function useTenantId() {
  const { session } = useAuth()
  return session!.tenantId
}

export const documentsApi = createResourceHooks('documents', api.documents)

export interface ComplianceSummary {
  driversExpiringSoon: number
  driversExpired: number
  vehiclesExpiringSoon: number
  vehiclesExpired: number
  documentsExpiringSoon: number
  documentsExpired: number
  failedChecklists: number
  activeIssues: number
}

/**
 * Aggregated compliance posture for the Compliance Dashboard and the Admin
 * dashboard. Derives counts from the alerts feed + the document repository.
 */
export function useComplianceSummary() {
  const tenantId = useTenantId()
  const alertsQ = useQuery({ queryKey: ['alerts', tenantId], queryFn: () => api.monitoring.alerts(tenantId) })
  const docsQ = useQuery({
    queryKey: ['documents', tenantId, 'all'],
    queryFn: () => api.documents.list(tenantId, { pageSize: 200 }),
  })

  const alerts = alertsQ.data ?? []
  const docs = docsQ.data?.items ?? []
  const count = (cat: string, sev: string) =>
    alerts.filter((a) => a.category === cat && a.severity === sev).length

  const summary: ComplianceSummary = {
    driversExpiringSoon: count('licence', 'warn'),
    driversExpired: count('licence', 'expired'),
    vehiclesExpiringSoon: count('insurance', 'warn') + count('registration', 'warn'),
    vehiclesExpired: count('insurance', 'expired') + count('registration', 'expired'),
    documentsExpiringSoon: docs.filter((d) => d.expiryDate && expiryStatus(d.expiryDate) === 'expiring').length,
    documentsExpired: docs.filter((d) => d.expiryDate && expiryStatus(d.expiryDate) === 'expired').length,
    failedChecklists: alerts.filter((a) => a.category === 'checklist').length,
    activeIssues: alerts.length,
  }

  return { summary, alerts, isLoading: alertsQ.isLoading || docsQ.isLoading, isError: alertsQ.isError || docsQ.isError, refetch: () => { alertsQ.refetch(); docsQ.refetch() } }
}

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
