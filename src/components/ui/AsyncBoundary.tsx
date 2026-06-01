import { type ReactNode } from 'react'
import { Spinner } from './Spinner'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

interface AsyncBoundaryProps<T> {
  /** TanStack Query-ish status flags. */
  isLoading: boolean
  isError: boolean
  data: T | undefined
  onRetry?: () => void
  /** Treat this as empty (overrides default array-length check). */
  isEmpty?: (data: T) => boolean
  loadingFallback?: ReactNode
  emptyFallback?: ReactNode
  children: (data: T) => ReactNode
}

/**
 * Wraps a query result and renders the right state: loading → error → empty → content.
 * Keeps every data screen's state handling consistent.
 */
export function AsyncBoundary<T>({
  isLoading,
  isError,
  data,
  onRetry,
  isEmpty,
  loadingFallback,
  emptyFallback,
  children,
}: AsyncBoundaryProps<T>) {
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )
    )
  }
  if (isError || data === undefined) {
    return <ErrorState onRetry={onRetry} />
  }
  const empty = isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0
  if (empty) {
    return emptyFallback ?? <EmptyState title="Nothing here yet" />
  }
  return <>{children(data)}</>
}
