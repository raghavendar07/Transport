import { NavLink } from 'react-router-dom'
import { getNavSections } from '@/lib/nav'
import { useAuth } from '@/lib/auth'
import { can } from '@/lib/rbac'
import { cn } from '@/lib/cn'

/** Role-specific navigation, shared by the desktop sidebar and mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAuth()
  const role = session?.role

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Primary">
      {getNavSections(role).map((section, i) => {
        const items = section.items.filter((item) => !item.permission || can(role, item.permission))
        if (items.length === 0) return null
        return (
          <div key={i}>
            {section.title && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E8492]">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} onClick={onNavigate} className="block">
                    {({ isActive }) => (
                      <span
                        className={cn(
                          'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-[#293140] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                            : 'text-[#C7CAD2] hover:bg-[#1F232C]',
                        )}
                      >
                        {isActive && (
                          <span
                            className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#3A5BD9]"
                            aria-hidden
                          />
                        )}
                        <item.icon
                          className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-[#7E8492]')}
                          aria-hidden
                        />
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
