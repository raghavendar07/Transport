import { useState } from 'react'
import { Plus, Wrench, Calendar, Gauge, FileText, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Modal,
  FormField,
  Input,
  Textarea,
  EmptyState,
  ConfirmDialog,
  useToast,
} from '@/components/ui'
import { formatDate } from '@/lib/format'
import type { MaintenanceLog, Vehicle } from '@/lib/api/types'
import { vehiclesApi } from '../hooks'

/** Preset suggestions — operators can also type their own custom type. */
const PRESET_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Tune-up',
  'Transmission Service',
  'Coolant Flush',
  'Battery Replacement',
  'Lift Maintenance',
  'Wheelchair Restraint Check',
  'Inspection',
  'Engine Diagnostic',
  'AC Service',
]

interface Props {
  vehicle: Vehicle
}

export function MaintenanceLogsSection({ vehicle }: Props) {
  const toast = useToast()
  const update = vehiclesApi.useUpdate()
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceLog | null>(null)

  const logs = [...(vehicle.maintenanceLogs ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  async function addLog(log: Omit<MaintenanceLog, 'id'>) {
    const next: MaintenanceLog = { ...log, id: `m-${Date.now()}` }
    await update.mutateAsync({
      id: vehicle.id,
      data: { ...vehicle, maintenanceLogs: [...(vehicle.maintenanceLogs ?? []), next] },
    })
    toast.success('Maintenance log added')
    setOpen(false)
  }

  async function removeLog(id: string) {
    await update.mutateAsync({
      id: vehicle.id,
      data: {
        ...vehicle,
        maintenanceLogs: (vehicle.maintenanceLogs ?? []).filter((l) => l.id !== id),
      },
    })
    toast.success('Log removed')
    setDeleteTarget(null)
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-brand-100 text-brand">
            <Wrench className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardTitle>Maintenance Logs</CardTitle>
            <p className="text-xs text-text-subtle">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'} · sorted newest first
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add log
        </Button>
      </CardHeader>
      <CardBody>
        {logs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance logged yet"
            description="Record oil changes, lift maintenance, inspections, and any custom service."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Add first log
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[8px] border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover/40 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Mileage</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">File</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-text">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Calendar className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                        {formatDate(log.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-text">{log.type}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Gauge className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
                        {log.mileage.toLocaleString()} mi
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{log.notes || '—'}</td>
                    <td className="px-4 py-3">
                      {log.fileName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-brand">
                          <FileText className="h-3.5 w-3.5" aria-hidden />
                          {log.fileName}
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Delete ${log.type}`}
                        onClick={() => setDeleteTarget(log)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-text-subtle hover:bg-status-expired-bg hover:text-status-expired"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>

      <AddLogDrawer
        open={open}
        onOpenChange={setOpen}
        onSubmit={addLog}
        currentOdometer={vehicle.odometer}
        existingTypes={Array.from(new Set(logs.map((l) => l.type)))}
        submitting={update.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type} log?`}
        description="This maintenance entry will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        loading={update.isPending}
        onConfirm={() => deleteTarget && removeLog(deleteTarget.id)}
      />
    </Card>
  )
}

interface AddLogDrawerProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (log: Omit<MaintenanceLog, 'id'>) => void
  currentOdometer: number
  existingTypes: string[]
  submitting: boolean
}

function AddLogDrawer({ open, onOpenChange, onSubmit, currentOdometer, existingTypes, submitting }: AddLogDrawerProps) {
  const [type, setType] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [mileage, setMileage] = useState(currentOdometer)
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState<string>('')

  function reset() {
    setType('')
    setDate(new Date().toISOString().slice(0, 10))
    setMileage(currentOdometer)
    setNotes('')
    setFileName('')
  }

  function handleSubmit() {
    onSubmit({
      type: type.trim(),
      date,
      mileage,
      notes: notes.trim() || undefined,
      fileName: fileName.trim() || null,
    })
    reset()
  }

  // Merge preset + types already seen on this vehicle so historical custom types stay suggestible.
  const typeOptions = Array.from(new Set([...PRESET_TYPES, ...existingTypes]))

  const valid = !!type.trim() && !!date && mileage > 0

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
      title="Add maintenance log"
      description="Record a service entry — pick a preset type or type your own."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!valid}>
            <Plus className="h-4 w-4" />
            Add log
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Maintenance type" required hint="Pick a preset or type a custom value like 'Lift Maintenance'.">
          {(f) => (
            <>
              <Input
                {...f}
                list="maintenance-types"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Oil Change, Lift Maintenance, Tune-up…"
              />
              <datalist id="maintenance-types">
                {typeOptions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" required>
            {(f) => (
              <Input {...f} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            )}
          </FormField>
          <FormField label="Mileage (mi)" required hint={`Current odometer: ${currentOdometer.toLocaleString()} mi`}>
            {(f) => (
              <Input
                {...f}
                type="number"
                min={0}
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
              />
            )}
          </FormField>
        </div>

        <FormField label="Notes">
          {(f) => (
            <Textarea
              {...f}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was done, parts used, technician name…"
            />
          )}
        </FormField>

        <FormField label="Invoice / report file" hint="Optional — paste the uploaded file name (e.g. invoice-may26.pdf).">
          {(f) => (
            <Input
              {...f}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="invoice.pdf"
            />
          )}
        </FormField>
      </div>
    </Modal>
  )
}
