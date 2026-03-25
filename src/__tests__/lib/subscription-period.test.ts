import { describe, it, expect } from 'vitest'
import { getSubscriptionPeriodBounds } from '@/lib/subscription-period'
import type Stripe from 'stripe'

describe('getSubscriptionPeriodBounds', () => {
  it('uses subscription current_period_start and current_period_end', () => {
    const sub = {
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      start_date: 1_699_000_000,
      items: { data: [] },
    } as unknown as Stripe.Subscription
    const { start, end } = getSubscriptionPeriodBounds(sub)
    expect(start.getTime()).toBe(1_700_000_000_000)
    expect(end.getTime()).toBe(1_700_086_400_000)
  })

  it('falls back to first item current_period_end when subscription end missing', () => {
    const sub = {
      current_period_start: 1_700_000_000,
      current_period_end: undefined,
      start_date: 1_700_000_000,
      items: { data: [{ current_period_end: 1_700_259_200 }] },
    } as unknown as Stripe.Subscription
    const { end } = getSubscriptionPeriodBounds(sub)
    expect(end.getTime()).toBe(1_700_259_200_000)
  })
})
