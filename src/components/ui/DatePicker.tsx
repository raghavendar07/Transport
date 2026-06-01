import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from './Input'

/**
 * Thin native date input wrapper. Native picker keeps it accessible and
 * locale-aware for Phase 1; can be upgraded to a custom calendar later
 * without changing call sites.
 */
export const DatePicker = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="date" className={cn(inputClass, className)} {...props} />
  ),
)
DatePicker.displayName = 'DatePicker'
