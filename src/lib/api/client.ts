/**
 * Single API boundary. Screens import `api` and never know whether data comes
 * from the in-memory mock or the real NestJS backend — swapping VITE_API_MODE
 * (or wiring the real adapter) changes nothing above this line.
 */
import type { Session } from '@/lib/auth'
import type {
  Driver,
  Vehicle,
  Client,
  SafetyChecklist,
  User,
  TenantSettings,
  RoutePlan,
  RouteSession,
  ComplianceDocument,
  AuditLogEntry,
  AppNotification,
  NotificationPreferences,
  GeneratedReport,
  ReportType,
  ListParams,
  Paginated,
} from './types'
import { mockAuth } from './mock/auth'
import { mockFleet } from './mock/fleet'
import { mockUsers, mockSettings } from './mock/admin'
import { mockRoutes, type OverlapResult } from './mock/routes'
import {
  mockMonitoring,
  type DashboardSummary,
  type Alert,
  type LiveRoute,
} from './mock/monitoring'
import { mockDocuments, mockAudit, mockNotifications, mockReports } from './mock/compliance'

/** Payload for creating a record — server-managed fields are omitted. */
export type CreateInput<T> = Omit<T, 'id' | 'tenantId' | 'createdAt'>

/** Standard tenant-scoped CRUD surface shared by most resources. */
export interface CrudApi<T extends { id: string; tenantId: string }> {
  list(tenantId: string, params?: ListParams): Promise<Paginated<T>>
  get(tenantId: string, id: string): Promise<T>
  create(tenantId: string, data: CreateInput<T>): Promise<T>
  update(tenantId: string, id: string, data: Partial<T>): Promise<T>
  remove(tenantId: string, id: string): Promise<void>
}

export interface Api {
  auth: {
    login(email: string, password: string): Promise<Session>
    requestPasswordReset(email: string): Promise<void>
    resetPassword(token: string, newPassword: string): Promise<void>
  }
  drivers: CrudApi<Driver>
  vehicles: CrudApi<Vehicle>
  clients: CrudApi<Client>
  checklists: CrudApi<SafetyChecklist>
  users: CrudApi<User>
  settings: {
    get(tenantId: string): Promise<TenantSettings>
    update(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings>
  }
  routes: CrudApi<RoutePlan> & {
    checkOverlap(
      tenantId: string,
      args: { date: string; session: RouteSession; driverId: string; vehicleId: string; excludeRouteId?: string },
    ): Promise<OverlapResult>
    publish(tenantId: string, id: string): Promise<RoutePlan>
    substituteDriver(tenantId: string, id: string, newDriverId: string, reason: string): Promise<RoutePlan>
    cancelRoute(tenantId: string, id: string, reason: string): Promise<RoutePlan>
    cancelStop(tenantId: string, id: string, stopId: string, reason: string): Promise<RoutePlan>
    copyDay(tenantId: string, fromDate: string, toDate: string, reassign?: { driverId?: string; vehicleId?: string }): Promise<number>
  }
  monitoring: {
    dashboard(tenantId: string, date: string): Promise<DashboardSummary>
    alerts(tenantId: string): Promise<Alert[]>
    liveRoute(tenantId: string, id: string): Promise<LiveRoute>
  }
  documents: CrudApi<ComplianceDocument>
  audit: {
    list(tenantId: string, params?: ListParams): Promise<Paginated<AuditLogEntry>>
    get(tenantId: string, id: string): Promise<AuditLogEntry>
    exportCsv(tenantId: string): Promise<string>
  }
  notifications: {
    list(tenantId: string): Promise<AppNotification[]>
    markRead(tenantId: string, id: string): Promise<void>
    markAllRead(tenantId: string): Promise<void>
    getPrefs(): Promise<NotificationPreferences>
    updatePrefs(next: NotificationPreferences): Promise<NotificationPreferences>
  }
  reports: {
    generate(
      tenantId: string,
      args: { type: ReportType; dateFrom: string; dateTo: string; filters: Record<string, string> },
    ): Promise<GeneratedReport>
    list(tenantId: string): Promise<GeneratedReport[]>
    archive(tenantId: string, ids: string[], archived: boolean): Promise<void>
  }
}

const mockApi: Api = {
  auth: mockAuth,
  drivers: mockFleet.drivers,
  vehicles: mockFleet.vehicles,
  clients: mockFleet.clients,
  checklists: mockFleet.checklists,
  users: mockUsers,
  settings: mockSettings,
  routes: mockRoutes,
  monitoring: mockMonitoring,
  documents: mockDocuments,
  audit: mockAudit,
  notifications: mockNotifications,
  reports: mockReports,
}

const notImpl = () => {
  throw new Error('Real API not implemented yet. Set VITE_API_MODE=mock.')
}
const realCrud = <T extends { id: string; tenantId: string }>(): CrudApi<T> => ({
  list: notImpl,
  get: notImpl,
  create: notImpl,
  update: notImpl,
  remove: notImpl,
})

const realApi: Api = {
  auth: { login: notImpl, requestPasswordReset: notImpl, resetPassword: notImpl },
  drivers: realCrud<Driver>(),
  vehicles: realCrud<Vehicle>(),
  clients: realCrud<Client>(),
  checklists: realCrud<SafetyChecklist>(),
  users: realCrud<User>(),
  settings: { get: notImpl, update: notImpl },
  routes: {
    list: notImpl,
    get: notImpl,
    create: notImpl,
    update: notImpl,
    remove: notImpl,
    checkOverlap: notImpl,
    publish: notImpl,
    substituteDriver: notImpl,
    cancelRoute: notImpl,
    cancelStop: notImpl,
    copyDay: notImpl,
  },
  monitoring: { dashboard: notImpl, alerts: notImpl, liveRoute: notImpl },
  documents: realCrud<ComplianceDocument>(),
  audit: { list: notImpl, get: notImpl, exportCsv: notImpl },
  notifications: { list: notImpl, markRead: notImpl, markAllRead: notImpl, getPrefs: notImpl, updatePrefs: notImpl },
  reports: { generate: notImpl, list: notImpl, archive: notImpl },
}

const MODE = import.meta.env.VITE_API_MODE ?? 'mock'

export const api: Api = MODE === 'real' ? realApi : mockApi
