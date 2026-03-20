import { describe, it, expect } from 'vitest'
import {
  normalizeFinancialNotificationEmails,
  utcDayRange,
  addUtcDays,
  planTier,
} from '@/lib/financial-superadmin-notification-utils'

describe('normalizeFinancialNotificationEmails', () => {
  it('trims, lowercases, dedupes, validates', () => {
    expect(
      normalizeFinancialNotificationEmails(['  A@B.COM ', 'a@b.com', 'not-an-email', 'c@d.com'])
    ).toEqual(['a@b.com', 'c@d.com'])
  })

  it('returns empty for invalid list', () => {
    expect(normalizeFinancialNotificationEmails(['bad', ''])).toEqual([])
  })
})

describe('utcDayRange', () => {
  it('returns UTC midnight to midnight for a date', () => {
    const d = new Date(Date.UTC(2026, 2, 15, 14, 30, 0))
    const { start, end } = utcDayRange(d)
    expect(start.toISOString()).toBe('2026-03-15T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-03-16T00:00:00.000Z')
  })
})

describe('addUtcDays', () => {
  it('adds calendar days in UTC', () => {
    const from = new Date(Date.UTC(2026, 0, 28, 12, 0, 0))
    const out = addUtcDays(from, 3)
    expect(out.toISOString()).toBe('2026-01-31T12:00:00.000Z')
  })
})

describe('planTier', () => {
  it('orders STARTER < PRO < BUSINESS', () => {
    expect(planTier('STARTER')).toBeLessThan(planTier('PRO'))
    expect(planTier('PRO')).toBeLessThan(planTier('BUSINESS'))
  })
})
