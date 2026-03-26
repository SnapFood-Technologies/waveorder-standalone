import { describe, it, expect } from 'vitest'
import {
  canSubmitStorefrontOrder,
  getPrimaryStorefrontOrderBlockerForDisplay,
  type StorefrontOrderValidationContext
} from '@/lib/storefront-order-validation'

function base(over: Partial<StorefrontOrderValidationContext> = {}): StorefrontOrderValidationContext {
  return {
    isTemporarilyClosed: false,
    cartItemCount: 1,
    cartSubtotal: 50,
    cartTotal: 55,
    minimumOrder: 10,
    businessType: 'FOOD',
    deliveryType: 'pickup',
    isOrderLoading: false,
    forceScheduleMode: false,
    storeIsOpen: true,
    deliveryError: null,
    customerName: 'Jane',
    customerPhone: '+306912345678',
    invoiceType: '',
    invoiceAfm: undefined,
    invoiceMinimumOrderValue: null,
    customerAddress: '',
    latitude: null,
    longitude: null,
    deliveryTime: 'asap',
    countryCode: undefined,
    city: undefined,
    postalPricingId: undefined,
    ...over
  }
}

describe('canSubmitStorefrontOrder', () => {
  it('rejects when store closed', () => {
    expect(canSubmitStorefrontOrder(base({ isTemporarilyClosed: true }))).toBe(false)
  })

  it('rejects empty cart', () => {
    expect(canSubmitStorefrontOrder(base({ cartItemCount: 0 }))).toBe(false)
  })

  it('rejects invalid phone', () => {
    expect(canSubmitStorefrontOrder(base({ customerPhone: '+30' }))).toBe(false)
  })

  it('allows pickup when basics ok', () => {
    expect(canSubmitStorefrontOrder(base())).toBe(true)
  })

  it('requires delivery address and coords for non-RETAIL delivery', () => {
    const d = base({
      deliveryType: 'delivery',
      customerAddress: 'Somewhere',
      cartSubtotal: 50,
      latitude: null,
      longitude: null
    })
    expect(canSubmitStorefrontOrder(d)).toBe(false)
    expect(canSubmitStorefrontOrder({ ...d, latitude: 37.9, longitude: 23.7 })).toBe(true)
  })

  it('requires RETAIL country, city, postal pricing for delivery', () => {
    const r = base({
      businessType: 'RETAIL',
      deliveryType: 'delivery',
      customerAddress: 'Street 1',
      cartSubtotal: 50,
      countryCode: undefined,
      city: undefined,
      postalPricingId: undefined
    })
    expect(canSubmitStorefrontOrder(r)).toBe(false)
    expect(
      canSubmitStorefrontOrder({
        ...r,
        countryCode: 'ES',
        city: 'Madrid',
        postalPricingId: 'pp_1'
      })
    ).toBe(true)
  })

  it('blocks delivery below minimum unless deliveryError set', () => {
    const low = base({
      deliveryType: 'delivery',
      customerAddress: 'A',
      cartSubtotal: 5,
      minimumOrder: 20,
      latitude: 1,
      longitude: 2
    })
    expect(canSubmitStorefrontOrder(low)).toBe(false)
    expect(
      canSubmitStorefrontOrder({
        ...low,
        deliveryError: { type: 'DELIVERY_NOT_AVAILABLE', message: 'x' }
      })
    ).toBe(true)
  })

  it('validates invoice AFM and minimum', () => {
    const inv = base({
      invoiceType: 'INVOICE',
      invoiceAfm: '123',
      invoiceMinimumOrderValue: 100,
      cartTotal: 50
    })
    expect(canSubmitStorefrontOrder(inv)).toBe(false)
    expect(
      canSubmitStorefrontOrder({
        ...inv,
        invoiceAfm: '123456789',
        cartTotal: 100
      })
    ).toBe(true)
  })

  it('requires schedule time when forceScheduleMode', () => {
    const s = base({ forceScheduleMode: true, deliveryTime: 'asap' })
    expect(canSubmitStorefrontOrder(s)).toBe(false)
    expect(canSubmitStorefrontOrder({ ...s, deliveryTime: '2026-03-26T12:00:00.000Z' })).toBe(true)
  })
})

describe('getPrimaryStorefrontOrderBlockerForDisplay', () => {
  it('returns null when order can submit', () => {
    expect(getPrimaryStorefrontOrderBlockerForDisplay(base())).toBe(null)
  })

  it('returns PHONE_INVALID before address when phone incomplete', () => {
    const b = base({
      deliveryType: 'delivery',
      customerPhone: '+34',
      customerAddress: ''
    })
    expect(getPrimaryStorefrontOrderBlockerForDisplay(b)).toBe('PHONE_INVALID')
  })
})
