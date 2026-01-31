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
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Get all businesses for this user
    const businessUsers = await prisma.businessUser.findMany({
      where: { userId: session.user.id },
      select: { businessId: true, business: { select: { name: true, slug: true, currency: true } } }
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

    // Get total count for pagination
    const totalOrders = await prisma.order.count({
      where: whereClause
    })

    // Fetch orders from all businesses with pagination
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
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
        currency: business?.currency || 'USD',
        customerName: order.customer?.name || 'Guest',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString()
      }
    })

    return NextResponse.json({ 
      orders: formattedOrders,
      total: totalOrders,
      hasMore: skip + orders.length < totalOrders
    })

  } catch (error) {
    console.error('Error fetching unified orders:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
