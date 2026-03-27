import { describe, it, expect } from 'vitest'
import {
  canSubmitStorefrontOrder,
  getPrimaryStorefrontOrderBlockerForDisplay,
  formatStorefrontOrderButtonLabel,
  formatStorefrontOrderFooterHint,
  getStorefrontOrderSubmitErrorMessage,
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

  it('rejects missing customer name', () => {
    expect(canSubmitStorefrontOrder(base({ customerName: '  ' }))).toBe(false)
  })

  it('allows dine-in when same basics as pickup', () => {
    expect(canSubmitStorefrontOrder(base({ deliveryType: 'dineIn' }))).toBe(true)
  })

  it('rejects OUTSIDE_DELIVERY_AREA via canSubmit', () => {
    expect(
      canSubmitStorefrontOrder(
        base({
          deliveryType: 'delivery',
          customerAddress: 'Far',
          latitude: 1,
          longitude: 2,
          deliveryError: { type: 'OUTSIDE_DELIVERY_AREA', message: 'too far' }
        })
      )
    ).toBe(false)
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

  it('returns STORE_CLOSED', () => {
    expect(getPrimaryStorefrontOrderBlockerForDisplay(base({ isTemporarilyClosed: true }))).toBe('STORE_CLOSED')
  })

  it('returns OUTSIDE_DELIVERY_AREA before generic delivery error', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({
          deliveryType: 'delivery',
          customerAddress: 'X',
          latitude: 1,
          longitude: 2,
          deliveryError: { type: 'OUTSIDE_DELIVERY_AREA', message: 'x' }
        })
      )
    ).toBe('OUTSIDE_DELIVERY_AREA')
  })

  it('returns DELIVERY_UNAVAILABLE for non-outside delivery errors', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({
          deliveryType: 'delivery',
          customerAddress: 'X',
          latitude: 1,
          longitude: 2,
          deliveryError: { type: 'DELIVERY_NOT_AVAILABLE', message: 'n/a' }
        })
      )
    ).toBe('DELIVERY_UNAVAILABLE')
  })

  it('returns ORDER_LOADING', () => {
    expect(getPrimaryStorefrontOrderBlockerForDisplay(base({ isOrderLoading: true }))).toBe('ORDER_LOADING')
  })

  it('returns CART_EMPTY', () => {
    expect(getPrimaryStorefrontOrderBlockerForDisplay(base({ cartItemCount: 0 }))).toBe('CART_EMPTY')
  })

  it('returns MISSING_NAME_OR_PHONE', () => {
    expect(getPrimaryStorefrontOrderBlockerForDisplay(base({ customerName: '' }))).toBe('MISSING_NAME_OR_PHONE')
  })

  it('returns DELIVERY_ADDRESS_REQUIRED', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({ deliveryType: 'delivery', customerAddress: '  ', latitude: 1, longitude: 2 })
      )
    ).toBe('DELIVERY_ADDRESS_REQUIRED')
  })

  it('returns CONFIRM_DELIVERY_COORDINATES', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({
          deliveryType: 'delivery',
          customerAddress: 'Somewhere',
          latitude: null,
          longitude: null
        })
      )
    ).toBe('CONFIRM_DELIVERY_COORDINATES')
  })

  it('returns RETAIL_* in order', () => {
    const r = base({
      businessType: 'RETAIL',
      deliveryType: 'delivery',
      customerAddress: 'St',
      latitude: 1,
      longitude: 2,
      countryCode: undefined,
      city: undefined,
      postalPricingId: undefined
    })
    expect(getPrimaryStorefrontOrderBlockerForDisplay(r)).toBe('RETAIL_COUNTRY_REQUIRED')
    expect(getPrimaryStorefrontOrderBlockerForDisplay({ ...r, countryCode: 'ES' })).toBe('RETAIL_CITY_REQUIRED')
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay({ ...r, countryCode: 'ES', city: 'Madrid' })
    ).toBe('RETAIL_POSTAL_PRICING_REQUIRED')
  })

  it('returns MINIMUM_ORDER_NOT_MET', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({
          deliveryType: 'delivery',
          customerAddress: 'A',
          cartSubtotal: 5,
          minimumOrder: 20,
          latitude: 1,
          longitude: 2
        })
      )
    ).toBe('MINIMUM_ORDER_NOT_MET')
  })

  it('returns INVOICE_MINIMUM_NOT_MET before AFM when total too low', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({
          invoiceType: 'INVOICE',
          invoiceMinimumOrderValue: 100,
          cartTotal: 40,
          invoiceAfm: '123456789'
        })
      )
    ).toBe('INVOICE_MINIMUM_NOT_MET')
  })

  it('returns INVOICE_AFM_INVALID', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(
        base({ invoiceType: 'INVOICE', invoiceAfm: '12', cartTotal: 200, invoiceMinimumOrderValue: null })
      )
    ).toBe('INVOICE_AFM_INVALID')
  })

  it('returns SCHEDULE_TIME_REQUIRED', () => {
    expect(
      getPrimaryStorefrontOrderBlockerForDisplay(base({ forceScheduleMode: true, deliveryTime: 'asap' }))
    ).toBe('SCHEDULE_TIME_REQUIRED')
  })
})

const t: Record<string, string> = {
  orderViaWhatsapp: 'Order via WhatsApp',
  storeTemporarilyClosed: 'Closed',
  invalidPhone: 'Bad phone',
  minimumOrder: 'Min',
  invoiceMinimumOrderError: 'Need {amount}',
  enterValidTaxId: 'Bad AFM',
  selectTimeForSchedule: 'Pick time',
  storeClosedMessage: 'Sorry',
  clickingButton: 'Agree',
  addItemsToCart: 'Add items to cart'
}

describe('formatStorefrontOrderButtonLabel', () => {
  it('shows WhatsApp total when no blocker', () => {
    expect(formatStorefrontOrderButtonLabel(base(), t, '€')).toContain('€55.00')
    expect(formatStorefrontOrderButtonLabel(base(), t, '€')).toContain('Order via WhatsApp')
  })

  it('maps blockers to translation keys', () => {
    expect(formatStorefrontOrderButtonLabel(base({ isTemporarilyClosed: true }), t, '€')).toBe('Closed')
    expect(formatStorefrontOrderButtonLabel(base({ cartItemCount: 0 }), t, '€')).toBe('Add items to cart')
    expect(
      formatStorefrontOrderButtonLabel(
        base({
          invoiceType: 'INVOICE',
          invoiceMinimumOrderValue: 100,
          cartTotal: 40,
          invoiceAfm: '123456789'
        }),
        t,
        '€'
      )
    ).toContain('€100.00')
  })
})

describe('formatStorefrontOrderFooterHint', () => {
  it('returns closed message when store closed', () => {
    expect(formatStorefrontOrderFooterHint(base({ isTemporarilyClosed: true }), t)).toBe('Sorry')
  })

  it('returns schedule hint when schedule required', () => {
    expect(
      formatStorefrontOrderFooterHint(base({ forceScheduleMode: true, deliveryTime: 'asap' }), t)
    ).toContain('time')
  })

  it('returns default agreement when ok', () => {
    expect(formatStorefrontOrderFooterHint(base(), t)).toBe('Agree')
  })
})

describe('getStorefrontOrderSubmitErrorMessage', () => {
  it('returns mapped strings per blocker', () => {
    expect(
      getStorefrontOrderSubmitErrorMessage('PHONE_INVALID', t, {
        currencySymbol: '€',
        minimumOrder: 10
      })
    ).toBe('Bad phone')
    expect(
      getStorefrontOrderSubmitErrorMessage('MINIMUM_ORDER_NOT_MET', t, {
        currencySymbol: '€',
        minimumOrder: 25
      })
    ).toContain('25')
  })
})
