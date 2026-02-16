// src/app/api/admin/stores/[businessId]/affiliates/summary/route.ts
// Affiliate Summary/Dashboard API
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

    // Get total affiliates
    const totalAffiliates = await prisma.affiliate.count({
      where: {
        businessId,
        isActive: true
      }
    })

    // Get total commissions paid
    const totalCommissionsPaid = await prisma.affiliatePayment.aggregate({
      where: { businessId },
      _sum: {
        amount: true
      }
    })

    // Get pending commissions
    const pendingCommissions = await prisma.affiliateEarning.aggregate({
      where: {
        businessId,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    // Get total orders from affiliates
    const totalOrdersFromAffiliates = await prisma.order.count({
      where: {
        businessId,
        affiliateId: { not: null }
      }
    })

    // Get top affiliates by earnings
    const topAffiliates = await prisma.affiliateEarning.groupBy({
      by: ['affiliateId'],
      where: { businessId },
      _sum: {
        amount: true
      },
      _count: true,
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 5
    })

    const affiliateIds = topAffiliates.map(t => t.affiliateId)
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
    const topAffiliatesWithNames = topAffiliates.map(t => ({
      affiliateId: t.affiliateId,
      affiliateName: affiliateMap.get(t.affiliateId)?.name || 'Unknown',
      affiliateEmail: affiliateMap.get(t.affiliateId)?.email || null,
      totalEarnings: t._sum.amount || 0,
      orderCount: t._count
    }))

    // Get recent earnings (last 10)
    const recentEarnings = await prisma.affiliateEarning.findMany({
      where: { businessId },
      include: {
        affiliate: {
          select: {
            id: true,
            name: true
          }
        },
        order: {
          select: {
            orderNumber: true,
            total: true
          }
        }
      },
      orderBy: { orderCompletedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      enabled: true,
      currency: business.currency || 'EUR',
      data: {
        summary: {
          totalAffiliates,
          totalCommissionsPaid: totalCommissionsPaid._sum.amount || 0,
          pendingCommissions: pendingCommissions._sum.amount || 0,
          pendingOrders: pendingCommissions._count,
          totalOrdersFromAffiliates
        },
        topAffiliates: topAffiliatesWithNames,
        recentEarnings
      }
    })

  } catch (error) {
    console.error('Error fetching affiliate summary:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
