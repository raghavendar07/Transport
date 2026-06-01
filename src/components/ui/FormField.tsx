import { type ReactNode, useId } from 'react'
import { cn } from '@/lib/cn'

interface FormFieldProps {
  label: string
  /** Visible required marker + aria. */
  required?: boolean
  error?: string
  hint?: string
  className?: string
  /** Render prop receives the id + aria props to spread onto the control. */
  children: (field: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}

/**
 * Label + control + hint/error wrapper. Labels are ALWAYS visible (never placeholder-only)
 * and wired to the control via id for screen readers (WCAG 3.3.2).
 */
export function FormField({ label, required, error, hint, className, children }: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = cn(hint && hintId, error && errorId) || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required && (
          <span className="ml-0.5 text-status-expired" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-status-expired" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
