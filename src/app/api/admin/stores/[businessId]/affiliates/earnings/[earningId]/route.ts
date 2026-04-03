// PATCH single affiliate earning — status changes + optional link to AffiliatePayment
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import {
  assertCanTransitionEarningStatus,
  type AffiliateEarningStatus,
} from '@/lib/affiliate-earning-status'

async function removeEarningIdFromAllPayments(
  businessId: string,
  earningId: string
): Promise<void> {
  const payments = await prisma.affiliatePayment.findMany({
    where: {
      businessId,
      earningsIds: { has: earningId },
    },
    select: { id: true, earningsIds: true },
  })
  for (const p of payments) {
    const next = p.earningsIds.filter((id) => id !== earningId)
    await prisma.affiliatePayment.update({
      where: { id: p.id },
      data: { earningsIds: next },
    })
  }
}

async function assertEarningNotLinkedElsewhere(
  businessId: string,
  earningId: string,
  exceptPaymentId?: string
): Promise<void> {
  const other = await prisma.affiliatePayment.findFirst({
    where: {
      businessId,
      earningsIds: { has: earningId },
      ...(exceptPaymentId ? { NOT: { id: exceptPaymentId } } : {}),
    },
    select: { id: true },
  })
  if (other) {
    throw new Error('Earning is already linked to another payment')
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ businessId: string; earningId: string }> }
) {
  try {
    const { businessId, earningId } = await params

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
    const statusNext = body?.status as AffiliateEarningStatus | undefined
    const paymentId =
      typeof body?.paymentId === 'string' && body.paymentId.length > 0
        ? body.paymentId
        : undefined

    if (!statusNext || !['PENDING', 'PAID', 'CANCELLED'].includes(statusNext)) {
      return NextResponse.json(
        { message: 'Body must include status: PENDING | PAID | CANCELLED' },
        { status: 400 }
      )
    }

    const earning = await prisma.affiliateEarning.findFirst({
      where: { id: earningId, businessId },
    })
    if (!earning) {
      return NextResponse.json({ message: 'Earning not found' }, { status: 404 })
    }

    const current = earning.status as AffiliateEarningStatus

    try {
      assertCanTransitionEarningStatus(current, statusNext)
    } catch (e) {
      return NextResponse.json(
        { message: e instanceof Error ? e.message : 'Invalid transition' },
        { status: 400 }
      )
    }

    // PAID → PENDING or CANCELLED: detach from any payment rows first
    if (current === 'PAID' && (statusNext === 'PENDING' || statusNext === 'CANCELLED')) {
      await removeEarningIdFromAllPayments(businessId, earningId)
    }

    // PENDING → PAID: optional link to existing payment (same affiliate)
    if (current === 'PENDING' && statusNext === 'PAID') {
      if (paymentId) {
        const payment = await prisma.affiliatePayment.findFirst({
          where: { id: paymentId, businessId },
        })
        if (!payment) {
          return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
        }
        if (payment.affiliateId !== earning.affiliateId) {
          return NextResponse.json(
            { message: 'Payment belongs to a different affiliate' },
            { status: 400 }
          )
        }
        await assertEarningNotLinkedElsewhere(businessId, earningId, paymentId)
        const merged = [...new Set([...payment.earningsIds, earningId])]
        await prisma.$transaction([
          prisma.affiliatePayment.update({
            where: { id: paymentId },
            data: { earningsIds: merged },
          }),
          prisma.affiliateEarning.update({
            where: { id: earningId },
            data: { status: 'PAID' },
          }),
        ])
      } else {
        await prisma.affiliateEarning.update({
          where: { id: earningId },
          data: { status: 'PAID' },
        })
      }
    } else {
      // CANCELLED ↔ PENDING, PAID → PENDING/CANCELLED (after detach), etc.
      await prisma.affiliateEarning.update({
        where: { id: earningId },
        data: { status: statusNext },
      })
    }

    const updated = await prisma.affiliateEarning.findUnique({
      where: { id: earningId },
      include: {
        affiliate: {
          select: { id: true, name: true, email: true, trackingCode: true },
        },
        order: {
          select: { orderNumber: true, status: true, total: true, createdAt: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Earning updated',
      data: { earning: updated },
    })
  } catch (error) {
    console.error('PATCH affiliate earning:', error)
    if (error instanceof Error && error.message.includes('already linked')) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
