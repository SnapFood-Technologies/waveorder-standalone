import { describe, it, expect } from 'vitest'
import {
  isOrderEligibleForInternalInvoice,
  INTERNAL_INVOICE_INELIGIBLE_MESSAGE
} from '@/lib/internal-order-invoice'

describe('isOrderEligibleForInternalInvoice', () => {
  it('allows unpaid (PENDING) when order is active', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'CONFIRMED',
        paymentStatus: 'PENDING'
      })
    ).toBe(true)
  })

  it('allows PAID + typical statuses', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'DELIVERED',
        paymentStatus: 'PAID'
      })
    ).toBe(true)
  })

  it('rejects CANCELLED, RETURNED, REFUNDED order status', () => {
    for (const status of ['CANCELLED', 'RETURNED', 'REFUNDED'] as const) {
      expect(
        isOrderEligibleForInternalInvoice({
          status,
          paymentStatus: 'PAID'
        })
      ).toBe(false)
    }
  })

  it('rejects payment REFUNDED', () => {
    expect(
      isOrderEligibleForInternalInvoice({
        status: 'DELIVERED',
        paymentStatus: 'REFUNDED'
      })
    ).toBe(false)
  })

  it('exports stable error copy for API', () => {
    expect(INTERNAL_INVOICE_INELIGIBLE_MESSAGE).toContain('cancelled')
    expect(INTERNAL_INVOICE_INELIGIBLE_MESSAGE).toContain('refunded')
  })
})
