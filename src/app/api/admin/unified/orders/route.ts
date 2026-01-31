// src/app/api/admin/unified/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all businesses for this user
    const businessUsers = await prisma.businessUser.findMany({
      where: { userId: session.user.id },
      select: { businessId: true, business: { select: { name: true, slug: true } } }
    })

    if (businessUsers.length === 0) {
      return NextResponse.json({ orders: [] })
    }

    const businessIds = businessUsers.map(bu => bu.businessId)
    const businessMap = new Map(businessUsers.map(bu => [bu.businessId, bu.business]))

    // Build where clause
    const whereClause: any = {
      businessId: { in: businessIds }
    }

    if (status !== 'all') {
      whereClause.status = status
    }

    // Fetch orders from all businesses
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        businessId: true,
        total: true,
        status: true,
        createdAt: true,
        customer: {
          select: { name: true }
        }
      }
    })

    // Format response
    const formattedOrders = orders.map(order => {
      const business = businessMap.get(order.businessId)
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        businessId: order.businessId,
        businessName: business?.name || 'Unknown',
        businessSlug: business?.slug || '',
        customerName: order.customer?.name || 'Guest',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString()
      }
    })

    return NextResponse.json({ orders: formattedOrders })

  } catch (error) {
    console.error('Error fetching unified orders:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
