import { PageHeader } from '@/components/layout'
import { AlertsPanel } from '../components/AlertsPanel'

/** Dispatcher-facing alerts surface — view-only expiry & compliance warnings. */
export function AlertsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Alerts"
        description="Licence, insurance, registration and checklist warnings. View-only — contact an administrator to resolve."
      />
      <AlertsPanel />
    </div>
  )
}
