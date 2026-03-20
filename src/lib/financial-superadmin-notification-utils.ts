/**
 * Pure helpers for SuperAdmin financial notifications (no Stripe client / Prisma).
 * planTier order must stay aligned with PLAN_HIERARCHY in lib/stripe.ts.
 */

/** Shape of Business fields used to decide if subscription alerts count as "real" revenue. */
export type BusinessFinancialAlertEligibility = {
  testMode: boolean
  isActive: boolean
  deactivatedAt: Date | null
}

/**
 * Whether SuperAdmin financial emails should fire for this account's businesses.
 * Matches Financial → Subscriptions spirit: exclude test stores, deactivated, and inactive businesses.
 * If the user has no business memberships yet (onboarding), returns true so real signups still alert.
 */
export function userQualifiesForFinancialSuperadminAlertsFromBusinesses(
  businesses: BusinessFinancialAlertEligibility[]
): boolean {
  if (businesses.length === 0) return true
  return businesses.some(
    (b) => !b.testMode && b.isActive && b.deactivatedAt == null
  )
}

const PLAN_HIERARCHY_ORDER: Record<string, number> = {
  STARTER: 1,
  PRO: 2,
  BUSINESS: 3,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeFinancialNotificationEmails(emails: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of emails) {
    const e = raw.trim().toLowerCase()
    if (!e || !EMAIL_RE.test(e) || seen.has(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

/** Start/end of calendar day in UTC for `date`. */
export function utcDayRange(date: Date): { start: Date; end: Date } {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0))
  return { start, end }
}

/** Add calendar days in UTC (preserves time-of-day). */
export function addUtcDays(from: Date, days: number): Date {
  const t = new Date(from)
  t.setUTCDate(t.getUTCDate() + days)
  return t
}

/** Compare plan tiers for upgrade/downgrade detection. */
export function planTier(plan: string): number {
  return PLAN_HIERARCHY_ORDER[plan] ?? 0
}
