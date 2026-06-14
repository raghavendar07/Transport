import type {
  ComplianceDocument,
  AuditLogEntry,
  AppNotification,
  NotificationPreferences,
  GeneratedReport,
  ReportType,
  ReportJobStatus,
  ListParams,
  Paginated,
} from '@/lib/api/types'
import { ApiError } from '@/lib/api/errors'
import { Collection, nextId } from './store'
import { makeCrud } from './fleet'
import { assertCan } from '@/lib/api/permissions'
import { DOCUMENTS, AUDIT_LOG, NOTIFICATIONS, DEFAULT_PREFS } from './seed-compliance'
import { delay, deepClone } from './latency'

// ---------- Documents (admin-only mutations) ----------
const documents = new Collection<ComplianceDocument>(DOCUMENTS, 'doc', ['title', 'type'])
export const mockDocuments = makeCrud(documents, 'documents.manage')

// ---------- Audit (read-only) ----------
const auditRows: AuditLogEntry[] = deepClone(AUDIT_LOG)

export const mockAudit = {
  async list(tenantId: string, params: ListParams = {}): Promise<Paginated<AuditLogEntry>> {
    assertCan('audit.view') // admin-only read
    const { page = 1, pageSize = 10, search = '', filters = {} } = params
    let items = auditRows.filter((r) => r.tenantId === tenantId)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (r) => r.actorName.toLowerCase().includes(q) || r.action.toLowerCase().includes(q) || r.recordType.toLowerCase().includes(q),
      )
    }
    if (filters.action) items = items.filter((r) => r.action === filters.action)
    items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    const total = items.length
    const start = (page - 1) * pageSize
    return delay({ items: deepClone(items.slice(start, start + pageSize)), total, page, pageSize })
  },
  async get(tenantId: string, id: string): Promise<AuditLogEntry> {
    assertCan('audit.view')
    const row = auditRows.find((r) => r.id === id && r.tenantId === tenantId)
    if (!row) throw new ApiError('not_found', 'Log entry not found')
    return delay(deepClone(row))
  },
  /** CSV export (date range ≤ 90 days enforced in the UI). */
  async exportCsv(tenantId: string): Promise<string> {
    assertCan('audit.view')
    const rows = auditRows.filter((r) => r.tenantId === tenantId)
    const header = 'timestamp,actor,role,action,entityType,entityId,ip,userAgent,deviceInfo\n'
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`
    const body = rows
      .map((r) =>
        [r.createdAt, r.actorName, r.actorRole, r.action, r.recordType, r.recordId, r.ip, esc(r.userAgent), esc(r.deviceInfo)].join(','),
      )
      .join('\n')
    return delay(header + body)
  },
}

// ---------- Notifications ----------
const notificationRows: AppNotification[] = deepClone(NOTIFICATIONS)
let prefs: NotificationPreferences = deepClone(DEFAULT_PREFS)

export const mockNotifications = {
  async list(tenantId: string): Promise<AppNotification[]> {
    return delay(deepClone(notificationRows.filter((n) => n.tenantId === tenantId)))
  },
  async markRead(tenantId: string, id: string): Promise<void> {
    const n = notificationRows.find((x) => x.id === id && x.tenantId === tenantId)
    if (n) n.read = true
    return delay(undefined)
  },
  async markAllRead(tenantId: string): Promise<void> {
    notificationRows.filter((n) => n.tenantId === tenantId).forEach((n) => (n.read = true))
    return delay(undefined)
  },
  async getPrefs(): Promise<NotificationPreferences> {
    return delay(deepClone(prefs))
  },
  async updatePrefs(next: NotificationPreferences): Promise<NotificationPreferences> {
    prefs = deepClone(next)
    return delay(deepClone(prefs))
  },
}

// ---------- Reports (async job simulation) ----------
interface ReportJob extends GeneratedReport {
  _startedAt: number
}
const reportJobs: ReportJob[] = []

function jobStatus(job: ReportJob): ReportJobStatus {
  const elapsed = Date.now() - job._startedAt
  if (elapsed < 1500) return 'queued'
  if (elapsed < 3500) return 'generating'
  return 'ready'
}

export const mockReports = {
  async generate(
    tenantId: string,
    args: { type: ReportType; dateFrom: string; dateTo: string; filters: Record<string, string> },
  ): Promise<GeneratedReport> {
    const id = nextId('rep')
    const now = Date.now()
    const job: ReportJob = {
      id,
      tenantId,
      type: args.type,
      status: 'queued',
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
      filters: args.filters,
      createdAt: new Date().toISOString(),
      expiresAt: '', // 90-day retention; stamped by backend
      _startedAt: now,
    }
    reportJobs.unshift(job)
    const { _startedAt, ...rest } = job
    void _startedAt
    return delay(rest)
  },
  async list(tenantId: string): Promise<GeneratedReport[]> {
    return delay(
      reportJobs
        .filter((j) => j.tenantId === tenantId)
        .map(({ _startedAt, ...j }) => {
          void _startedAt
          return { ...j, status: jobStatus({ ...j, _startedAt } as ReportJob) }
        }),
    )
  },
  async archive(tenantId: string, ids: string[], archived: boolean): Promise<void> {
    for (const job of reportJobs) {
      if (job.tenantId === tenantId && ids.includes(job.id)) {
        job.archived = archived
      }
    }
    await delay(undefined)
  },
}
