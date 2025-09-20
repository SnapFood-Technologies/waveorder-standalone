// src/app/api/admin/stores/[businessId]/customers/recent/route.ts
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

    // Get recent customers (customers who have placed orders in the last 30 days, limit 10)
    const customers = await prisma.customer.findMany({
      where: {
        businessId: businessId,
        orders: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true,
            total: true,
            status: true
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
      totalOrders: customer._count.orders,
      lastOrderDate: customer.orders[0]?.createdAt?.toISOString() || null,
      lastOrderTotal: customer.orders[0]?.total || 0,
      lastOrderStatus: customer.orders[0]?.status || null,
      createdAt: customer.createdAt.toISOString()
    }))

    return NextResponse.json({ customers: formattedCustomers })

  } catch (error) {
    console.error('Error fetching recent customers:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}