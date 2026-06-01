import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'
import { SessionExpiredModal } from '@/features/auth/components/SessionExpiredModal'

/** Authenticated layout: persistent sidebar + top bar + scrollable content. */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <MobileNav open={navOpen} onOpenChange={setNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <SessionExpiredModal />
    </div>
  )
}
