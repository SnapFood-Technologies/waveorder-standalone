// src/app/api/admin/stores/[businessId]/analytics/advanced/route.ts
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

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = now
    }

    endDate.setHours(23, 59, 59, 999)

    // Fetch analytics data
    const analytics = await prisma.analytics.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    })

    // Fetch orders data
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    })

    // Calculate overview metrics
    const totalViews = analytics.reduce((sum, a) => sum + a.visitors, 0)
    const totalOrders = orders.length
    // Revenue calculation: Paid orders that are confirmed/completed
    // Includes DELIVERED, PICKED_UP, READY, CONFIRMED + PAID (to catch all order types)
    const totalRevenue = orders
      .filter(o => {
        if (o.paymentStatus !== 'PAID') return false
        if (o.status === 'CANCELLED' || o.status === 'REFUNDED') return false
        return ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
      })
      .reduce((sum, o) => sum + o.total, 0)
    
    const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodDuration)
    const prevEndDate = new Date(startDate.getTime() - 1)

    const prevAnalytics = await prisma.analytics.findMany({
      where: {
        businessId,
        date: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    })

    const prevOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    })

    const prevViews = prevAnalytics.reduce((sum, a) => sum + a.visitors, 0)
    const prevRevenue = prevOrders
      .filter(o => {
        if (o.paymentStatus !== 'PAID') return false
        if (o.status === 'CANCELLED' || o.status === 'REFUNDED') return false
        return ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
      })
      .reduce((sum, o) => sum + o.total, 0)

    const viewsGrowth = prevViews > 0 ? (((totalViews - prevViews) / prevViews) * 100).toFixed(1) : 0
    const revenueGrowth = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0

    // Traffic trends (daily breakdown)
    const trafficTrends = analytics.map(a => ({
      date: a.date.toISOString().split('T')[0],
      visitors: a.visitors,
      orders: orders.filter(o => 
        o.createdAt.toISOString().split('T')[0] === a.date.toISOString().split('T')[0]
      ).length
    }))

    // Top products by views/orders
    const productStats = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productStats.get(item.productId) || {
          id: item.productId,
          name: item.product.name,
          orders: 0,
          revenue: 0,
          quantity: 0
        }
        existing.orders++
        existing.revenue += item.price * item.quantity
        existing.quantity += item.quantity
        productStats.set(item.productId, existing)
      })
    })

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Order status breakdown
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Hourly breakdown
    const hourlyData = new Array(24).fill(0).map((_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      visitors: 0,
      orders: 0,
      revenue: 0
    }))

    orders.forEach(order => {
      const hour = order.createdAt.getHours()
      hourlyData[hour].orders++
      if (order.paymentStatus === 'PAID' && ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
        hourlyData[hour].revenue += order.total
      }
    })

    // Daily breakdown
    const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
      day,
      visitors: 0,
      orders: 0,
      revenue: 0
    }))

    orders.forEach(order => {
      const dayOfWeek = order.createdAt.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday from 0 to 6
      dailyData[adjustedDay].orders++
      if (order.paymentStatus === 'PAID' && ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
        dailyData[adjustedDay].revenue += order.total
      }
    })

    analytics.forEach(a => {
      const dayOfWeek = a.date.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      dailyData[adjustedDay].visitors += a.visitors
    })

    // Customer analysis
    const uniqueCustomers = new Set(orders.map(o => o.customerId))
    const repeatCustomers = orders.reduce((acc, order) => {
      const customerOrders = orders.filter(o => o.customerId === order.customerId)
      if (customerOrders.length > 1) acc.add(order.customerId)
      return acc
    }, new Set())

    return NextResponse.json({
      data: {
        overview: {
          totalViews,
          uniqueVisitors: totalViews, // Using visitors as unique for now
          totalOrders,
          revenue: totalRevenue,
          conversionRate: parseFloat(conversionRate as string),
          avgOrderValue,
          bounceRate: 35, // Placeholder - would need session tracking
          avgSessionDuration: 180, // Placeholder - would need session tracking
          viewsGrowth: parseFloat(viewsGrowth as string),
          revenueGrowth: parseFloat(revenueGrowth as string)
        },
        traffic: {
          trends: trafficTrends,
          sources: [] // Would need referrer tracking in analytics
        },
        products: {
          topProducts,
          totalProductViews: totalViews // Approximation
        },
        timeAnalysis: {
          hourly: hourlyData,
          daily: dailyData,
          peakHours: hourlyData
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 3)
            .map(h => h.hour)
        },
        customers: {
          total: uniqueCustomers.size,
          repeat: repeatCustomers.size,
          repeatRate: uniqueCustomers.size > 0 
            ? ((repeatCustomers.size / uniqueCustomers.size) * 100).toFixed(1)
            : 0
        },
        ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({
          status,
          count,
          percentage: ((count / totalOrders) * 100).toFixed(1)
        }))
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching advanced analytics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}