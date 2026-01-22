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
    
    // Filter only DELIVERED + PAID orders (completed orders)
    // - DELIVERY orders: DELIVERED + PAID
    // - PICKUP orders: PICKED_UP + PAID  
    // - DINE_IN orders: PICKED_UP + PAID
    const completedOrders = orders.filter(o => {
      if (o.paymentStatus !== 'PAID') return false
      if (o.status === 'CANCELLED' || o.status === 'REFUNDED') return false
      
      // Order-type specific completion check
      if (o.type === 'DELIVERY') {
        return o.status === 'DELIVERED'
      } else if (o.type === 'PICKUP') {
        return o.status === 'PICKED_UP'
      } else if (o.type === 'DINE_IN') {
        return o.status === 'PICKED_UP'
      }
      
      return false
    })
    
    // Total orders count (all orders including cancelled for tracking)
    const totalOrders = orders.length
    // Revenue only from completed (DELIVERED + PAID) orders
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
    // Completed orders count for metrics
    const completedOrdersCount = completedOrders.length
    
    const conversionRate = totalViews > 0 ? ((completedOrdersCount / totalViews) * 100).toFixed(2) : 0
    const avgOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0

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
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    const prevCompletedOrders = prevOrders.filter(o => {
      if (o.paymentStatus !== 'PAID') return false
      if (o.status === 'CANCELLED' || o.status === 'REFUNDED') return false
      
      if (o.type === 'DELIVERY') {
        return o.status === 'DELIVERED'
      } else if (o.type === 'PICKUP') {
        return o.status === 'PICKED_UP'
      } else if (o.type === 'DINE_IN') {
        return o.status === 'PICKED_UP'
      }
      
      return false
    })

    const prevViews = prevAnalytics.reduce((sum, a) => sum + a.visitors, 0)
    const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + o.total, 0)

    const viewsGrowth = prevViews > 0 ? (((totalViews - prevViews) / prevViews) * 100).toFixed(1) : 0
    const revenueGrowth = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0

    // Traffic trends (daily breakdown) - only count completed orders
    const trafficTrends = analytics.map(a => {
      const dateStr = a.date.toISOString().split('T')[0]
      return {
        date: dateStr,
        visitors: a.visitors,
        orders: completedOrders.filter(o => 
          o.createdAt.toISOString().split('T')[0] === dateStr
        ).length
      }
    })

    // Top products - only from DELIVERED + PAID orders
    const productStats = new Map()
    completedOrders.forEach(order => {
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

    // Order status breakdown (all orders including cancelled for status tracking)
    const allOrdersCount = orders.length
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

    // Hourly breakdown - only count completed orders
    completedOrders.forEach(order => {
      const hour = order.createdAt.getHours()
      hourlyData[hour].orders++
      hourlyData[hour].revenue += order.total
    })

    // Daily breakdown
    const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
      day,
      visitors: 0,
      orders: 0,
      revenue: 0
    }))

    // Daily breakdown - only count completed orders
    completedOrders.forEach(order => {
      const dayOfWeek = order.createdAt.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday from 0 to 6
      dailyData[adjustedDay].orders++
      dailyData[adjustedDay].revenue += order.total
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

    // Traffic sources analysis
    const sourceStats = new Map<string, { visitors: number, orders: number }>()
    const campaignStats = new Map<string, { visitors: number, orders: number }>()
    const mediumStats = new Map<string, { visitors: number, orders: number }>()
    const placementStats = new Map<string, { visitors: number, orders: number }>()
    
    // Aggregate analytics by source, campaign, medium, placement
    analytics.forEach(a => {
      // Sources
      const source = a.source || 'Direct'
      const existingSource = sourceStats.get(source) || { visitors: 0, orders: 0 }
      existingSource.visitors += a.visitors
      sourceStats.set(source, existingSource)

      // Campaigns
      if (a.campaign) {
        const existingCampaign = campaignStats.get(a.campaign) || { visitors: 0, orders: 0 }
        existingCampaign.visitors += a.visitors
        campaignStats.set(a.campaign, existingCampaign)
      }

      // Medium
      if (a.medium) {
        const existingMedium = mediumStats.get(a.medium) || { visitors: 0, orders: 0 }
        existingMedium.visitors += a.visitors
        mediumStats.set(a.medium, existingMedium)
      }

      // Placement
      if (a.placement) {
        const existingPlacement = placementStats.get(a.placement) || { visitors: 0, orders: 0 }
        existingPlacement.visitors += a.visitors
        placementStats.set(a.placement, existingPlacement)
      }
    })

    // Count orders by determining source/campaign/medium/placement from analytics on the same day
    completedOrders.forEach(order => {
      const orderDate = order.createdAt.toISOString().split('T')[0]
      const dayAnalytics = analytics.find(a => 
        a.date.toISOString().split('T')[0] === orderDate
      )
      
      if (dayAnalytics) {
        // Source orders
        const source = dayAnalytics.source || 'Direct'
        const existingSource = sourceStats.get(source) || { visitors: 0, orders: 0 }
        existingSource.orders++
        sourceStats.set(source, existingSource)

        // Campaign orders
        if (dayAnalytics.campaign) {
          const existingCampaign = campaignStats.get(dayAnalytics.campaign) || { visitors: 0, orders: 0 }
          existingCampaign.orders++
          campaignStats.set(dayAnalytics.campaign, existingCampaign)
        }

        // Medium orders
        if (dayAnalytics.medium) {
          const existingMedium = mediumStats.get(dayAnalytics.medium) || { visitors: 0, orders: 0 }
          existingMedium.orders++
          mediumStats.set(dayAnalytics.medium, existingMedium)
        }

        // Placement orders
        if (dayAnalytics.placement) {
          const existingPlacement = placementStats.get(dayAnalytics.placement) || { visitors: 0, orders: 0 }
          existingPlacement.orders++
          placementStats.set(dayAnalytics.placement, existingPlacement)
        }
      }
    })

    const totalVisitors = Array.from(sourceStats.values()).reduce((sum, s) => sum + s.visitors, 0)
    
    const trafficSources = Array.from(sourceStats.entries()).map(([source, stats]) => ({
      source,
      visitors: stats.visitors,
      orders: stats.orders,
      conversionRate: stats.visitors > 0 ? parseFloat(((stats.orders / stats.visitors) * 100).toFixed(2)) : 0,
      percentage: totalVisitors > 0 ? parseFloat(((stats.visitors / totalVisitors) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.visitors - a.visitors)

    const totalCampaignVisitors = Array.from(campaignStats.values()).reduce((sum, s) => sum + s.visitors, 0)
    const campaigns = Array.from(campaignStats.entries()).map(([campaign, stats]) => ({
      campaign,
      visitors: stats.visitors,
      orders: stats.orders,
      conversionRate: stats.visitors > 0 ? parseFloat(((stats.orders / stats.visitors) * 100).toFixed(2)) : 0,
      percentage: totalCampaignVisitors > 0 ? parseFloat(((stats.visitors / totalCampaignVisitors) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.visitors - a.visitors)

    const totalMediumVisitors = Array.from(mediumStats.values()).reduce((sum, s) => sum + s.visitors, 0)
    const mediums = Array.from(mediumStats.entries()).map(([medium, stats]) => ({
      medium,
      visitors: stats.visitors,
      orders: stats.orders,
      conversionRate: stats.visitors > 0 ? parseFloat(((stats.orders / stats.visitors) * 100).toFixed(2)) : 0,
      percentage: totalMediumVisitors > 0 ? parseFloat(((stats.visitors / totalMediumVisitors) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.visitors - a.visitors)

    const totalPlacementVisitors = Array.from(placementStats.values()).reduce((sum, s) => sum + s.visitors, 0)
    const placements = Array.from(placementStats.entries()).map(([placement, stats]) => ({
      placement,
      visitors: stats.visitors,
      orders: stats.orders,
      conversionRate: stats.visitors > 0 ? parseFloat(((stats.orders / stats.visitors) * 100).toFixed(2)) : 0,
      percentage: totalPlacementVisitors > 0 ? parseFloat(((stats.visitors / totalPlacementVisitors) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.visitors - a.visitors)

    return NextResponse.json({
      data: {
        overview: {
          totalViews,
          uniqueVisitors: totalViews, // Using visitors as unique for now
          totalOrders: completedOrdersCount, // Only count completed (DELIVERED + PAID) orders
          revenue: totalRevenue, // Only revenue from completed orders
          conversionRate: parseFloat(conversionRate as string),
          avgOrderValue,
          bounceRate: 35, // Placeholder - would need session tracking
          avgSessionDuration: 180, // Placeholder - would need session tracking
          viewsGrowth: parseFloat(viewsGrowth as string),
          revenueGrowth: parseFloat(revenueGrowth as string)
        },
        traffic: {
          trends: trafficTrends,
          sources: trafficSources,
          campaigns: campaigns,
          mediums: mediums,
          placements: placements
        },
        products: {
          topProducts,
          totalProductViews: totalViews // Approximation
        },
        timeAnalysis: {
          hourly: hourlyData,
          daily: dailyData,
          peakHours: hourlyData
            .filter(h => h.orders > 0)
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
          percentage: allOrdersCount > 0 ? ((count / allOrdersCount) * 100).toFixed(1) : '0.0'
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