/**
 * Keeps DeliveryEarning.status / settledByPaymentId aligned with DeliveryPayment.earningsIds.
 */
import type { PrismaClient } from '@prisma/client'

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export function validateAmountAdjustmentReason(reason: unknown): string | null {
  if (reason === undefined || reason === null) return 'Adjustment reason is required'
  if (typeof reason !== 'string') return 'Adjustment reason must be text'
  const t = reason.trim()
  if (t.length === 0) return 'Adjustment reason is required'
  if (t.length > 2000) return 'Adjustment reason is too long (max 2000 characters)'
  return null
}

/**
 * Replace payment.earningsIds with nextIds and update all linked earning rows.
 */
export async function syncPaymentEarningLinks(
  tx: Tx,
  payment: {
    id: string
    businessId: string
    deliveryPersonId: string
    earningsIds: string[]
  },
  nextIds: string[]
): Promise<void> {
  const prev = new Set(payment.earningsIds)
  const next = new Set(nextIds)

  for (const id of prev) {
    if (!next.has(id)) {
      await tx.deliveryEarning.updateMany({
        where: {
          id,
          businessId: payment.businessId,
          settledByPaymentId: payment.id
        },
        data: {
          status: 'PENDING',
          settledByPaymentId: null
        }
      })
    }
  }

  for (const id of next) {
    const e = await tx.deliveryEarning.findFirst({
      where: { id, businessId: payment.businessId }
    })
    if (!e) {
      throw new Error(`Earning not found: ${id}`)
    }
    if (e.deliveryPersonId !== payment.deliveryPersonId) {
      throw new Error(`Earning ${id} belongs to a different delivery person`)
    }
    if (e.status === 'CANCELLED') {
      throw new Error(`Earning ${id} is cancelled and cannot be linked`)
    }
    if (
      e.status === 'PAID' &&
      e.settledByPaymentId &&
      e.settledByPaymentId !== payment.id
    ) {
      throw new Error(`Earning ${id} is already linked to another payment`)
    }
    await tx.deliveryEarning.update({
      where: { id },
      data: {
        status: 'PAID',
        settledByPaymentId: payment.id
      }
    })
  }

  await tx.deliveryPayment.update({
    where: { id: payment.id },
    data: { earningsIds: [...next] }
  })
}
