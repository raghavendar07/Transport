import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-text transition-colors placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-surface-hover disabled:opacity-60 aria-[invalid=true]:border-status-expired aria-[invalid=true]:ring-status-expired'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  ),
)
Input.displayName = 'Input'
