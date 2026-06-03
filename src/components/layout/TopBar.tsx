import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronDown, LogOut, User as UserIcon, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/ui/Avatar'
import { SearchInput } from '@/components/domain/SearchInput'
import { RoleBadge } from '@/components/domain/RoleBadge'
import { useState } from 'react'

/** Top app bar: tenant logo + name, global search (stub), notifications bell, user menu. */
export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div className="mx-auto w-full max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search across the portal…"
          aria-label="Global search"
        />
      </div>

      <button
        type="button"
        className="relative rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label="Notifications"
        onClick={() => navigate('/notifications')}
      >
        <Bell className="h-5 w-5" aria-hidden />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-expired" aria-hidden />
      </button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="flex items-center gap-2 rounded-md p-1 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Avatar name={session?.name ?? 'User'} size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-text">{session?.name}</span>
            <span className="block text-xs leading-tight text-text-subtle">{session?.email}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-text-subtle" aria-hidden />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 w-56 rounded-md border border-border bg-card p-1 shadow-pop"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-text">{session?.name}</p>
              {session && (
                <div className="mt-1">
                  <RoleBadge role={session.role} />
                </div>
              )}
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-hover"
              onSelect={() => navigate('/account')}
            >
              <UserIcon className="h-4 w-4" aria-hidden />
              Profile & password
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-status-expired outline-none data-[highlighted]:bg-status-expired-bg"
              onSelect={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  )
}
