// src/app/api/admin/stores/[businessId]/metrics/route.ts
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

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Parse dates or use default (current month)
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = now
    }

    // Ensure end date includes the full day
    endDate.setHours(23, 59, 59, 999)

    // Get orders count and revenue (only completed orders for revenue)
    const allOrders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        total: true,
        createdAt: true,
        status: true
      }
    })

    // Define order status colors and labels
    const orderStatusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pending', color: '#fbbf24' },
      CONFIRMED: { label: 'Confirmed', color: '#3b82f6' },
      PREPARING: { label: 'Preparing', color: '#f59e0b' },
      READY: { label: 'Ready', color: '#8b5cf6' },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#06b6d4' },
      DELIVERED: { label: 'Delivered', color: '#10b981' },
      CANCELLED: { label: 'Cancelled', color: '#ef4444' },
      REFUNDED: { label: 'Refunded', color: '#6b7280' }
    }

    // Group orders by status
    const ordersByStatus = allOrders.reduce((acc, order) => {
      const status = order.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to chart data format
    const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({
      status,
      count,
      label: orderStatusConfig[status]?.label || status,
      color: orderStatusConfig[status]?.color || '#6b7280'
    })).sort((a, b) => b.count - a.count) // Sort by count descending

    // Get completed orders for revenue calculation
    const completedOrderStatuses = ['DELIVERED', 'READY'] // Add other completed statuses as needed
    const completedOrders = allOrders.filter(order => 
      completedOrderStatuses.includes(order.status)
    )

    // Get analytics data for views
    const analytics = await prisma.analytics.findMany({
      where: {
        businessId: businessId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        visitors: true
      }
    })

    // Calculate metrics
    const totalOrders = allOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0)
    const totalViews = analytics.reduce((sum, record) => sum + record.visitors, 0)

    // Calculate growth (compare with previous period)
    const periodDuration = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodDuration)
    const prevEndDate = new Date(startDate.getTime() - 1) // End just before current period starts
    
    const prevCompletedOrders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        },
        status: {
            // @ts-expect-error
          in: completedOrderStatuses
        }
      },
      select: { total: true }
    })

    const prevRevenue = prevCompletedOrders.reduce((sum, order) => sum + order.total, 0)
    const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 
                   totalRevenue > 0 ? 100 : 0

    return NextResponse.json({
      metrics: {
        views: totalViews,
        orders: totalOrders,
        revenue: totalRevenue,
        growth: growth,
        ordersByStatus: orderStatusData
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
