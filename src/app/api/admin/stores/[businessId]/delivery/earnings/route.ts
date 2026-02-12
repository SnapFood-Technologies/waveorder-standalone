// src/app/api/admin/stores/[businessId]/delivery/earnings/route.ts
// Delivery Earnings API - Summary and list of delivery earnings
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

    // Check if delivery management is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableDeliveryManagement: true, currency: true }
    })

    if (!business?.enableDeliveryManagement) {
      return NextResponse.json({ 
        enabled: false,
        message: 'Delivery management is not enabled for this business. Please contact support to enable this feature.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const deliveryPersonId = searchParams.get('deliveryPersonId')
    const status = searchParams.get('status') as 'PENDING' | 'PAID' | 'CANCELLED' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filters
    const where: any = { businessId }
    
    if (deliveryPersonId) {
      where.deliveryPersonId = deliveryPersonId
    }
    
    if (status) {
      where.status = status
    }
    
    if (startDate || endDate) {
      where.deliveredAt = {}
      if (startDate) {
        where.deliveredAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.deliveredAt.lte = new Date(endDate)
      }
    }

    // Fetch earnings with pagination
    const [earnings, total] = await Promise.all([
      prisma.deliveryEarning.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              deliveryAddress: true
            }
          },
          deliveryPerson: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { deliveredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.deliveryEarning.count({ where })
    ])

    // Get totals by delivery person
    const personTotals = await prisma.deliveryEarning.groupBy({
      by: ['deliveryPersonId'],
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    // Get totals by status
    const statusTotals = await prisma.deliveryEarning.groupBy({
      by: ['status'],
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    // Get delivery person details
    const personIds = personTotals.map(p => p.deliveryPersonId)
    const deliveryPersons = await prisma.user.findMany({
      where: {
        id: { in: personIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const totalsByPerson = personTotals.map(pt => {
      const person = deliveryPersons.find(p => p.id === pt.deliveryPersonId)
      return {
        deliveryPersonId: pt.deliveryPersonId,
        deliveryPersonName: person?.name || 'Unknown',
        deliveryPersonEmail: person?.email || '',
        totalEarnings: pt._sum.amount || 0,
        orderCount: pt._count
      }
    }).sort((a, b) => b.totalEarnings - a.totalEarnings)

    const totalsByStatus = statusTotals.map(st => ({
      status: st.status,
      totalAmount: st._sum.amount || 0,
      count: st._count
    }))

    // Get grand totals
    const grandTotal = await prisma.deliveryEarning.aggregate({
      where: { businessId },
      _sum: { amount: true },
      _count: true
    })

    // Get pending total (for payment collection)
    const pendingTotal = await prisma.deliveryEarning.aggregate({
      where: {
        businessId,
        status: 'PENDING'
      },
      _sum: { amount: true },
      _count: true
    })

    return NextResponse.json({
      success: true,
      currency: business?.currency || 'EUR',
      data: {
        earnings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        totalsByPerson,
        totalsByStatus,
        summary: {
          grandTotal: grandTotal._sum.amount || 0,
          totalOrders: grandTotal._count,
          pendingTotal: pendingTotal._sum.amount || 0,
          pendingOrders: pendingTotal._count,
          paidTotal: totalsByStatus.find(t => t.status === 'PAID')?.totalAmount || 0,
          paidOrders: totalsByStatus.find(t => t.status === 'PAID')?.count || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching delivery earnings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
