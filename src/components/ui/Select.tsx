import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from './Input'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  id?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  className?: string
}

/** Accessible select built on Radix, skinned to match Input. */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onValueChange, options, placeholder = 'Select…', className, ...aria }, ref) => (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(inputClass, 'flex items-center justify-between', className)}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-text-subtle" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-card shadow-pop"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  ),
)
Select.displayName = 'Select'

function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm text-text outline-none data-[highlighted]:bg-surface-hover data-[state=checked]:font-medium"
    >
      <span className="absolute left-2 inline-flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-brand" aria-hidden />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
