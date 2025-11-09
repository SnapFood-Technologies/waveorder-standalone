// src/app/api/admin/stores/[businessId]/orders/recent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    // Await params before using
    const { businessId } = await params

    // Check business access (handles both normal users and impersonation)
    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get recent orders (last 30 days, limit 10)
    const orders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        customerName: true, // Include stored customer name
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
      // Use stored customer name from order (preserves historical name) or fallback to current customer name
      customerName: order.customerName && order.customerName.trim() !== '' 
        ? order.customerName.trim()
        : (order.customer.name || ''),
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