// PATCH delivery earning: adjust amount (reason required) or link/unlink payment
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import {
  syncPaymentEarningLinks,
  validateAmountAdjustmentReason
} from '@/lib/delivery-earning-payment-sync'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; earningId: string }> }
) {
  try {
    const { businessId, earningId } = await params

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

    const earning = await prisma.deliveryEarning.findFirst({
      where: { id: earningId, businessId }
    })
    if (!earning) {
      return NextResponse.json({ message: 'Earning not found' }, { status: 404 })
    }

    const body = await request.json()

    if (body.unlinkPayment === true) {
      if (earning.status !== 'PAID' || !earning.settledByPaymentId) {
        return NextResponse.json(
          { message: 'This earning is not linked to a payment' },
          { status: 400 }
        )
      }
      try {
        await prisma.$transaction(async (tx) => {
          const pay = await tx.deliveryPayment.findFirst({
            where: { id: earning.settledByPaymentId!, businessId }
          })
          if (!pay) {
            throw new Error('Payment not found')
          }
          const nextIds = pay.earningsIds.filter((id) => id !== earningId)
          await syncPaymentEarningLinks(
            tx,
            {
              id: pay.id,
              businessId,
              deliveryPersonId: pay.deliveryPersonId,
              earningsIds: pay.earningsIds
            },
            nextIds
          )
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to unlink'
        return NextResponse.json({ message: msg }, { status: 400 })
      }

      const updated = await prisma.deliveryEarning.findUnique({
        where: { id: earningId },
        include: {
          order: { select: { orderNumber: true, status: true, deliveryAddress: true } },
          deliveryPerson: { select: { id: true, name: true, email: true } },
          settledByPayment: {
            select: { id: true, paidAt: true, amount: true, reference: true }
          }
        }
      })
      return NextResponse.json({ success: true, earning: updated })
    }

    if (body.linkPaymentId && typeof body.linkPaymentId === 'string') {
      if (earning.status !== 'PENDING') {
        return NextResponse.json(
          { message: 'Only pending earnings can be linked to a payment' },
          { status: 400 }
        )
      }
      const pay = await prisma.deliveryPayment.findFirst({
        where: {
          id: body.linkPaymentId,
          businessId,
          deliveryPersonId: earning.deliveryPersonId
        }
      })
      if (!pay) {
        return NextResponse.json(
          { message: 'Payment not found for this delivery person' },
          { status: 404 }
        )
      }
      try {
        await prisma.$transaction(async (tx) => {
          const nextIds = pay!.earningsIds.includes(earningId)
            ? pay!.earningsIds
            : [...pay!.earningsIds, earningId]
          await syncPaymentEarningLinks(
            tx,
            {
              id: pay!.id,
              businessId,
              deliveryPersonId: pay!.deliveryPersonId,
              earningsIds: pay!.earningsIds
            },
            nextIds
          )
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to link'
        return NextResponse.json({ message: msg }, { status: 400 })
      }

      const updated = await prisma.deliveryEarning.findUnique({
        where: { id: earningId },
        include: {
          order: { select: { orderNumber: true, status: true, deliveryAddress: true } },
          deliveryPerson: { select: { id: true, name: true, email: true } },
          settledByPayment: {
            select: { id: true, paidAt: true, amount: true, reference: true }
          }
        }
      })
      return NextResponse.json({ success: true, earning: updated })
    }

    if (body.amount !== undefined) {
      if (earning.status === 'CANCELLED') {
        return NextResponse.json(
          { message: 'Cannot adjust amount for a cancelled earning' },
          { status: 400 }
        )
      }
      const reasonErr = validateAmountAdjustmentReason(body.amountAdjustmentReason)
      if (reasonErr) {
        return NextResponse.json({ message: reasonErr }, { status: 400 })
      }
      if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount < 0) {
        return NextResponse.json({ message: 'Amount must be a non-negative number' }, { status: 400 })
      }

      await prisma.deliveryEarning.update({
        where: { id: earningId },
        data: {
          amount: body.amount,
          amountAdjustmentReason: String(body.amountAdjustmentReason).trim()
        }
      })

      const updated = await prisma.deliveryEarning.findUnique({
        where: { id: earningId },
        include: {
          order: { select: { orderNumber: true, status: true, deliveryAddress: true } },
          deliveryPerson: { select: { id: true, name: true, email: true } },
          settledByPayment: {
            select: { id: true, paidAt: true, amount: true, reference: true }
          }
        }
      })
      return NextResponse.json({ success: true, earning: updated })
    }

    return NextResponse.json(
      {
        message:
          'Provide unlinkPayment: true, linkPaymentId, or amount with amountAdjustmentReason'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('PATCH delivery earning:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
