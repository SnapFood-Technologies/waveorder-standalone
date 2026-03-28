import { describe, it, expect } from 'vitest'
import {
  isOrderEligibleForInternalInvoice,
  INTERNAL_INVOICE_INELIGIBLE_MESSAGE
} from '@/lib/internal-order-invoice'

describe('isOrderEligibleForInternalInvoice', () => {
  it('allows DELIVERED + PAID', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        type: 'DELIVERY'
      })
    ).toBe(true)
  })

  it('allows PICKED_UP + PAID for PICKUP', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'PICKED_UP',
        paymentStatus: 'PAID',
        type: 'PICKUP'
      })
    ).toBe(true)
  })

  it('allows PICKED_UP + PAID for DINE_IN', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'PICKED_UP',
        paymentStatus: 'PAID',
        type: 'DINE_IN'
      })
    ).toBe(true)
  })

  it('rejects when not PAID', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'DELIVERED',
        paymentStatus: 'PENDING',
        type: 'DELIVERY'
      })
    ).toBe(false)
  })

  it('rejects PICKED_UP + DELIVERY (completion for delivery is DELIVERED)', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'PICKED_UP',
        paymentStatus: 'PAID',
        type: 'DELIVERY'
      })
    ).toBe(false)
  })

  it('rejects non-terminal statuses', () => {
    for (const status of ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as const) {
      expect(
        isOrderEligibleForInternalInvoice({
          status,
          paymentStatus: 'PAID',
          type: 'DELIVERY'
        })
      ).toBe(false)
    }
  })

  it('exports stable error copy for API', () => {
    expect(INTERNAL_INVOICE_INELIGIBLE_MESSAGE).toContain('DELIVERED')
    expect(INTERNAL_INVOICE_INELIGIBLE_MESSAGE).toContain('PAID')
  })
})
