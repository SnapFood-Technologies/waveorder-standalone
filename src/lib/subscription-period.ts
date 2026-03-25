import type Stripe from 'stripe'

/**
 * Resolve billing period bounds from a Stripe Subscription (item fallbacks for edge cases).
 */
export function getSubscriptionPeriodBounds(sub: Stripe.Subscription): { start: Date; end: Date } {
  const subAny = sub as Stripe.Subscription & {
    items?: { data?: Array<{ current_period_end?: number }> }
  }
  const periodEndFromItem = subAny.items?.data?.[0]?.current_period_end
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
