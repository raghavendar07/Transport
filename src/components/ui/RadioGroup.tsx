import * as RadioPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/cn'

export interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  options: RadioOption[]
  name?: string
  className?: string
}

export function RadioGroup({ value, onValueChange, options, name, className }: RadioGroupProps) {
  return (
    <RadioPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      name={name}
      className={cn('flex flex-col gap-2', className)}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-surface-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
        >
          <RadioPrimitive.Item
            value={opt.value}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-card data-[state=checked]:border-brand focus-visible:outline-none"
          >
            <RadioPrimitive.Indicator className="h-2.5 w-2.5 rounded-full bg-brand" />
          </RadioPrimitive.Item>
          <span>
            <span className="block text-sm font-medium text-text">{opt.label}</span>
            {opt.description && (
              <span className="block text-xs text-text-subtle">{opt.description}</span>
            )}
          </span>
        </label>
      ))}
    </RadioPrimitive.Root>
  )
}
