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

    const revenue = await prisma.order.aggregate({
      where: { 
        businessId,
        status: { not: 'CANCELLED' }
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