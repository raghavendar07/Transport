/** Date / expiry helpers. Expiry math lives here and is reused by ExpiryBadge. */

export type ExpiryStatus = 'active' | 'expiring' | 'expired'

/** Days within which an expiry counts as "expiring soon" (amber). */
export const EXPIRY_WARN_DAYS = 30

/** Whole days from now until `date` (negative if past). `now` injectable for tests. */
export function daysUntil(date: string | Date, now: Date = new Date()): number {
  const target = typeof date === 'string' ? new Date(date) : date
  const ms = target.getTime() - now.getTime()
  return Math.ceil(ms / 86_400_000)
}

/**
 * Classify an expiry date into the colour-blind-safe status buckets.
 *  expired  : date in the past
 *  expiring : within EXPIRY_WARN_DAYS (inclusive)
 *  active   : further out
 */
export function expiryStatus(date: string | Date | null | undefined, now: Date = new Date()): ExpiryStatus | null {
  if (!date) return null
  const days = daysUntil(date, now)
  if (days < 0) return 'expired'
  if (days <= EXPIRY_WARN_DAYS) return 'expiring'
  return 'active'
}

/** US format: month/day/year (mm/dd/yyyy) — applied platform-wide. */
const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
const DATETIME_FMT = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return DATE_FMT.format(typeof date === 'string' ? new Date(date) : date)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return DATETIME_FMT.format(typeof date === 'string' ? new Date(date) : date)
}

/** Human countdown like "in 12 days" / "expired 3 days ago" / "today". */
export function expiryCountdown(date: string | Date | null | undefined, now: Date = new Date()): string {
  if (!date) return '—'
  const days = daysUntil(date, now)
  if (days === 0) return 'expires today'
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`
  const past = Math.abs(days)
  return `expired ${past} day${past === 1 ? '' : 's'} ago`
}
