import { Construction } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

/** Temporary page for features not yet built. Replaced as each phase lands. */
export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <EmptyState
          icon={Construction}
          title={`${title} — coming in ${phase}`}
          description="This screen is part of a later build phase. Navigation, layout shell, and access control are wired."
        />
      </Card>
    </div>
  )
}
