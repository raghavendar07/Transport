import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog, useToast } from '@/components/ui'

interface Props {
  /** Human label for aria + confirmation copy. */
  itemLabel: string
  onEdit: () => void
  onDelete: () => Promise<unknown>
  /** Toast shown after successful delete. */
  deleteSuccessMessage?: string
  /** Extra menu items rendered between Edit and Delete. */
  extraItems?: { label: string; icon?: React.ReactNode; onSelect: () => void }[]
}

/** Three-dot kebab menu with Edit + Delete (and optional extra items). */
export function RowActionsMenu({
  itemLabel,
  onEdit,
  onDelete,
  deleteSuccessMessage = 'Deleted',
  extraItems,
}: Props) {
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await onDelete()
      toast.success(deleteSuccessMessage)
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${itemLabel}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-subtle hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
            className="z-50 w-40 rounded-md border border-border bg-card p-1 shadow-pop"
          >
            <DropdownMenu.Item
              onSelect={onEdit}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-hover"
            >
              <Pencil className="h-4 w-4 text-text-subtle" aria-hidden />
              Edit
            </DropdownMenu.Item>
            {extraItems?.map((it) => (
              <DropdownMenu.Item
                key={it.label}
                onSelect={it.onSelect}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-hover"
              >
                {it.icon}
                {it.label}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              onSelect={() => setConfirmOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-status-expired outline-none data-[highlighted]:bg-status-expired-bg"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
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
