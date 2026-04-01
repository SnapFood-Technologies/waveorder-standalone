import { describe, expect, it } from 'vitest'
import { stripeSubscriptionHasHolaEntitlement } from '@/lib/holaora-entitlement-sync'
import type Stripe from 'stripe'

function sub(
  status: Stripe.Subscription.Status,
  priceIds: string[]
): Parameters<typeof stripeSubscriptionHasHolaEntitlement>[0] {
  return {
    id: 'sub_test',
    status,
    items: {
      data: priceIds.map((id) => ({
        price: { id },
      })),
    } as Stripe.Subscription['items'],
  }
}

describe('stripeSubscriptionHasHolaEntitlement', () => {
  it('returns false when entitlement list is empty', () => {
    expect(stripeSubscriptionHasHolaEntitlement(sub('active', ['price_a']), [])).toBe(false)
  })

  it('returns false when status is not active or trialing', () => {
    expect(
      stripeSubscriptionHasHolaEntitlement(sub('canceled', ['price_x']), ['price_x'])
    ).toBe(false)
  })

  it('returns true when active and any line item matches', () => {
    expect(
      stripeSubscriptionHasHolaEntitlement(sub('active', ['price_other', 'price_hola']), [
        'price_hola',
      ])
    ).toBe(true)
  })

  it('returns true for trialing', () => {
    expect(
      stripeSubscriptionHasHolaEntitlement(sub('trialing', ['price_bundle']), ['price_bundle'])
    ).toBe(true)
  })
})
