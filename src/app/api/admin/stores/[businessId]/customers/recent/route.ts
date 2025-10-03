// src/app/api/admin/stores/[businessId]/customers/recent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Get recent customers (customers who have placed orders in the last 30 days, limit 10)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const customers = await prisma.customer.findMany({
      where: {
        businessId: businessId
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true,
            total: true,
            status: true,
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })

    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      tier: customer.tier,
      totalOrders: customer._count.orders,
      lastOrderDate: customer.orders[0]?.createdAt || null,
      lastOrderTotal: customer.orders[0]?.total || 0,
      lastOrderStatus: customer.orders[0]?.status || null,
      createdAt: customer.createdAt
    }))

    return NextResponse.json({ customers: formattedCustomers })

  } catch (error) {
    console.error('Error fetching recent customers:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}