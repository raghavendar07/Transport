import { useState } from 'react'
import { Plus, Paperclip, FileText, Trash2, Download, Upload } from 'lucide-react'
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
  FileUpload,
  useToast,
} from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import type { Vehicle, VehicleAttachment } from '@/lib/api/types'
import { vehiclesApi } from '../hooks'

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  vehicle: Vehicle
}

export function VehicleAttachmentsSection({ vehicle }: Props) {
  const toast = useToast()
  const update = vehiclesApi.useUpdate()
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VehicleAttachment | null>(null)

  const attachments = [...(vehicle.attachments ?? [])].sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt),
  )

  async function addAttachment(att: Omit<VehicleAttachment, 'id' | 'uploadedAt'>) {
    const next: VehicleAttachment = {
      ...att,
      id: `a-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    }
    await update.mutateAsync({
      id: vehicle.id,
      data: { ...vehicle, attachments: [...(vehicle.attachments ?? []), next] },
    })
    toast.success('Document attached')
    setOpen(false)
  }

  async function removeAttachment(id: string) {
    await update.mutateAsync({
      id: vehicle.id,
      data: {
        ...vehicle,
        attachments: (vehicle.attachments ?? []).filter((a) => a.id !== id),
      },
    })
    toast.success('Attachment removed')
    setDeleteTarget(null)
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-brand-100 text-brand">
            <Paperclip className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardTitle>Additional Documents</CardTitle>
            <p className="text-xs text-text-subtle">
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'} · pertinent info / extras
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add document
        </Button>
      </CardHeader>
      <CardBody>
        {attachments.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="No additional documents"
            description="Attach any pertinent information — warranties, quotes, service contracts, photos."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Add first document
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {attachments.map((att) => (
              <li key={att.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-surface-hover text-text-muted">
                  <FileText className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{att.label}</p>
                  <p className="truncate text-xs text-text-muted">
                    {att.fileName} · {readableSize(att.fileSize)} · {formatDateTime(att.uploadedAt)}
                  </p>
                  {att.notes && <p className="mt-1 text-xs text-text-muted">{att.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Download ${att.fileName}`}
                    onClick={() => toast.success('Download started', att.fileName)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-text-subtle hover:bg-surface-hover hover:text-text"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${att.label}`}
                    onClick={() => setDeleteTarget(att)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-text-subtle hover:bg-status-expired-bg hover:text-status-expired"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <AddAttachmentDrawer
        open={open}
        onOpenChange={setOpen}
        onSubmit={addAttachment}
        submitting={update.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.label}?`}
        description="This attachment will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        loading={update.isPending}
        onConfirm={() => deleteTarget && removeAttachment(deleteTarget.id)}
      />
    </Card>
  )
}

interface AddDrawerProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (att: Omit<VehicleAttachment, 'id' | 'uploadedAt'>) => void
  submitting: boolean
}

function AddAttachmentDrawer({ open, onOpenChange, onSubmit, submitting }: AddDrawerProps) {
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  function reset() {
    setLabel('')
    setNotes('')
    setFile(null)
  }

  function handleSubmit() {
    if (!label.trim() || !file) return
    onSubmit({
      label: label.trim(),
      notes: notes.trim() || undefined,
      fileName: file.name,
      fileSize: file.size,
    })
    reset()
  }

  const valid = !!label.trim() && !!file

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
      title="Attach additional document"
      description="Upload any pertinent file — warranty, quote, contract, photo, anything that belongs on this vehicle's record."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!valid}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Label" required hint="Short description shown in the document list.">
          {(f) => (
            <Input
              {...f}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Warranty info / Body shop quote / Owner's manual…"
              autoFocus
            />
          )}
        </FormField>
        <FormField label="File" required>
          {() => <FileUpload value={file} onChange={setFile} />}
        </FormField>
        <FormField label="Notes">
          {(f) => (
            <Textarea
              {...f}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context — expiry, supplier, reference number…"
            />
          )}
        </FormField>
      </div>
    </Modal>
  )
}
