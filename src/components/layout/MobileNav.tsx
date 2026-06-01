import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { SidebarNav } from './SidebarNav'

/** Slide-in navigation drawer for screens below the lg breakpoint. */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-pop focus:outline-none lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-fg">
                T
              </div>
              <span className="text-sm font-semibold text-text">Transport</span>
            </div>
            <Dialog.Close className="rounded-md p-1 text-text-subtle hover:bg-surface-hover" aria-label="Close menu">
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
          <SidebarNav onNavigate={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
