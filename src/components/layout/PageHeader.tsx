import { type ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  /** Right-aligned actions (e.g. "Add driver" button). */
  actions?: ReactNode
}

/** Consistent page title block: breadcrumbs + heading + description + actions. */
export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">{title}</h1>
          {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
