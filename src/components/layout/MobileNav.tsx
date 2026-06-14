import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter } from './SidebarFooter'

const SIDEBAR_BG = {
  fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif",
  background: 'linear-gradient(180deg, #1B1F28 0%, #171A21 40%)',
}

/** Slide-in navigation drawer for screens below the lg breakpoint (dark style). */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#2C313C] shadow-pop focus:outline-none lg:hidden"
          style={SIDEBAR_BG}
        >
          <div className="flex h-16 items-center justify-between border-b border-[#2C313C] px-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#3A5BD9] text-xs font-bold tracking-tight text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                SVS
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-white">Smart Vendor Solutions</p>
                <p className="truncate text-[10px] text-[#7E8492]">Transport Operations</p>
              </div>
            </div>
            <Dialog.Close
              className="rounded-[8px] p-1 text-[#7E8492] hover:bg-[#1F232C] hover:text-[#C7CAD2]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
          <SidebarNav onNavigate={() => onOpenChange(false)} />
          <SidebarFooter />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
