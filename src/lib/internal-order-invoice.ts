/**
 * Internal invoice (OrderInvoice) — eligibility rules shared by API + admin UI.
 * PRD: only completed + paid orders; non-tax internal document.
 */

import type { OrderStatus, OrderType, PaymentStatus } from '@prisma/client'

export const INTERNAL_INVOICE_INELIGIBLE_MESSAGE =
  'Invoice can only be generated for completed, paid orders (DELIVERED or PICKED_UP + PAID)'

/** True when order may receive an internal invoice: PAID and terminal completion per order type. */
export function isOrderEligibleForInternalInvoice(order: {
  status: OrderStatus
  paymentStatus: PaymentStatus
  type: OrderType
}): boolean {
  if (order.paymentStatus !== 'PAID') return false
  if (order.status === 'DELIVERED') return true
  if (
    order.status === 'PICKED_UP' &&
    (order.type === 'PICKUP' || order.type === 'DINE_IN')
  ) {
    return true
  }
  return false
}
