/**
 * Shared DTOs between the API client and the screens.
 * These are defined now (mock-first); the real NestJS backend should align to them,
 * or be adapted at the client boundary so screens never change.
 */
import type { Role } from '@/lib/rbac'

export type ID = string

export type EntityStatus = 'active' | 'inactive'

export interface Tenant {
  id: ID
  name: string
  code: string
  country: string
  timezone: string
  defaultLanguage: string
  status: EntityStatus
  createdAt: string
}

export interface User {
  id: ID
  tenantId: ID
  name: string
  email: string
  /** Primary role — used for the role chip + portal landing page. Derived from `roles[0]`. */
  role: Role
  /** All assigned roles. Permissions union across every entry. */
  roles: Role[]
  /** Per-user permission overrides for the Admin role. Empty / undefined = role defaults. */
  adminPermissions?: string[]
  /** Per-user permission overrides for the Dispatcher role. Empty / undefined = role defaults. */
  dispatcherPermissions?: string[]
  status: EntityStatus
  lastLoginAt: string | null
  createdAt: string
}

export interface TenantSettings {
  tenantId: ID
  timezone: string
  workingDays: string[] // e.g. ['mon','tue',...]
  amRouteTime: string // 'HH:mm'
  pmRouteTime: string
  logoDataUrl: string | null
  reportHeader: string
  reportFooter: string
}

/**
 * A required compliance document attached to a driver or vehicle.
 * `fileName` null until uploaded; status is derived from expiryDate via expiryStatus().
 */
export interface RequiredDocument {
  type: string // e.g. 'Driver License', 'Insurance Certificate'
  issueDate: string
  expiryDate: string
  fileName: string | null
  fileSize: number | null
}

/** Mock-only field used to demonstrate dispatch states; real backend would derive these. */
export type DriverAvailability = 'available' | 'scheduled' | 'en_route' | 'sick' | 'other'

export interface Driver {
  id: ID
  tenantId: ID
  name: string
  email: string
  phone: string
  licenceNumber: string
  licenceExpiry: string // ISO date — drives ExpiryBadge
  photoUrl: string | null
  address: string
  dob: string
  status: EntityStatus
  /** Mock dispatch state. Overrides derived "on a live route" status when set. */
  availability?: DriverAvailability
  /** Free-text note shown next to availability — e.g. "Annual leave", "Vehicle maintenance". */
  availabilityNote?: string
  documents: RequiredDocument[]
  createdAt: string
}

export type FuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid'

/** A single maintenance event on a vehicle. Type is free-form so operators can add their own categories. */
export interface MaintenanceLog {
  id: ID
  /** Free-form maintenance type — e.g. "Oil Change", "Lift Maintenance", "Tune-up". */
  type: string
  /** ISO date when the maintenance was performed. */
  date: string
  /** Vehicle odometer reading (miles) at the time of service. */
  mileage: number
  /** Optional notes from the technician. */
  notes?: string
  /** Optional uploaded invoice / report file. */
  fileName?: string | null
}

export interface Vehicle {
  id: ID
  tenantId: ID
  registration: string
  make: string
  model: string
  year: number
  capacity: number
  /** Number of wheelchair spaces. Each space consumes 4 seats. */
  wheelchairSpaces: number
  /** Vehicle size class — drives icon, defaults and reporting. */
  size: 'small' | 'medium' | 'large'
  fuelType: FuelType
  insuranceExpiry: string
  registrationExpiry: string
  odometer: number
  status: EntityStatus
  documents: RequiredDocument[]
  maintenanceLogs?: MaintenanceLog[]
  /** Free-form attachments — additional docs / notes attached by operators. */
  attachments?: VehicleAttachment[]
  createdAt: string
}

/** Any pertinent doc / note attached to a vehicle beyond the required documents. */
export interface VehicleAttachment {
  id: ID
  /** Free-text label — e.g. "Body shop quote", "Warranty info", "Service contract". */
  label: string
  /** Optional context. */
  notes?: string
  /** Uploaded file name. */
  fileName: string
  /** File size in bytes. */
  fileSize: number
  /** ISO datetime when the file was attached. */
  uploadedAt: string
}

/** Role distinguishes the pickup vs drop-off address on a client record. */
export type AddressRole = 'pickup' | 'dropoff'

export interface ClientAddress {
  id: ID
  label: string
  role: AddressRole
  line1: string
  city: string
  state: string
  postcode: string
  lat: number | null
  lng: number | null
}

export interface Client {
  id: ID
  tenantId: ID
  uci: string // unique client identifier — auto-generated, read-only
  name: string
  contactName: string
  contactPhone: string
  addresses: ClientAddress[]
  /** Insurance / agency authorization reference number (e.g. Medicaid auth, broker ID). */
  authorizationNumber: string
  /** ISO date when the authorization becomes effective. */
  authorizationStartDate: string
  /** ISO date when the authorization expires. Drives route-add blocking. */
  authorizationExpiry: string
  emergencyContact: string
  notes: string
  status: EntityStatus
  createdAt: string
}

export interface ChecklistItem {
  id: ID
  label: string
  critical: boolean
  order: number
}

export interface SafetyChecklist {
  id: ID
  tenantId: ID
  name: string
  items: ChecklistItem[]
}

export type RouteSession = 'AM' | 'PM'
export type RouteStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
export type StopType = 'pickup' | 'drop'
export type StopStatus = 'pending' | 'completed' | 'cancelled'

export interface RouteStop {
  id: ID
  clientId: ID
  clientUci: string
  clientName: string
  addressId: ID
  type: StopType
  plannedTime: string
  order: number
  status: StopStatus
}

export interface RoutePlan {
  id: ID
  tenantId: ID
  name: string
  date: string
  /** HH:mm — route start time. Session derived from this in mock helpers. */
  startTime: string
  session: RouteSession
  driverId: ID
  vehicleId: ID
  status: RouteStatus
  stops: RouteStop[]
  createdAt: string
}

export type DocumentScope = 'business' | 'driver' | 'vehicle'

export interface ComplianceDocument {
  id: ID
  tenantId: ID
  scope: DocumentScope
  scopeRefId: ID | null
  title: string
  type: string
  issueDate: string
  expiryDate: string | null
  notes: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

export type ReportType =
  | 'route_summary'
  | 'driver'
  | 'vehicle'
  | 'client'
  | 'month_end_billing'
  | 'vehicle_mileage'
  | 'daily_logs'
export type ReportJobStatus = 'queued' | 'generating' | 'ready' | 'failed'

export interface GeneratedReport {
  id: ID
  tenantId: ID
  type: ReportType
  status: ReportJobStatus
  dateFrom: string
  dateTo: string
  filters: Record<string, string>
  createdAt: string
  /** Retention horizon — DDS requires 3 years (~1095 days). */
  expiresAt: string
  /** True once the operator moves the report into archive storage. */
  archived?: boolean
}

export interface AuditLogEntry {
  id: ID
  tenantId: ID
  actorId: ID
  actorName: string
  actorRole: Role
  action: string
  recordType: string
  recordId: ID
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ip: string
  userAgent: string
  /** Human-readable device/browser/OS summary for the audit trail. */
  deviceInfo: string
  createdAt: string
}

export type NotificationChannel = 'email' | 'push' | 'in_app'

export interface AppNotification {
  id: ID
  tenantId: ID
  title: string
  body: string
  read: boolean
  createdAt: string
}

export const NOTIFICATION_EVENTS = [
  'licence_expiring',
  'document_expiring',
  'checklist_failure',
  'route_published',
  'driver_substituted',
] as const
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]

/**
 * Per event × channel toggle matrix. Keyed by string so per-document-type rules
 * (e.g. `doc_expiring:CPR`) can be added without a type change — UI groups them
 * dynamically off the document type catalogue.
 */
export type NotificationPreferences = Record<string, Record<NotificationChannel, boolean>>

/** Generic paginated list envelope returned by list endpoints. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  filters?: Record<string, string>
}
