import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'active' | 'warn' | 'expired' | 'info' | 'neutral'

const TONE: Record<BadgeTone, string> = {
  active: 'bg-status-active-bg text-status-active',
  warn: 'bg-status-warn-bg text-status-warn',
  expired: 'bg-status-expired-bg text-status-expired',
  info: 'bg-status-info-bg text-status-info',
  neutral: 'bg-status-neutral-bg text-status-neutral',
}

interface BadgeProps {
  tone?: BadgeTone
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

/**
 * Base badge. Colour is NEVER the sole signal — callers pass an icon + text label
 * so status is distinguishable for colour-blind users (WCAG 1.4.1).
 */
export function Badge({ tone = 'neutral', icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] px-[8px] py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  )
}
