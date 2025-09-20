// src/app/api/admin/stores/[businessId]/orders/recent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Await params before using
    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get recent orders (last 30 days, limit 10)
    const orders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    }))

    return NextResponse.json({ orders: formattedOrders })

  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}