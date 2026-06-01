import type { ComplianceDocument, AuditLogEntry, AppNotification, NotificationPreferences } from '@/lib/api/types'

export const DOCUMENTS: ComplianceDocument[] = [
  {
    id: 'doc1',
    tenantId: 't1',
    scope: 'business',
    scopeRefId: null,
    title: 'Operator Licence',
    type: 'Licence',
    issueDate: '2024-01-01',
    expiryDate: '2026-12-31',
    notes: 'Standard national operator licence.',
    fileName: 'operator-licence.pdf',
    fileSize: 482_000,
    uploadedAt: '2025-01-12T10:00:00Z',
  },
  {
    id: 'doc2',
    tenantId: 't1',
    scope: 'driver',
    scopeRefId: 'd3',
    title: 'Mara Singh — DBS Check',
    type: 'Background Check',
    issueDate: '2024-04-01',
    expiryDate: '2026-06-10', // expiring soon
    notes: '',
    fileName: 'dbs-mara.pdf',
    fileSize: 221_000,
    uploadedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'doc3',
    tenantId: 't1',
    scope: 'vehicle',
    scopeRefId: 'v2',
    title: 'LE70 XYZ — Insurance Certificate',
    type: 'Insurance',
    issueDate: '2024-06-18',
    expiryDate: '2026-04-18', // expired
    notes: 'Renew before next MOT.',
    fileName: 'insurance-le70.pdf',
    fileSize: 305_000,
    uploadedAt: '2025-02-05T10:00:00Z',
  },
]

export const AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'au1',
    tenantId: 't1',
    actorId: 'u1',
    actorName: 'Alice Admin',
    actorRole: 'tenant_admin',
    action: 'route.publish',
    recordType: 'RoutePlan',
    recordId: 'r1',
    before: { status: 'draft' },
    after: { status: 'published' },
    ip: '203.0.113.20',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    createdAt: '2026-05-31T09:01:00Z',
  },
  {
    id: 'au2',
    tenantId: 't1',
    actorId: 'u2',
    actorName: 'Dan Dispatcher',
    actorRole: 'dispatcher',
    action: 'driver.update',
    recordType: 'Driver',
    recordId: 'd2',
    before: { phone: '+44 7700 900200' },
    after: { phone: '+44 7700 900222' },
    ip: '203.0.113.45',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
    createdAt: '2026-05-30T14:22:00Z',
  },
  {
    id: 'au3',
    tenantId: 't1',
    actorId: 'u1',
    actorName: 'Alice Admin',
    actorRole: 'tenant_admin',
    action: 'user.deactivate',
    recordType: 'User',
    recordId: 'u9',
    before: { status: 'active' },
    after: { status: 'inactive' },
    ip: '203.0.113.20',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    createdAt: '2026-05-29T11:05:00Z',
  },
]

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', tenantId: 't1', title: 'Licence expiring', body: 'Eli Evans’ licence expires in 22 days.', read: false, createdAt: '2026-06-01T07:00:00Z' },
  { id: 'n2', tenantId: 't1', title: 'Document expired', body: 'LE70 XYZ insurance certificate has expired.', read: false, createdAt: '2026-05-31T07:00:00Z' },
  { id: 'n3', tenantId: 't1', title: 'Route published', body: 'AM route for 01 Jun was published.', read: true, createdAt: '2026-05-30T09:02:00Z' },
]

export const DEFAULT_PREFS: NotificationPreferences = {
  licence_expiring: { email: true, push: true, in_app: true },
  document_expiring: { email: true, push: false, in_app: true },
  checklist_failure: { email: true, push: true, in_app: true },
  route_published: { email: false, push: false, in_app: true },
  driver_substituted: { email: true, push: false, in_app: true },
}
