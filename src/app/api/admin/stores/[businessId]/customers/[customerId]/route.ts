// src/app/api/admin/stores/[businessId]/customers/[customerId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, customerId } = await params

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

    // Get customer with order statistics
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId
      },
      include: {
        orders: {
          select: {
            total: true,
            createdAt: true,
            status: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Calculate customer statistics
    const completedOrders = customer.orders.filter(order => 
      ['DELIVERED', 'READY'].includes(order.status)
    )
    
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0
    const lastOrderDate = customer.orders.length > 0 
      ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null

    const stats = {
      totalOrders: customer.orders.length,
      totalSpent,
      averageOrderValue,
      lastOrderDate
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tier: customer.tier,
        addressJson: customer.addressJson,
        tags: customer.tags,
        notes: customer.notes,
        addedByAdmin: customer.addedByAdmin,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      },
      stats
    })

  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
