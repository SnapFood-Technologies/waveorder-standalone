// PATCH affiliate payment — link or unlink earning rows (retroactive reconciliation)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

async function assertEarningsNotLinkedElsewhere(
  businessId: string,
  earningIds: string[],
  exceptPaymentId: string
): Promise<void> {
  for (const eid of earningIds) {
    const other = await prisma.affiliatePayment.findFirst({
      where: {
        businessId,
        earningsIds: { has: eid },
        NOT: { id: exceptPaymentId },
      },
      select: { id: true },
    })
    if (other) {
      throw new Error(`Earning ${eid} is already linked to another payment`)
    }
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ businessId: string; paymentId: string }> }
) {
  try {
    const { businessId, paymentId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableAffiliateSystem: true },
    })
    if (!business?.enableAffiliateSystem) {
      return NextResponse.json(
        { message: 'Affiliate system is not enabled for this business.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const addEarningsIds: string[] = Array.isArray(body?.addEarningsIds)
      ? body.addEarningsIds.filter((x: unknown) => typeof x === 'string')
      : []
    const removeEarningsIds: string[] = Array.isArray(body?.removeEarningsIds)
      ? body.removeEarningsIds.filter((x: unknown) => typeof x === 'string')
      : []

    if (addEarningsIds.length === 0 && removeEarningsIds.length === 0) {
      return NextResponse.json(
        { message: 'Provide addEarningsIds and/or removeEarningsIds (non-empty arrays)' },
        { status: 400 }
      )
    }

    const payment = await prisma.affiliatePayment.findFirst({
      where: { id: paymentId, businessId },
    })
    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    if (addEarningsIds.length > 0) {
      const earnings = await prisma.affiliateEarning.findMany({
        where: {
          id: { in: addEarningsIds },
          businessId,
          affiliateId: payment.affiliateId,
        },
      })
      if (earnings.length !== addEarningsIds.length) {
        return NextResponse.json(
          {
            message:
              'Some earnings are missing, wrong affiliate, or wrong business',
          },
          { status: 400 }
        )
      }
      const notPending = earnings.filter((e) => e.status !== 'PENDING')
      if (notPending.length > 0) {
        return NextResponse.json(
          {
            message: 'All added earnings must be in PENDING status',
          },
          { status: 400 }
        )
      }
      await assertEarningsNotLinkedElsewhere(businessId, addEarningsIds, paymentId)
    }

    if (removeEarningsIds.length > 0) {
      const notInPayment = removeEarningsIds.filter(
        (id) => !payment.earningsIds.includes(id)
      )
      if (notInPayment.length > 0) {
        return NextResponse.json(
          {
            message: 'removeEarningsIds must be a subset of this payment’s linked earnings',
          },
          { status: 400 }
        )
      }
    }

    let nextEarningsIds = [...payment.earningsIds]
    for (const id of removeEarningsIds) {
      nextEarningsIds = nextEarningsIds.filter((x) => x !== id)
    }
    for (const id of addEarningsIds) {
      if (!nextEarningsIds.includes(id)) nextEarningsIds.push(id)
    }

    await prisma.$transaction(async (tx) => {
      if (removeEarningsIds.length > 0) {
        await tx.affiliateEarning.updateMany({
          where: {
            id: { in: removeEarningsIds },
            businessId,
            affiliateId: payment.affiliateId,
          },
          data: { status: 'PENDING' },
        })
      }
      if (addEarningsIds.length > 0) {
        await tx.affiliateEarning.updateMany({
          where: {
            id: { in: addEarningsIds },
            businessId,
            affiliateId: payment.affiliateId,
          },
          data: { status: 'PAID' },
        })
      }
      await tx.affiliatePayment.update({
        where: { id: paymentId },
        data: { earningsIds: nextEarningsIds },
      })
    })

    const updated = await prisma.affiliatePayment.findUnique({
      where: { id: paymentId },
      include: {
        affiliate: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({
      message: 'Payment updated',
      data: { payment: updated },
    })
  } catch (error) {
    console.error('PATCH affiliate payment:', error)
    if (
      error instanceof Error &&
      error.message.includes('already linked to another payment')
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
