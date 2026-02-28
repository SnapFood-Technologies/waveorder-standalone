// src/app/api/admin/stores/[businessId]/affiliates/earnings/route.ts
// Affiliate Earnings API - List affiliate earnings
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

    // Check if affiliate system is enabled
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, CANCELLED, or ALL
    const affiliateId = searchParams.get('affiliateId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filters
    const where: any = { businessId }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (affiliateId) {
      where.affiliateId = affiliateId
    }
    
    if (startDate || endDate) {
      where.orderCompletedAt = {}
      if (startDate) {
        where.orderCompletedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.orderCompletedAt.lte = new Date(endDate)
      }
    }

    // Fetch earnings with pagination
    const [earnings, total] = await Promise.all([
      prisma.affiliateEarning.findMany({
        where,
        include: {
          affiliate: {
            select: {
              id: true,
              name: true,
              email: true,
              trackingCode: true
            }
          },
          order: {
            select: {
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true
            }
          }
        },
        orderBy: { orderCompletedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.affiliateEarning.count({ where })
    ])

    // Calculate summary
    const summary = await prisma.affiliateEarning.aggregate({
      where: { businessId },
      _sum: {
        amount: true
      },
      _count: true
    })

    const pendingSummary = await prisma.affiliateEarning.aggregate({
      where: {
        businessId,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    const paidSummary = await prisma.affiliateEarning.aggregate({
      where: {
        businessId,
        status: 'PAID'
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    // Get totals by affiliate
    const totalsByAffiliate = await prisma.affiliateEarning.groupBy({
      by: ['affiliateId'],
      where: { businessId },
      _sum: {
        amount: true
      },
      _count: true
    })

    const affiliateIds = totalsByAffiliate.map(t => t.affiliateId)
    const affiliates = await prisma.affiliate.findMany({
      where: {
        id: { in: affiliateIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const affiliateMap = new Map(affiliates.map(a => [a.id, a]))
    const totalsByAffiliateWithNames = totalsByAffiliate.map(t => ({
      affiliateId: t.affiliateId,
      affiliateName: affiliateMap.get(t.affiliateId)?.name || 'Unknown',
      affiliateEmail: affiliateMap.get(t.affiliateId)?.email || null,
      totalEarnings: t._sum.amount || 0,
      orderCount: t._count
    }))

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        earnings,
        summary: {
          grandTotal: summary._sum.amount || 0,
          totalOrders: summary._count,
          pendingTotal: pendingSummary._sum.amount || 0,
          pendingOrders: pendingSummary._count,
          paidTotal: paidSummary._sum.amount || 0,
          paidOrders: paidSummary._count
        },
        totalsByAffiliate: totalsByAffiliateWithNames,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching affiliate earnings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/** Create manual affiliate earning for a delivered+paid order */
export async function POST(
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

    const body = await request.json()
    const { affiliateId, orderId, commissionType, commissionValue } = body

    if (!affiliateId || !orderId || !commissionType || commissionValue == null) {
      return NextResponse.json(
        { message: 'Missing required fields: affiliateId, orderId, commissionType, commissionValue' },
        { status: 400 }
      )
    }

    if (!['PERCENTAGE', 'FIXED'].includes(commissionType)) {
      return NextResponse.json(
        { message: 'commissionType must be PERCENTAGE or FIXED' },
        { status: 400 }
      )
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: { id: affiliateId, businessId }
    })
    if (!affiliate) {
      return NextResponse.json({ message: 'Affiliate not found' }, { status: 404 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId,
        status: { in: ['DELIVERED', 'PICKED_UP'] },
        paymentStatus: 'PAID'
      }
    })
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found or not eligible (must be delivered/picked up and paid)' },
        { status: 404 }
      )
    }

    const existingEarning = await prisma.affiliateEarning.findUnique({
      where: { orderId }
    })
    if (existingEarning) {
      return NextResponse.json(
        { message: 'This order already has an affiliate earning' },
        { status: 400 }
      )
    }

    let amount: number
    if (commissionType === 'PERCENTAGE') {
      const pct = Number(commissionValue)
      if (pct < 0 || pct > 100) {
        return NextResponse.json(
          { message: 'Percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
      amount = order.total * (pct / 100)
    } else {
      amount = Number(commissionValue)
      if (amount < 0) {
        return NextResponse.json(
          { message: 'Fixed amount must be non-negative' },
          { status: 400 }
        )
      }
    }

    const [earning] = await prisma.$transaction([
      prisma.affiliateEarning.create({
        data: {
          businessId,
          orderId: order.id,
          affiliateId: affiliate.id,
          orderTotal: order.total,
          commissionType,
          commissionValue: Number(commissionValue),
          amount,
          currency: business.currency || 'EUR',
          status: 'PENDING',
          orderCompletedAt: new Date()
        },
        include: {
          affiliate: {
            select: { id: true, name: true, trackingCode: true }
          },
          order: {
            select: { orderNumber: true, total: true, status: true }
          }
        }
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { affiliateId: affiliate.id }
      })
    ])

    return NextResponse.json({
      message: 'Manual earning created',
      data: { earning }
    })
  } catch (error) {
    console.error('Error creating manual affiliate earning:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
