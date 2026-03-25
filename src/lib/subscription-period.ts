/**
 * Minimal Stripe subscription shape for period fields only.
 * (Named explicitly to avoid clashing with Prisma's `Subscription` model in TS.)
 */
export type StripeSubscriptionPeriodSource = {
  current_period_start?: number
  current_period_end?: number | null
  start_date?: number
  cancel_at?: number | null
  items?: { data?: Array<{ current_period_end?: number }> }
}

/**
 * Resolve billing period bounds from a Stripe Subscription (item fallbacks for edge cases).
 */
export function getSubscriptionPeriodBounds(
  sub: StripeSubscriptionPeriodSource
): { start: Date; end: Date } {
  const periodEndFromItem = sub.items?.data?.[0]?.current_period_end
  const startTs =
    sub.current_period_start ??
    sub.start_date ??
    Math.floor(Date.now() / 1000)
  const endTs =
    sub.current_period_end ??
    periodEndFromItem ??
    sub.cancel_at ??
    startTs + 30 * 24 * 60 * 60
  return {
    start: new Date(startTs * 1000),
    end: new Date(endTs * 1000),
  }
}
