/**
 * Valid affiliate earning status transitions for admin PATCH.
 * Keeps payment linkage rules in the route; this only encodes allowed state changes.
 */
export type AffiliateEarningStatus = 'PENDING' | 'PAID' | 'CANCELLED'

const ALLOWED: Record<AffiliateEarningStatus, AffiliateEarningStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PENDING', 'CANCELLED'],
  CANCELLED: ['PENDING'],
}

export function canTransitionEarningStatus(
  from: AffiliateEarningStatus,
  to: AffiliateEarningStatus
): boolean {
  if (from === to) return false
  return ALLOWED[from]?.includes(to) ?? false
}

export function assertCanTransitionEarningStatus(
  from: AffiliateEarningStatus,
  to: AffiliateEarningStatus
): void {
  if (from === to) {
    throw new Error('Status is already ' + from)
  }
  if (!canTransitionEarningStatus(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`)
  }
}
