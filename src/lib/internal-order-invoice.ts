/**
 * Internal invoice (OrderInvoice) — eligibility rules shared by API + admin UI.
 * Non-tax internal document: allow for any order except blocked statuses; payment need not be PAID.
 */

import type { OrderStatus, PaymentStatus } from '@prisma/client'

/** Order cannot receive an internal invoice in these statuses. */
const BLOCKED_ORDER_STATUSES_FOR_INTERNAL_INVOICE: OrderStatus[] = [
  'CANCELLED',
  'RETURNED',
  'REFUNDED'
]

export const INTERNAL_INVOICE_INELIGIBLE_MESSAGE =
  'Invoice cannot be generated for cancelled, returned, or refunded orders, or when payment is refunded'

/** True when order may receive an internal invoice (UI + API). */
export function isOrderEligibleForInternalInvoice(order: {
  status: OrderStatus
  paymentStatus: PaymentStatus
}): boolean {
  if (BLOCKED_ORDER_STATUSES_FOR_INTERNAL_INVOICE.includes(order.status)) return false
  if (order.paymentStatus === 'REFUNDED') return false
  return true
}
