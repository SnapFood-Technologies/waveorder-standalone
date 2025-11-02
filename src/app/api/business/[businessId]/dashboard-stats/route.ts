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

    // Revenue calculation: Paid orders that are confirmed/completed
    // Includes CONFIRMED, READY, DELIVERED + PAID to catch all completed orders
    // Some pickup/dine-in orders may stop at CONFIRMED or READY, not DELIVERED
    const revenue = await prisma.order.aggregate({
      where: { 
        businessId,
        paymentStatus: 'PAID',
        status: {
          in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
        },
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