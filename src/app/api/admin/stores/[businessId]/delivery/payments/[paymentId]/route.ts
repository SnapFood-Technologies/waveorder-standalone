// PATCH delivery payment — update fields and/or linked earning IDs
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { syncPaymentEarningLinks } from '@/lib/delivery-earning-payment-sync'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; paymentId: string }> }
) {
  try {
    const { businessId, paymentId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableDeliveryManagement: true }
    })
    if (!business?.enableDeliveryManagement) {
      return NextResponse.json(
        { message: 'Delivery management is not enabled for this business.' },
        { status: 403 }
      )
    }

    const payment = await prisma.deliveryPayment.findFirst({
      where: { id: paymentId, businessId }
    })
    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      amount,
      currency,
      periodStart,
      periodEnd,
      paymentMethod,
      reference,
      notes,
      paidAt,
      earningsIds
    } = body

    const data: Record<string, unknown> = {}

    if (amount !== undefined) {
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 })
      }
      data.amount = amount
    }
    if (currency !== undefined) data.currency = currency
    if (periodStart !== undefined) data.periodStart = periodStart ? new Date(periodStart) : null
    if (periodEnd !== undefined) data.periodEnd = periodEnd ? new Date(periodEnd) : null
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod || null
    if (reference !== undefined) data.reference = reference || null
    if (notes !== undefined) data.notes = notes || null
    if (paidAt !== undefined) data.paidAt = paidAt ? new Date(paidAt) : new Date()

    const hasScalarUpdates = Object.keys(data).length > 0
    const hasEarningsUpdate = Array.isArray(earningsIds)

    if (!hasScalarUpdates && !hasEarningsUpdate) {
      return NextResponse.json(
        { message: 'No updates provided' },
        { status: 400 }
      )
    }

    if (hasEarningsUpdate) {
      const ids = earningsIds as string[]
      try {
        await prisma.$transaction(async (tx) => {
          if (hasScalarUpdates) {
            await tx.deliveryPayment.update({
              where: { id: paymentId },
              data: data as any
            })
          }
          const fresh = await tx.deliveryPayment.findFirst({
            where: { id: paymentId, businessId }
          })
          if (!fresh) throw new Error('Payment missing')
          await syncPaymentEarningLinks(
            tx,
            {
              id: fresh.id,
              businessId,
              deliveryPersonId: fresh.deliveryPersonId,
              earningsIds: fresh.earningsIds
            },
            ids
          )
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update linked earnings'
        return NextResponse.json({ message: msg }, { status: 400 })
      }
    } else if (hasScalarUpdates) {
      await prisma.deliveryPayment.update({
        where: { id: paymentId },
        data: data as any
      })
    }

    const updated = await prisma.deliveryPayment.findFirst({
      where: { id: paymentId, businessId },
      include: {
        deliveryPerson: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json({ success: true, payment: updated })
  } catch (error) {
    console.error('PATCH delivery payment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
