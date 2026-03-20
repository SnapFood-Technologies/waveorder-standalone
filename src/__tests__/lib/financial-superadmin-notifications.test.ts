import { describe, it, expect } from 'vitest'
import {
  normalizeFinancialNotificationEmails,
  utcDayRange,
  addUtcDays,
  planTier,
  userQualifiesForFinancialSuperadminAlertsFromBusinesses,
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

const live = { testMode: false, isActive: true, deactivatedAt: null as Date | null }

describe('userQualifiesForFinancialSuperadminAlertsFromBusinesses', () => {
  it('allows when user has no businesses yet (onboarding)', () => {
    expect(userQualifiesForFinancialSuperadminAlertsFromBusinesses([])).toBe(true)
  })

  it('rejects when all linked businesses are test', () => {
    expect(
      userQualifiesForFinancialSuperadminAlertsFromBusinesses([
        { testMode: true, isActive: true, deactivatedAt: null },
      ])
    ).toBe(false)
  })

  it('rejects when all are deactivated or inactive', () => {
    expect(
      userQualifiesForFinancialSuperadminAlertsFromBusinesses([
        { testMode: false, isActive: false, deactivatedAt: null },
        { testMode: false, isActive: true, deactivatedAt: new Date() },
      ])
    ).toBe(false)
  })

  it('allows if any business is live (non-test, active, not deactivated)', () => {
    expect(
      userQualifiesForFinancialSuperadminAlertsFromBusinesses([
        { testMode: true, isActive: true, deactivatedAt: null },
        live,
      ])
    ).toBe(true)
  })
})
