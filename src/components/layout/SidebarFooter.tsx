import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/rbac'

const ROLE_FOOTER_LABEL: Record<Role, string> = {
  admin: 'Admin / Owner',
  dispatcher: 'Office / Dispatcher',
  driver: 'Driver',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** User profile block pinned to the bottom of the sidebar. */
export function SidebarFooter() {
  const { session } = useAuth()
  if (!session) return null

  return (
    <div className="mt-auto border-t border-[#2C313C] p-3">
      <div className="flex items-center gap-3 rounded-lg bg-[#1F232C] px-3 py-2.5">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#293140] text-xs font-semibold text-[#C7CAD2] ring-1 ring-inset ring-white/5"
          aria-hidden
        >
          {initials(session.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#E7E9EE]">{session.name}</p>
          <p className="truncate text-[11px] text-[#7E8492]">{ROLE_FOOTER_LABEL[session.role]}</p>
        </div>
      </div>
    </div>
  )
}
