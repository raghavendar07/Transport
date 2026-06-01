import { SidebarNav } from './SidebarNav'

/** Persistent desktop sidebar (hidden on small screens — see MobileNav). */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-fg">
          T
        </div>
        <span className="text-sm font-semibold text-text">Transport</span>
      </div>
      <SidebarNav />
    </aside>
  )
}
