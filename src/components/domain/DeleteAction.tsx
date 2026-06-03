import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, ConfirmDialog, useToast } from '@/components/ui'

interface Props {
  /** Human label of the row, used in aria + confirmation message. */
  itemLabel: string
  /** Async delete handler — typically the resource useRemove mutation. */
  onDelete: () => Promise<unknown>
  /** Toast shown after successful delete. */
  successMessage?: string
}

/** Row-action delete button + confirm dialog. Drop-in for DataTable rowActions. */
export function DeleteAction({ itemLabel, onDelete, successMessage = 'Deleted' }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await onDelete()
      toast.success(successMessage)
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Delete ${itemLabel}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <Trash2 className="h-4 w-4 text-status-expired" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${itemLabel}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
        onConfirm={confirm}
      />
    </>
  )
}
