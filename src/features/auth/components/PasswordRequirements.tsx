import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const RULES: { test: (v: string) => boolean; label: string }[] = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), label: 'An uppercase letter' },
  { test: (v) => /[a-z]/.test(v), label: 'A lowercase letter' },
  { test: (v) => /[0-9]/.test(v), label: 'A number' },
]

/** Live password rule checklist — visible guidance, not placeholder-only. */
export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="space-y-1" aria-label="Password requirements">
      {RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.label} className="flex items-center gap-2 text-xs">
            {ok ? (
              <Check className="h-3.5 w-3.5 text-status-active" aria-hidden />
            ) : (
              <X className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
            )}
            <span className={cn(ok ? 'text-status-active' : 'text-text-subtle')}>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
