// Eligible orders for manual affiliate earning - delivered+paid, no existing earning
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableAffiliateSystem: true, currency: true }
    })

    if (!business?.enableAffiliateSystem) {
      return NextResponse.json({
        enabled: false,
        message: 'Affiliate system is not enabled for this business.'
      })
    }

    // Orders that are DELIVERED or PICKED_UP, PAID, and have no AffiliateEarning
    const ordersWithEarning = await prisma.affiliateEarning.findMany({
      where: { businessId },
      select: { orderId: true }
    })
    const orderIdsWithEarning = ordersWithEarning.map((e) => e.orderId)

    const whereClause: Record<string, unknown> = {
      businessId,
      status: { in: ['DELIVERED', 'PICKED_UP'] },
      paymentStatus: 'PAID'
    }
    if (orderIdsWithEarning.length > 0) {
      whereClause.id = { notIn: orderIdsWithEarning }
    }

    const orders = await prisma.order.findMany({
      where: whereClause as any,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        customerName: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: { orders }
    })
  } catch (error) {
    console.error('Error fetching eligible orders:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
