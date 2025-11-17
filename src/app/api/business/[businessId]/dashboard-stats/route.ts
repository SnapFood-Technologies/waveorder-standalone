// app/api/business/[businessId]/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    
    const [orders, products, customers] = await Promise.all([
      prisma.order.count({
        where: { businessId }
      }),
      prisma.product.count({
        where: { businessId, isActive: true }
      }),
      prisma.customer.count({
        where: { businessId }
      })
    ])

    // Revenue calculation: Paid orders that are completed/fulfilled
    // - DELIVERY orders: DELIVERED + PAID (final status)
    // - PICKUP orders: PICKED_UP + PAID (final status - only when actually picked up)
    // - DINE_IN orders: PICKED_UP + PAID (final status - only when actually picked up)
    const revenue = await prisma.order.aggregate({
      where: { 
        businessId,
        paymentStatus: 'PAID',
        OR: [
          // Delivery orders: DELIVERED
          { type: 'DELIVERY', status: 'DELIVERED' },
          // Pickup orders: PICKED_UP
          { type: 'PICKUP', status: 'PICKED_UP' },
          // Dine-in orders: PICKED_UP
          { type: 'DINE_IN', status: 'PICKED_UP' }
        ],
        NOT: {
          status: {
            in: ['CANCELLED', 'REFUNDED']
          }
        }
      },
      _sum: { total: true }
    })

    return NextResponse.json({
      totalOrders: orders,
      totalProducts: products,
      totalCustomers: customers,
      totalRevenue: revenue._sum.total || 0
    })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}