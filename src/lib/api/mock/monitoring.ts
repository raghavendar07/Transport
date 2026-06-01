import type { RouteStop, RoutePlan } from '@/lib/api/types'
import { fleetCollections } from './fleet'
import { expiryStatus } from '@/lib/format'
import { routesCollection } from './routes'
import { delay } from './latency'

const routesRef = routesCollection

export interface DashboardSummary {
  date: string
  totalRoutes: number
  driversActive: number
  vehiclesInUse: number
  completed: number
  inProgress: number
  draft: number
  published: number
  cancelled: number
  /** Completed / (total incl. cancelled) as a 0–100 percentage. */
  completionPct: number
}

export type AlertSeverity = 'warn' | 'expired'
export interface Alert {
  id: string
  severity: AlertSeverity
  category: 'licence' | 'insurance' | 'registration' | 'checklist'
  title: string
  detail: string
}

export interface LiveEvent {
  time: string
  label: string
}

export interface LiveRoute {
  route: RoutePlan
  path: { lat: number; lng: number }[]
  events: LiveEvent[]
  photos: { id: string; stopName: string; url: string }[]
}

export const mockMonitoring = {
  async dashboard(tenantId: string, date: string): Promise<DashboardSummary> {
    const all = routesRef.raw(tenantId).filter((r) => r.date === date)
    const todays = all.filter((r) => r.status !== 'cancelled')
    const active = todays.filter((r) => r.status === 'published' || r.status === 'in_progress')
    const completed = todays.filter((r) => r.status === 'completed').length
    return delay({
      date,
      totalRoutes: todays.length,
      driversActive: new Set(active.map((r) => r.driverId)).size,
      vehiclesInUse: new Set(active.map((r) => r.vehicleId)).size,
      completed,
      inProgress: todays.filter((r) => r.status === 'in_progress').length,
      draft: todays.filter((r) => r.status === 'draft').length,
      published: todays.filter((r) => r.status === 'published').length,
      cancelled: all.filter((r) => r.status === 'cancelled').length,
      completionPct: all.length ? Math.round((completed / all.length) * 100) : 0,
    })
  },

  async alerts(tenantId: string): Promise<Alert[]> {
    const out: Alert[] = []
    for (const d of fleetCollections.drivers.raw(tenantId)) {
      const s = expiryStatus(d.licenceExpiry)
      if (s === 'expiring' || s === 'expired') {
        out.push({
          id: `lic-${d.id}`,
          severity: s === 'expired' ? 'expired' : 'warn',
          category: 'licence',
          title: `${d.name}'s licence ${s === 'expired' ? 'has expired' : 'expires soon'}`,
          detail: `Licence ${d.licenceNumber} · expires ${d.licenceExpiry}`,
        })
      }
    }
    for (const v of fleetCollections.vehicles.raw(tenantId)) {
      for (const [field, cat] of [
        ['insuranceExpiry', 'insurance'],
        ['registrationExpiry', 'registration'],
      ] as const) {
        const s = expiryStatus(v[field])
        if (s === 'expiring' || s === 'expired') {
          out.push({
            id: `${cat}-${v.id}`,
            severity: s === 'expired' ? 'expired' : 'warn',
            category: cat,
            title: `${v.registration} ${cat} ${s === 'expired' ? 'expired' : 'expiring soon'}`,
            detail: `${v.make} ${v.model} · expires ${v[field]}`,
          })
        }
      }
    }
    out.push({
      id: 'chk-1',
      severity: 'expired',
      category: 'checklist',
      title: 'Critical checklist failure',
      detail: 'MA21 KLP — Brakes responsive failed on AM pre-trip check',
    })
    return delay(out)
  },

  async liveRoute(tenantId: string, id: string): Promise<LiveRoute> {
    const route = await routesRef.get(tenantId, id)
    // Synthetic GPS path around Manchester.
    const path = [
      { lat: 53.4451, lng: -2.2299 },
      { lat: 53.4612, lng: -2.2401 },
      { lat: 53.4779, lng: -2.2452 },
      { lat: 53.4808, lng: -2.2426 },
    ]
    const events: LiveEvent[] = [
      { time: '08:02', label: 'Route started — driver checked in' },
      { time: '08:10', label: 'Pre-trip safety checklist completed' },
      { time: '08:16', label: 'Arrived at Sunrise Care Home' },
      { time: '08:19', label: 'Pickup confirmed with digital attestation' },
    ]
    const photos = route.stops.slice(0, 2).map((s: RouteStop, i) => ({
      id: `p${i}`,
      stopName: s.clientName,
      url: '',
    }))
    return delay({ route, path, events, photos })
  },
}
