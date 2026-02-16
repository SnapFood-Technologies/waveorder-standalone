// src/app/api/admin/stores/[businessId]/affiliates/payments/route.ts
// Affiliate Payments API - List and create affiliate payments
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
    const affiliateId = searchParams.get('affiliateId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filters
    const where: any = { businessId }
    
    if (affiliateId) {
      where.affiliateId = affiliateId
    }
    
    if (startDate || endDate) {
      where.paidAt = {}
      if (startDate) {
        where.paidAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.paidAt.lte = new Date(endDate)
      }
    }

    // Fetch payments with pagination
    const [payments, total] = await Promise.all([
      prisma.affiliatePayment.findMany({
        where,
        include: {
          affiliate: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.affiliatePayment.count({ where })
    ])

    // Get totals by affiliate
    const totalsByAffiliate = await prisma.affiliatePayment.groupBy({
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
      totalPaid: t._sum.amount || 0,
      paymentCount: t._count
    }))

    const grandTotal = totalsByAffiliate.reduce((sum, t) => sum + (t._sum.amount || 0), 0)

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        payments,
        totalsByAffiliate: totalsByAffiliateWithNames,
        grandTotal,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching affiliate payments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Check if affiliate system is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableAffiliateSystem: true, currency: true }
    })

    if (!business?.enableAffiliateSystem) {
      return NextResponse.json({
        enabled: false,
        message: 'Affiliate system is not enabled for this business.'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      affiliateId,
      amount,
      currency,
      periodStart,
      periodEnd,
      paymentMethod,
      reference,
      notes,
      paidAt,
      earningsIds // Array of AffiliateEarning IDs to mark as paid
    } = body

    // Validate required fields
    if (!affiliateId || typeof affiliateId !== 'string') {
      return NextResponse.json({ message: 'Affiliate ID is required' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 })
    }

    // Verify affiliate exists and belongs to this business
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        businessId
      }
    })

    if (!affiliate) {
      return NextResponse.json({ 
        message: 'Affiliate not found or does not belong to this business' 
      }, { status: 400 })
    }

    // Validate earnings IDs if provided
    if (earningsIds && Array.isArray(earningsIds) && earningsIds.length > 0) {
      const validEarnings = await prisma.affiliateEarning.findMany({
        where: {
          id: { in: earningsIds },
          businessId,
          affiliateId,
          status: 'PENDING'
        }
      })

      if (validEarnings.length !== earningsIds.length) {
        return NextResponse.json({ 
          message: 'Some earnings IDs are invalid or already paid' 
        }, { status: 400 })
      }
    }

    // Create payment record
    const payment = await prisma.affiliatePayment.create({
      data: {
        businessId,
        affiliateId,
        amount,
        currency: currency || business.currency || 'EUR',
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        notes: notes || null,
        earningsIds: earningsIds || [],
        paidAt: paidAt ? new Date(paidAt) : new Date()
      }
    })

    // Mark earnings as paid if provided
    if (earningsIds && Array.isArray(earningsIds) && earningsIds.length > 0) {
      await prisma.affiliateEarning.updateMany({
        where: {
          id: { in: earningsIds }
        },
        data: {
          status: 'PAID'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    })

  } catch (error) {
    console.error('Error creating affiliate payment:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
