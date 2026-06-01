import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface CheckboxProps {
  checked?: boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean) => void
  id?: string
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={(v) => onCheckedChange?.(v === true)}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-strong bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-brand-fg">
        {checked === 'indeterminate' ? (
          <Minus className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Check className="h-3.5 w-3.5" aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)
Checkbox.displayName = 'Checkbox'
