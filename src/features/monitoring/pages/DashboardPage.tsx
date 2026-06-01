import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Input } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useDashboard } from '../hooks'
import { AdminDashboard } from '../components/AdminDashboard'
import { DispatcherDashboard } from '../components/DispatcherDashboard'

const TODAY = '2026-06-01'

export function DashboardPage() {
  const { session } = useAuth()
  const [date, setDate] = useState(TODAY)
  const { data, isLoading, isFetching } = useDashboard(date)
  const isAdmin = session?.role === 'admin'

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Admin Dashboard' : 'Operations Dashboard'}
        description={
          isAdmin
            ? 'Business oversight and compliance at a glance.'
            : "Real-time view of today's operations — refreshes every 30 seconds."
        }
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-text-subtle">
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
              {isFetching ? 'Updating…' : 'Live'}
            </span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
        }
      />
      {isAdmin ? <AdminDashboard data={data} /> : <DispatcherDashboard data={data} isLoading={isLoading} />}
    </div>
  )
}
