import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'w-full sm:max-w-md',
  md: 'w-full sm:max-w-lg',
  lg: 'w-full sm:max-w-2xl',
  xl: 'w-full sm:max-w-4xl',
}

/**
 * Side-drawer dialog — slides in from the right.
 * Accessible: focus trap, Esc to close, labelled title/description.
 */
export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className={cn(
            'drawer-content fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-card shadow-pop focus:outline-none',
            SIZE[size],
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-text">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-[8px] p-1 text-text-subtle hover:bg-surface-hover hover:text-text"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-4">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
