import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

/** Breadcrumb trail for detail pages. Last crumb is the current page (no link). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((crumb, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {crumb.to && !last ? (
                <Link to={crumb.to} className="text-text-muted hover:text-brand hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? 'font-medium text-text' : 'text-text-muted'} aria-current={last ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
              {!last && <ChevronRight className="h-4 w-4 text-text-subtle" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
