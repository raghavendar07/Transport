import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField, Textarea } from '@/components/ui'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: string
  loading?: boolean
  onConfirm: (reason: string) => void
}

/** Cancellation with a MANDATORY reason note (route or single stop). */
export function CancelReasonDialog({ open, onOpenChange, title, description, loading, onConfirm }: Props) {
  const [reason, setReason] = useState('')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason('')
        onOpenChange(o)
      }}
      title={title}
      description={description}
      variant="danger"
      confirmLabel="Confirm cancellation"
      loading={loading}
      confirmDisabled={reason.trim().length < 3}
      onConfirm={() => {
        onConfirm(reason)
        setReason('')
      }}
    >
      <FormField label="Reason" required hint="Required — recorded in the audit log">
        {(f) => <Textarea {...f} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this is being cancelled…" />}
      </FormField>
    </ConfirmDialog>
  )
}
