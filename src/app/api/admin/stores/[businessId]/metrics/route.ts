// src/app/api/admin/stores/[businessId]/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


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

    // Get orders count and revenue (only delivered orders with paid status for revenue)
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
        status: true,
        paymentStatus: true,
        type: true
      }
    })

    // Define order status colors and labels
    const orderStatusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pending', color: '#fbbf24' },
      CONFIRMED: { label: 'Confirmed', color: '#3b82f6' },
      PREPARING: { label: 'Preparing', color: '#f59e0b' },
      READY: { label: 'Ready', color: '#8b5cf6' },
      PICKED_UP: { label: 'Picked Up', color: '#10b981' },
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
    })).sort((a, b) => b.count - a.count)

    // Get completed orders for revenue calculation
    // Revenue includes orders that are paid and completed/fulfilled:
    // - DELIVERY orders: DELIVERED + PAID (final status)
    // - PICKUP orders: PICKED_UP + PAID (final status - only when actually picked up)
    // - DINE_IN orders: PICKED_UP + PAID (final status - only when actually picked up)
    // Note: Excludes CANCELLED and REFUNDED orders
    const revenueOrders = allOrders.filter(order => {
      if (order.paymentStatus !== 'PAID') return false
      if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return false
      
      // Order-type specific revenue calculation
      if (order.type === 'DELIVERY') {
        // Delivery orders: only DELIVERED counts as revenue
        return order.status === 'DELIVERED'
      } else if (order.type === 'PICKUP') {
        // Pickup orders: only PICKED_UP counts as revenue
        return order.status === 'PICKED_UP'
      } else if (order.type === 'DINE_IN') {
        // Dine-in orders: only PICKED_UP counts as revenue
        return order.status === 'PICKED_UP'
      }
      
      return false
    })

    // Get BOTH old Analytics AND new VisitorSession data for views
    const oldAnalytics = await prisma.analytics.findMany({
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
    
    const visitorSessions = await prisma.visitorSession.findMany({
      where: {
        businessId: businessId,
        visitedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate metrics - COMBINE old Analytics + new VisitorSessions
    const totalOrders = allOrders.length
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0)
    const oldViews = oldAnalytics.reduce((sum, record) => sum + record.visitors, 0)
    const newViews = visitorSessions.length
    const totalViews = oldViews + newViews

    // Calculate growth (compare with previous period)
    const periodDuration = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodDuration)
    const prevEndDate = new Date(startDate.getTime() - 1)
    
    const prevRevenueOrders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        },
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
      select: { total: true }
    })

    const prevRevenue = prevRevenueOrders.reduce((sum, order) => sum + order.total, 0)
    const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 
                   totalRevenue > 0 ? 100 : 0

    return NextResponse.json({
      metrics: {
        views: totalViews,
        orders: totalOrders,
        revenue: totalRevenue,
        growth: growth,
        ordersByStatus: orderStatusData,
        revenueStats: {
          totalOrdersWithRevenue: revenueOrders.length,
          averageOrderValue: revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0,
          revenueConversionRate: totalOrders > 0 ? Math.round((revenueOrders.length / totalOrders) * 100) : 0
        }
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