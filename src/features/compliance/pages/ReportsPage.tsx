import { useMemo, useState } from 'react'
import {
  FileBarChart,
  Download,
  Loader,
  Clock,
  CheckCircle2,
  FileText,
  Package,
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
import type { GeneratedReport, ReportType } from '@/lib/api/types'
import { driversApi, vehiclesApi, clientsApi } from '@/features/fleet-clients/hooks'
import { useRoutesList } from '@/features/routes-planning/hooks'
import { useReports, useGenerateReport } from '../hooks'

const TYPES: { value: ReportType; label: string; desc: string }[] = [
  { value: 'route_summary', label: 'Route Report', desc: 'Routes, stops and completion by date' },
  { value: 'driver', label: 'Driver Report', desc: 'Per-driver activity and compliance' },
  { value: 'vehicle', label: 'Vehicle Report', desc: 'Vehicle usage, mileage and documents' },
  { value: 'client', label: 'Client Report', desc: 'Pickups and drops by client' },
]

const TYPE_LABEL: Record<ReportType, string> = {
  route_summary: 'Route',
  driver: 'Driver',
  vehicle: 'Vehicle',
  client: 'Client',
}

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
            <Button size="sm" variant="ghost" onClick={() => download(r, 'xlsx')}>
              Excel
            </Button>
            <Button size="sm" variant="ghost" onClick={() => download(r, 'csv')}>
              CSV
            </Button>
          </div>
        ) : (
          <span className="text-xs text-text-subtle">—</span>
        ),
    },
  ]

  const readySelected = (reports ?? []).filter((r) => selected.includes(r.id) && r.status === 'ready')

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate audit-ready reports. Kept for 90 days."
        actions={
          readySelected.length > 0 ? (
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
          ) : undefined
        }
      />

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

        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            rows={reports ?? []}
            rowKey={(r) => r.id}
            selectable
            selectedKeys={selected}
            onSelectionChange={setSelected}
            emptyTitle="No reports yet"
            emptyDescription="Generate your first report using the form."
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
            <Button onClick={() => download(preview, 'pdf')}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )
        }
      >
        {preview && (
          <div className="rounded-md border border-border bg-white p-6 text-text">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-brand text-xs font-bold text-brand-fg">N</div>
                <span className="font-semibold">Northwind Transport Ltd</span>
              </div>
              <span className="text-xs text-text-subtle">Generated {formatDateTime(preview.createdAt)}</span>
            </div>
            <h2 className="text-lg font-semibold">{TYPE_LABEL[preview.type]} Report</h2>
            <p className="text-sm text-text-muted">
              {formatDate(preview.dateFrom)} – {formatDate(preview.dateTo)}
            </p>
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 rounded bg-surface-hover" style={{ width: `${90 - i * 12}%` }} />
              ))}
            </div>
            <p className="mt-6 border-t border-border pt-3 text-xs text-text-subtle">
              Confidential · Transport Compliance Platform
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
