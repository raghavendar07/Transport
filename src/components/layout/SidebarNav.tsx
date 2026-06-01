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
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Primary">
      {getNavSections(role).map((section, i) => {
        const items = section.items.filter((item) => !item.permission || can(role, item.permission))
        if (items.length === 0) return null
        return (
          <div key={i}>
            {section.title && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-text-muted hover:bg-surface-hover hover:text-text',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" aria-hidden />
                    {item.label}
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
