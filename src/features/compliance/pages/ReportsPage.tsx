import { useMemo, useState } from 'react'
import {
  FileBarChart,
  Download,
  Loader,
  Clock,
  CheckCircle2,
  FileText,
  Package,
  Receipt,
  Gauge,
  Printer,
  Archive,
  ArchiveRestore,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Combobox,
  Input,
  FormField,
  DataTable,
  type Column,
  Modal,
  Badge,
  useToast,
} from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/format'
import type { Client as ClientT, GeneratedReport, ReportType, RoutePlan, Vehicle } from '@/lib/api/types'
import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'
import { useRoutesList } from '@/features/routes-planning/hooks'
import { totalRouteDistanceMiles } from '@/features/routes-planning/distance'
import { useReports, useGenerateReport, useArchiveReports } from '../hooks'

interface ReportTypeMeta {
  value: ReportType
  label: string
  desc: string
  group: 'Key reports' | 'Operational reports'
}

const TYPES: ReportTypeMeta[] = [
  {
    value: 'daily_logs',
    label: 'Daily Logs (All Routes)',
    desc: 'Print-ready daily activity log combining every route and stop for the chosen day.',
    group: 'Key reports',
  },
  {
    value: 'month_end_billing',
    label: 'Month End Billing Report',
    desc: 'Per-client billing summary across a chosen month — trip count, miles, totals.',
    group: 'Key reports',
  },
  {
    value: 'vehicle_mileage',
    label: 'Vehicle Mileage Report',
    desc: 'Odometer-based mileage per vehicle for the selected window.',
    group: 'Key reports',
  },
  { value: 'route_summary', label: 'Route Report', desc: 'Routes, stops and completion by date', group: 'Operational reports' },
  { value: 'driver', label: 'Driver Report', desc: 'Per-driver activity and compliance', group: 'Operational reports' },
  { value: 'vehicle', label: 'Vehicle Report', desc: 'Vehicle usage, mileage and documents', group: 'Operational reports' },
  { value: 'client', label: 'Client Report', desc: 'Pickups and drops by client', group: 'Operational reports' },
]

const TYPE_LABEL: Record<ReportType, string> = {
  route_summary: 'Route',
  driver: 'Driver',
  vehicle: 'Vehicle',
  client: 'Client',
  month_end_billing: 'Month End Billing',
  vehicle_mileage: 'Vehicle Mileage',
  daily_logs: 'Daily Logs',
}

/** DDS retention requirement — records kept for at least 3 years. */
const RETENTION_YEARS = 3

function StatusCell({ status }: { status: GeneratedReport['status'] }) {
  if (status === 'ready') return <Badge tone="active" icon={CheckCircle2}>Ready</Badge>
  if (status === 'generating') return <Badge tone="warn" icon={Loader}>Generating…</Badge>
  if (status === 'failed') return <Badge tone="expired">Failed</Badge>
  return <Badge tone="neutral" icon={Clock}>Queued</Badge>
}

export function ReportsPage() {
  const toast = useToast()
  const { data: reports } = useReports()
  const generate = useGenerateReport()

  const [type, setType] = useState<ReportType>('route_summary')
  const [from, setFrom] = useState('2026-05-01')
  const [to, setTo] = useState('2026-06-01')
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [clientId, setClientId] = useState('')
  const [routeId, setRouteId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<GeneratedReport | null>(null)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const archive = useArchiveReports()

  const drivers = driversApi.useList({ pageSize: 200 })
  const vehicles = vehiclesApi.useList({ pageSize: 200 })
  const clients = clientsApi.useList({ pageSize: 200 })
  const routes = useRoutesList({ pageSize: 200 })

  const driverOptions = useMemo(
    () => (drivers.data?.items ?? []).map((d) => ({ value: d.id, label: d.name })),
    [drivers.data],
  )
  const vehicleOptions = useMemo(
    () => (vehicles.data?.items ?? []).map((v) => ({ value: v.id, label: `${v.registration} · ${v.make} ${v.model}` })),
    [vehicles.data],
  )
  const clientOptions = useMemo(
    () => (clients.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.uci} · ${c.name}` })),
    [clients.data],
  )
  const routeOptions = useMemo(
    () => (routes.data?.items ?? []).map((r) => ({ value: r.id, label: `${r.name} (${formatDate(r.date)})` })),
    [routes.data],
  )

  function buildFilters(format: string): Record<string, string> {
    const f: Record<string, string> = { format }
    if (type === 'driver' && driverId) f.driverId = driverId
    if (type === 'vehicle' && vehicleId) f.vehicleId = vehicleId
    if (type === 'client' && clientId) f.clientId = clientId
    if (type === 'month_end_billing' && clientId) f.clientId = clientId
    if (type === 'vehicle_mileage' && vehicleId) f.vehicleId = vehicleId
    if (type === 'route_summary') {
      if (routeId) f.routeId = routeId
      if (driverId) f.driverId = driverId
      if (vehicleId) f.vehicleId = vehicleId
    }
    return f
  }

  async function onGenerate(format: 'pdf' | 'xlsx' | 'csv') {
    await generate.mutateAsync({ type, dateFrom: from, dateTo: to, filters: buildFilters(format) })
    toast.success('Report queued', `${TYPE_LABEL[type]} report (${format.toUpperCase()}) will appear when ready.`)
  }

  const MIME: Record<'pdf' | 'csv' | 'xlsx', string> = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }

  function download(r: GeneratedReport, fmt: 'pdf' | 'csv' | 'xlsx') {
    const blob = new Blob([`Mock ${fmt.toUpperCase()} — ${TYPE_LABEL[r.type]} ${r.dateFrom}..${r.dateTo}`], {
      type: MIME[fmt],
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${r.type}-${r.dateFrom}.${fmt}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<GeneratedReport>[] = [
    { key: 'type', header: 'Type', cell: (r) => <span className="font-medium">{TYPE_LABEL[r.type]}</span> },
    { key: 'range', header: 'Date range', cell: (r) => `${formatDate(r.dateFrom)} – ${formatDate(r.dateTo)}` },
    { key: 'created', header: 'Requested', cell: (r) => <span className="text-text-muted">{formatDateTime(r.createdAt)}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusCell status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) =>
        r.status === 'ready' ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
              <FileText className="h-4 w-4" />
              Preview
            </Button>
            <Button size="sm" variant="ghost" onClick={() => download(r, 'pdf')}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => archive.mutateAsync({ ids: [r.id], archived: !r.archived })}
            >
              {r.archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Archive
                </>
              )}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-text-subtle">—</span>
        ),
    },
  ]

  const reportList = reports ?? []
  const activeReports = reportList.filter((r) => !r.archived)
  const archivedReports = reportList.filter((r) => r.archived)
  const visibleReports = tab === 'active' ? activeReports : archivedReports
  const readySelected = reportList.filter((r) => selected.includes(r.id) && r.status === 'ready')

  async function bulkArchive(toArchived: boolean) {
    if (selected.length === 0) return
    await archive.mutateAsync({ ids: selected, archived: toArchived })
    toast.success(
      toArchived ? 'Reports archived' : 'Reports restored',
      `${selected.length} report${selected.length === 1 ? '' : 's'} updated.`,
    )
    setSelected([])
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`Generate audit-ready reports. Retained for ${RETENTION_YEARS} years (DDS).`}
        actions={
          selected.length > 0 ? (
            <div className="flex gap-2">
              {readySelected.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    toast.success('ZIP export started', `${readySelected.length} reports bundled.`)
                    setSelected([])
                  }}
                >
                  <Package className="h-4 w-4" />
                  Export {readySelected.length} as ZIP
                </Button>
              )}
              {tab === 'active' ? (
                <Button variant="secondary" onClick={() => bulkArchive(true)} loading={archive.isPending}>
                  <Archive className="h-4 w-4" />
                  Archive {selected.length}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => bulkArchive(false)} loading={archive.isPending}>
                  <ArchiveRestore className="h-4 w-4" />
                  Restore {selected.length}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Retention banner — DDS regulatory requirement */}
      <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-status-info-bg bg-status-info-bg/40 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-info" aria-hidden />
        <div className="text-xs text-status-info">
          <p className="font-semibold">DDS retention: {RETENTION_YEARS} years</p>
          <p className="text-status-info/90">
            Records are retained for {RETENTION_YEARS} years. Archive older reports to keep the
            active list focused — archived reports stay downloadable for the full retention period.
          </p>
        </div>
      </div>

      {/* Quick picks — Key reports the team uses most */}
      <div className="mb-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-subtle">
          Key reports
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <QuickReportCard
            icon={CalendarDays}
            label="Daily Logs (All Routes)"
            description="Print-ready daily activity log combining every route and stop for the chosen day."
            active={type === 'daily_logs'}
            onClick={() => setType('daily_logs')}
          />
          <QuickReportCard
            icon={Receipt}
            label="Month End Billing"
            description="Per-client billing — trip count, miles and totals for the chosen month."
            active={type === 'month_end_billing'}
            onClick={() => setType('month_end_billing')}
          />
          <QuickReportCard
            icon={Gauge}
            label="Vehicle Mileage"
            description="Odometer-based mileage per vehicle for the selected window."
            active={type === 'vehicle_mileage'}
            onClick={() => setType('vehicle_mileage')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>New report</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Report type" required>
              {(f) => (
                <Combobox
                  {...f}
                  value={type}
                  onValueChange={(v) => setType((v || 'route_summary') as ReportType)}
                  clearable={false}
                  options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              )}
            </FormField>
            <p className="text-xs text-text-subtle">{TYPES.find((t) => t.value === type)?.desc}</p>

            {/* Dynamic filters per report type */}
            {type === 'daily_logs' && (
              <p className="rounded-[6px] border border-border bg-surface-hover/40 p-3 text-xs text-text-muted">
                Pick a single day below. The report bundles every route, stop, driver and event
                from that day into one printable document.
              </p>
            )}
            {type === 'month_end_billing' && (
              <FormField label="Client filter" hint="Leave blank to include every client.">
                {(f) => (
                  <Combobox {...f} value={clientId} onValueChange={setClientId} options={clientOptions} placeholder="All clients" />
                )}
              </FormField>
            )}
            {type === 'vehicle_mileage' && (
              <FormField label="Vehicle filter" hint="Leave blank to include the full fleet.">
                {(f) => (
                  <Combobox {...f} value={vehicleId} onValueChange={setVehicleId} options={vehicleOptions} placeholder="All vehicles" />
                )}
              </FormField>
            )}
            {type === 'driver' && (
              <FormField label="Driver">
                {(f) => (
                  <Combobox {...f} value={driverId} onValueChange={setDriverId} options={driverOptions} placeholder="All drivers" />
                )}
              </FormField>
            )}
            {type === 'vehicle' && (
              <FormField label="Vehicle">
                {(f) => (
                  <Combobox {...f} value={vehicleId} onValueChange={setVehicleId} options={vehicleOptions} placeholder="All vehicles" />
                )}
              </FormField>
            )}
            {type === 'client' && (
              <FormField label="Client">
                {(f) => (
                  <Combobox {...f} value={clientId} onValueChange={setClientId} options={clientOptions} placeholder="All clients" />
                )}
              </FormField>
            )}
            {type === 'route_summary' && (
              <>
                <FormField label="Route">
                  {(f) => (
                    <Combobox {...f} value={routeId} onValueChange={setRouteId} options={routeOptions} placeholder="All routes" />
                  )}
                </FormField>
                <FormField label="Driver filter">
                  {(f) => (
                    <Combobox {...f} value={driverId} onValueChange={setDriverId} options={driverOptions} placeholder="Any driver" />
                  )}
                </FormField>
                <FormField label="Vehicle filter">
                  {(f) => (
                    <Combobox {...f} value={vehicleId} onValueChange={setVehicleId} options={vehicleOptions} placeholder="Any vehicle" />
                  )}
                </FormField>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField label="From" required>
                {(f) => <Input type="date" {...f} value={from} onChange={(e) => setFrom(e.target.value)} />}
              </FormField>
              <FormField label="To" required>
                {(f) => <Input type="date" {...f} value={to} onChange={(e) => setTo(e.target.value)} />}
              </FormField>
            </div>

            <Button className="w-full" onClick={() => onGenerate('pdf')} loading={generate.isPending}>
              <FileBarChart className="h-4 w-4" />
              Generate report
            </Button>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-3">
          <div role="tablist" aria-label="Report status" className="flex gap-1 border-b border-border">
            <TabBtn label="Active" count={activeReports.length} active={tab === 'active'} onClick={() => { setTab('active'); setSelected([]) }} />
            <TabBtn label="Archived" count={archivedReports.length} active={tab === 'archived'} onClick={() => { setTab('archived'); setSelected([]) }} />
          </div>
          <DataTable
            columns={columns}
            rows={visibleReports}
            rowKey={(r) => r.id}
            selectable
            selectedKeys={selected}
            onSelectionChange={setSelected}
            emptyTitle={tab === 'archived' ? 'Nothing archived' : 'No reports yet'}
            emptyDescription={
              tab === 'archived'
                ? `Archived reports stay downloadable for ${RETENTION_YEARS} years.`
                : 'Generate your first report using the form.'
            }
          />
        </div>
      </div>

      <Modal
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        title="Report preview"
        size="lg"
        footer={
          preview && (
            <>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button onClick={() => download(preview, 'pdf')}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </>
          )
        }
      >
        {preview && (() => {
          const routesInRange = (routes.data?.items ?? []).filter(
            (r) => r.date >= preview.dateFrom && r.date <= preview.dateTo,
          )
          const clientList = clients.data?.items ?? []
          const vehicleList = vehicles.data?.items ?? []
          return (
            <div className="rounded-md border border-border bg-white p-6 text-text">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-brand text-xs font-bold text-brand-fg">N</div>
                  <span className="font-semibold">Northwind Transport Ltd</span>
                </div>
                <span className="text-xs text-text-subtle">Generated {formatDateTime(preview.createdAt)}</span>
              </div>
              <h2 className="text-base font-semibold">{TYPE_LABEL[preview.type]} Report</h2>
              <p className="text-sm text-text-muted">
                {formatDate(preview.dateFrom)} – {formatDate(preview.dateTo)}
              </p>

              {preview.type === 'month_end_billing' ? (
                <BillingPreview routes={routesInRange} clients={clientList} />
              ) : preview.type === 'vehicle_mileage' ? (
                <MileagePreview routes={routesInRange} vehicles={vehicleList} clients={clientList} />
              ) : preview.type === 'daily_logs' ? (
                <DailyLogsPreview
                  routes={routesInRange}
                  clients={clientList}
                  drivers={drivers.data?.items ?? []}
                  vehicles={vehicleList}
                />
              ) : (
                <RoutesPreview routes={routesInRange} clients={clientList} />
              )}

              <p className="mt-6 border-t border-border pt-3 text-xs text-text-subtle">
                Distance is auto-calculated from stop coordinates (haversine). Confidential · Transport Compliance Platform.
              </p>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

interface QuickReportCardProps {
  icon: typeof Receipt
  label: string
  description: string
  active: boolean
  onClick: () => void
}

function QuickReportCard({ icon: Icon, label, description, active, onClick }: QuickReportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group flex w-full items-start gap-3 rounded-[8px] border bg-card p-4 text-left transition-all hover:-translate-y-px hover:border-border-strong ' +
        (active ? 'border-brand ring-2 ring-brand/20' : 'border-border')
      }
    >
      <span
        className={
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] ' +
          (active ? 'bg-brand text-brand-fg' : 'bg-brand-100 text-brand')
        }
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-text">{label}</p>
          {active && <span className="text-xs font-medium text-brand">Selected</span>}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
    </button>
  )
}

function RoutesPreview({ routes, clients }: { routes: RoutePlan[]; clients: ClientT[] }) {
  const totalDistance = routes.reduce((sum, r) => sum + totalRouteDistanceMiles(r.stops, clients), 0)
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0)
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Tile label="Routes" value={String(routes.length)} />
        <Tile label="Stops" value={String(totalStops)} />
        <Tile label="Distance (odometer)" value={`${totalDistance.toFixed(1)}`} unit="mi" />
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-surface-hover" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    </>
  )
}

function BillingPreview({ routes, clients }: { routes: RoutePlan[]; clients: ClientT[] }) {
  // Aggregate per-client trips + miles.
  const byClient = new Map<string, { trips: number; miles: number }>()
  for (const r of routes) {
    const dist = totalRouteDistanceMiles(r.stops, clients)
    const stopsPerClient = new Map<string, number>()
    for (const s of r.stops) {
      stopsPerClient.set(s.clientId, (stopsPerClient.get(s.clientId) ?? 0) + 1)
    }
    for (const [cid, n] of stopsPerClient) {
      const prev = byClient.get(cid) ?? { trips: 0, miles: 0 }
      prev.trips += Math.ceil(n / 2) // rough: each pickup+drop = 1 trip
      prev.miles += dist / Math.max(1, stopsPerClient.size)
      byClient.set(cid, prev)
    }
  }
  const RATE_PER_MILE = 2.85
  const rows = Array.from(byClient.entries())
    .map(([cid, agg]) => {
      const client = clients.find((c) => c.id === cid)
      return {
        uci: client?.uci ?? cid,
        name: client?.name ?? '—',
        trips: agg.trips,
        miles: agg.miles,
        billed: agg.miles * RATE_PER_MILE,
      }
    })
    .sort((a, b) => b.billed - a.billed)
  const totalBilled = rows.reduce((s, r) => s + r.billed, 0)
  const totalTrips = rows.reduce((s, r) => s + r.trips, 0)
  const totalMiles = rows.reduce((s, r) => s + r.miles, 0)
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Tile label="Clients billed" value={String(rows.length)} />
        <Tile label="Total trips" value={String(totalTrips)} />
        <Tile label="Total billed" value={`$${totalBilled.toFixed(2)}`} />
      </div>
      <div className="mt-5 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-hover/60 text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-3 py-2 text-left">UCI</th>
              <th className="px-3 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-right">Trips</th>
              <th className="px-3 py-2 text-right">Miles</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-xs text-text-subtle">
                  No billable activity in this range.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.uci} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{r.uci}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.trips}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.miles.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">${r.billed.toFixed(2)}</td>
                </tr>
              ))
            )}
            {rows.length > 0 && (
              <tr className="border-t border-border bg-surface-hover/40 font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{totalTrips}</td>
                <td className="px-3 py-2 text-right tabular-nums">{totalMiles.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">${totalBilled.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-subtle">
        Billed at ${RATE_PER_MILE.toFixed(2)}/mi · final invoice format pending finance sign-off.
      </p>
    </>
  )
}

function MileagePreview({ routes, vehicles, clients }: { routes: RoutePlan[]; vehicles: Vehicle[]; clients: ClientT[] }) {
  // Sum miles per vehicle from routes in range.
  const byVehicle = new Map<string, { miles: number; trips: number }>()
  for (const r of routes) {
    const dist = totalRouteDistanceMiles(r.stops, clients)
    const prev = byVehicle.get(r.vehicleId) ?? { miles: 0, trips: 0 }
    prev.miles += dist
    prev.trips += 1
    byVehicle.set(r.vehicleId, prev)
  }
  const rows = vehicles.map((v) => {
    const agg = byVehicle.get(v.id) ?? { miles: 0, trips: 0 }
    return { v, ...agg }
  })
  const totalMiles = rows.reduce((s, r) => s + r.miles, 0)
  const fleetOdometer = vehicles.reduce((s, v) => s + (v.odometer ?? 0), 0)
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Tile label="Vehicles tracked" value={String(rows.length)} />
        <Tile label="Miles in period" value={totalMiles.toFixed(1)} unit="mi" />
        <Tile label="Fleet odometer" value={fleetOdometer.toLocaleString()} unit="mi" />
      </div>
      <div className="mt-5 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-hover/60 text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Registration</th>
              <th className="px-3 py-2 text-left">Make / Model</th>
              <th className="px-3 py-2 text-right">Trips</th>
              <th className="px-3 py-2 text-right">Miles (period)</th>
              <th className="px-3 py-2 text-right">Current odometer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.v.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{r.v.registration}</td>
                <td className="px-3 py-2">
                  {r.v.make} {r.v.model}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.trips}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.miles.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.v.odometer.toLocaleString()} mi</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-xs text-text-subtle">
                  No vehicles to report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function TabBtn({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        '-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ' +
        (active ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text')
      }
    >
      {label}
      <span
        className={
          'rounded-[2px] px-2 py-0.5 text-xs tabular-nums ' +
          (active ? 'bg-brand text-brand-fg' : 'bg-surface-hover text-text-muted')
        }
      >
        {count}
      </span>
    </button>
  )
}

import type { Driver } from '@/lib/api/types'

function DailyLogsPreview({
  routes,
  clients,
  drivers,
  vehicles,
}: {
  routes: RoutePlan[]
  clients: ClientT[]
  drivers: Driver[]
  vehicles: Vehicle[]
}) {
  const totalStops = routes.reduce((s, r) => s + r.stops.length, 0)
  const totalDistance = routes.reduce((s, r) => s + totalRouteDistanceMiles(r.stops, clients), 0)
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id
  const vehicleReg = (id: string) => vehicles.find((v) => v.id === id)?.registration ?? id
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Tile label="Routes operated" value={String(routes.length)} />
        <Tile label="Total stops" value={String(totalStops)} />
        <Tile label="Total miles" value={totalDistance.toFixed(1)} unit="mi" />
      </div>
      {routes.length === 0 ? (
        <p className="mt-5 rounded-md border border-border bg-surface-hover/40 p-4 text-center text-sm text-text-muted">
          No routes ran on this day.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {routes.map((r) => (
            <div key={r.id} className="rounded-md border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-hover/40 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-text">{r.name}</p>
                  <p className="text-xs text-text-muted">
                    {r.session} · {r.startTime} · {driverName(r.driverId)} · {vehicleReg(r.vehicleId)}
                  </p>
                </div>
                <span className="rounded-[2px] bg-card px-2 py-0.5 text-xs font-medium text-text-muted">
                  {r.stops.length} stops
                </span>
              </div>
              <table className="w-full text-xs">
                <thead className="text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Passenger</th>
                    <th className="px-3 py-2 text-left font-medium">UCI</th>
                  </tr>
                </thead>
                <tbody>
                  {r.stops.map((s, i) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-1.5 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-1.5 tabular-nums">{s.plannedTime}</td>
                      <td className="px-3 py-1.5 capitalize">{s.type}</td>
                      <td className="px-3 py-1.5">{s.clientName}</td>
                      <td className="px-3 py-1.5 font-mono">{s.clientUci}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-hover/40 p-3 text-center">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text">
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-text-subtle">{unit}</span>}
      </div>
    </div>
  )
}
