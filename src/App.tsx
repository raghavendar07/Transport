import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { RequireAuth } from '@/routes/guards/RequireAuth'
import { RequireRole } from '@/routes/guards/RequireRole'
import { Spinner } from '@/components/ui'
// Auth pages stay eager — they're the first paint and small.
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { AccountLockedPage } from '@/features/auth/pages/AccountLockedPage'
import { NoAccessPage } from '@/features/auth/pages/NoAccessPage'

// Feature pages are code-split so each route loads its own chunk on demand.
const lazyPage = <T extends Record<string, React.ComponentType<unknown>>>(
  factory: () => Promise<T>,
  key: keyof T,
) => lazy(() => factory().then((m) => ({ default: m[key] as React.ComponentType<unknown> })))

const DriversListPage = lazyPage(() => import('@/features/fleet-clients/pages/DriversListPage'), 'DriversListPage')
const DriverFormPage = lazyPage(() => import('@/features/fleet-clients/pages/DriverFormPage'), 'DriverFormPage')
const DriverDetailPage = lazyPage(() => import('@/features/fleet-clients/pages/DriverDetailPage'), 'DriverDetailPage')
const VehiclesListPage = lazyPage(() => import('@/features/fleet-clients/pages/VehiclesListPage'), 'VehiclesListPage')
const VehicleFormPage = lazyPage(() => import('@/features/fleet-clients/pages/VehicleFormPage'), 'VehicleFormPage')
const VehicleDetailPage = lazyPage(() => import('@/features/fleet-clients/pages/VehicleDetailPage'), 'VehicleDetailPage')
const ClientsListPage = lazyPage(() => import('@/features/fleet-clients/pages/ClientsListPage'), 'ClientsListPage')
const ClientFormPage = lazyPage(() => import('@/features/fleet-clients/pages/ClientFormPage'), 'ClientFormPage')
const ClientDetailPage = lazyPage(() => import('@/features/fleet-clients/pages/ClientDetailPage'), 'ClientDetailPage')
const ChecklistBuilderPage = lazyPage(() => import('@/features/fleet-clients/pages/ChecklistBuilderPage'), 'ChecklistBuilderPage')
const UsersListPage = lazyPage(() => import('@/features/admin/pages/UsersListPage'), 'UsersListPage')
const UserFormPage = lazyPage(() => import('@/features/admin/pages/UserFormPage'), 'UserFormPage')
const SettingsPage = lazyPage(() => import('@/features/admin/pages/SettingsPage'), 'SettingsPage')
const RoutesOverviewPage = lazyPage(() => import('@/features/routes-planning/pages/RoutesOverviewPage'), 'RoutesOverviewPage')
const RouteBuilderPage = lazyPage(() => import('@/features/routes-planning/pages/RouteBuilderPage'), 'RouteBuilderPage')
const DashboardPage = lazyPage(() => import('@/features/monitoring/pages/DashboardPage'), 'DashboardPage')
const LiveRoutesPage = lazyPage(() => import('@/features/monitoring/pages/LiveRoutesPage'), 'LiveRoutesPage')
const LiveRouteDetailPage = lazyPage(() => import('@/features/monitoring/pages/LiveRouteDetailPage'), 'LiveRouteDetailPage')
const AlertsPage = lazyPage(() => import('@/features/monitoring/pages/AlertsPage'), 'AlertsPage')
const ComplianceDashboardPage = lazyPage(() => import('@/features/compliance/pages/ComplianceDashboardPage'), 'ComplianceDashboardPage')
const ReportsPage = lazyPage(() => import('@/features/compliance/pages/ReportsPage'), 'ReportsPage')
const DocumentsListPage = lazyPage(() => import('@/features/compliance/pages/DocumentsListPage'), 'DocumentsListPage')
const UploadDocumentPage = lazyPage(() => import('@/features/compliance/pages/UploadDocumentPage'), 'UploadDocumentPage')
const DocumentDetailPage = lazyPage(() => import('@/features/compliance/pages/DocumentDetailPage'), 'DocumentDetailPage')
const AuditLogPage = lazyPage(() => import('@/features/compliance/pages/AuditLogPage'), 'AuditLogPage')
const NotificationsPage = lazyPage(() => import('@/features/compliance/pages/NotificationsPage'), 'NotificationsPage')
const AccountPage = lazyPage(() => import('@/features/compliance/pages/AccountPage'), 'AccountPage')

function PageFallback() {
  return (
    <div className="flex justify-center py-20">
      <Spinner />
    </div>
  )
}

/**
 * Route tree. Public auth routes use AuthLayout; everything else is wrapped in
 * AppShell behind RequireAuth, with per-section RequireRole permission gates.
 * Feature pages are lazy-loaded so each route ships its own chunk.
 */
export function App() {
  return (
    <Routes>
      {/* Public auth (A1) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage mode="reset" />} />
      <Route path="/first-time-setup" element={<ResetPasswordPage mode="first-time" />} />
      <Route path="/account-locked" element={<AccountLockedPage />} />
      <Route path="/no-access" element={<NoAccessPage />} />

      {/* Authenticated app */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route
            path="/*"
            element={
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/monitoring" element={<LiveRoutesPage />} />
                  <Route path="/monitoring/:id" element={<LiveRouteDetailPage />} />

                  <Route element={<RequireRole permission="routes.view" />}>
                    <Route path="/routes" element={<RoutesOverviewPage />} />
                    <Route path="/routes/new" element={<RouteBuilderPage />} />
                    <Route path="/routes/:id" element={<RouteBuilderPage />} />
                  </Route>
                  <Route element={<RequireRole permission="fleet.manage" />}>
                    <Route path="/drivers" element={<DriversListPage />} />
                    <Route path="/drivers/new" element={<DriverFormPage />} />
                    <Route path="/drivers/:id" element={<DriverDetailPage />} />
                    <Route path="/drivers/:id/edit" element={<DriverFormPage />} />
                    <Route path="/vehicles" element={<VehiclesListPage />} />
                    <Route path="/vehicles/new" element={<VehicleFormPage />} />
                    <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                    <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
                  </Route>
                  <Route element={<RequireRole permission="clients.manage" />}>
                    <Route path="/clients" element={<ClientsListPage />} />
                    <Route path="/clients/new" element={<ClientFormPage />} />
                    <Route path="/clients/:id" element={<ClientDetailPage />} />
                    <Route path="/clients/:id/edit" element={<ClientFormPage />} />
                  </Route>
                  {/* Dispatcher: view-only alerts surface */}
                  <Route element={<RequireRole permission="alerts.view" />}>
                    <Route path="/alerts" element={<AlertsPage />} />
                  </Route>
                  <Route element={<RequireRole permission="reports.view" />}>
                    <Route path="/reports" element={<ReportsPage />} />
                  </Route>
                  {/* Compliance — admin only */}
                  <Route element={<RequireRole permission="compliance.view" />}>
                    <Route path="/compliance" element={<ComplianceDashboardPage />} />
                  </Route>
                  <Route element={<RequireRole permission="checklists.manage" />}>
                    <Route path="/checklists" element={<ChecklistBuilderPage />} />
                  </Route>
                  <Route element={<RequireRole permission="documents.manage" />}>
                    <Route path="/documents" element={<DocumentsListPage />} />
                    <Route path="/documents/upload" element={<UploadDocumentPage />} />
                    <Route path="/documents/:id" element={<DocumentDetailPage />} />
                  </Route>
                  <Route element={<RequireRole permission="audit.view" />}>
                    <Route path="/audit" element={<AuditLogPage />} />
                  </Route>
                  <Route element={<RequireRole permission="users.manage" />}>
                    <Route path="/users" element={<UsersListPage />} />
                    <Route path="/users/new" element={<UserFormPage />} />
                    <Route path="/users/:id/edit" element={<UserFormPage />} />
                  </Route>
                  <Route element={<RequireRole permission="settings.manage" />}>
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
