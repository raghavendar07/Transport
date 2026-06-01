import { describe, it, expect } from 'vitest'
import { expiryStatus, daysUntil, expiryCountdown } from '@/lib/format'

const NOW = new Date('2026-05-30T12:00:00Z')

describe('expiryStatus', () => {
  it('flags a past date as expired', () => {
    expect(expiryStatus('2026-05-01', NOW)).toBe('expired')
  })

  it('flags within 30 days (inclusive) as expiring', () => {
    expect(expiryStatus('2026-06-29', NOW)).toBe('expiring') // 30 days
    expect(expiryStatus('2026-06-01', NOW)).toBe('expiring')
  })

  it('flags beyond 30 days as active', () => {
    expect(expiryStatus('2026-12-01', NOW)).toBe('active')
  })

  it('returns null for missing dates', () => {
    expect(expiryStatus(null, NOW)).toBeNull()
    expect(expiryStatus(undefined, NOW)).toBeNull()
  })
})

describe('daysUntil', () => {
  it('is negative for past dates', () => {
    expect(daysUntil('2026-05-20', NOW)).toBeLessThan(0)
  })
})

describe('expiryCountdown', () => {
  it('reads as expired in the past', () => {
    expect(expiryCountdown('2026-05-27', NOW)).toMatch(/expired \d+ days ago/)
  })
})
