// src/app/api/admin/stores/[businessId]/analytics/advanced/route.ts
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

    // Fetch BOTH old Analytics data AND new VisitorSession data
    // Old Analytics table (legacy data)
    const oldAnalytics = await prisma.analytics.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    })
    
    // New VisitorSession table (individual visits)
    const visitorSessions = await prisma.visitorSession.findMany({
      where: {
        businessId,
        visitedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { visitedAt: 'asc' }
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

    // Calculate overview metrics - COMBINE old Analytics + new VisitorSessions
    const oldViews = oldAnalytics.reduce((sum, a) => sum + a.visitors, 0)
    const newViews = visitorSessions.length
    const totalViews = oldViews + newViews
    
    // Unique visitors: count from VisitorSessions + estimate from old Analytics
    const newUniqueVisitors = new Set(visitorSessions.map(s => s.ipAddress)).size
    const uniqueVisitors = newUniqueVisitors + oldViews // Estimate: treat old visitors as unique
    
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

    // Calculate bounce rate from VisitorSession data
    // A "bounce" is when a visitor only has one session/pageview
    // Group sessions by IP to identify visitors with single visits
    const visitorsByIp = new Map<string, number>()
    visitorSessions.forEach(session => {
      const ip = session.ipAddress || 'unknown'
      visitorsByIp.set(ip, (visitorsByIp.get(ip) || 0) + 1)
    })
    
    const totalUniqueVisitorsFromSessions = visitorsByIp.size
    const singleVisitVisitors = Array.from(visitorsByIp.values()).filter(count => count === 1).length
    const bounceRate = totalUniqueVisitorsFromSessions > 0 
      ? Math.round((singleVisitVisitors / totalUniqueVisitorsFromSessions) * 100)
      : 0
    
    // Session duration: We don't have exit time tracking yet, so this remains estimated
    // For a real implementation, you would need to track when visitors leave or add pageview events
    const avgSessionDuration = 180 // Placeholder - requires additional tracking implementation

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodDuration)
    const prevEndDate = new Date(startDate.getTime() - 1)

    // Previous period - COMBINE old and new data
    const prevOldAnalytics = await prisma.analytics.findMany({
      where: {
        businessId,
        date: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    })
    
    const prevVisitorSessions = await prisma.visitorSession.findMany({
      where: {
        businessId,
        visitedAt: {
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

    const prevOldViews = prevOldAnalytics.reduce((sum, a) => sum + a.visitors, 0)
    const prevNewViews = prevVisitorSessions.length
    const prevViews = prevOldViews + prevNewViews
    const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + o.total, 0)

    const viewsGrowth = prevViews > 0 ? (((totalViews - prevViews) / prevViews) * 100).toFixed(1) : 0
    const revenueGrowth = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0

    // Traffic trends (daily breakdown) - COMBINE old Analytics + new VisitorSessions
    const dailyVisits = new Map<string, number>()
    
    // Add old Analytics data
    oldAnalytics.forEach(analytics => {
      const dateStr = analytics.date.toISOString().split('T')[0]
      dailyVisits.set(dateStr, (dailyVisits.get(dateStr) || 0) + analytics.visitors)
    })
    
    // Add new VisitorSession data
    visitorSessions.forEach(session => {
      const dateStr = session.visitedAt.toISOString().split('T')[0]
      dailyVisits.set(dateStr, (dailyVisits.get(dateStr) || 0) + 1)
    })

    const trafficTrends = Array.from(dailyVisits.entries()).map(([date, visitors]) => ({
      date,
      visitors,
      orders: completedOrders.filter(o => 
        o.createdAt.toISOString().split('T')[0] === date
      ).length
    })).sort((a, b) => a.date.localeCompare(b.date))

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

    // Add old Analytics visitor data to daily breakdown
    oldAnalytics.forEach(analytics => {
      const dayOfWeek = analytics.date.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      dailyData[adjustedDay].visitors += analytics.visitors
    })
    
    // Add new VisitorSession data to daily breakdown
    visitorSessions.forEach(session => {
      const dayOfWeek = session.visitedAt.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      dailyData[adjustedDay].visitors++
    })

    // Customer analysis
    const uniqueCustomers = new Set(orders.map(o => o.customerId))
    const repeatCustomers = orders.reduce((acc, order) => {
      const customerOrders = orders.filter(o => o.customerId === order.customerId)
      if (customerOrders.length > 1) acc.add(order.customerId)
      return acc
    }, new Set())

    // Traffic sources analysis - COMBINE old Analytics + new VisitorSessions
    const sourceStats = new Map<string, { visitors: number, orders: number }>()
    const campaignStats = new Map<string, { visitors: number, orders: number }>()
    const mediumStats = new Map<string, { visitors: number, orders: number }>()
    const placementStats = new Map<string, { visitors: number, orders: number }>()
    
    // Add old Analytics data (treat as "direct" if no source specified)
    oldAnalytics.forEach(analytics => {
      const source = analytics.source || 'direct'
      const existingSource = sourceStats.get(source) || { visitors: 0, orders: 0 }
      existingSource.visitors += analytics.visitors
      sourceStats.set(source, existingSource)
      
      if (analytics.campaign) {
        const existingCampaign = campaignStats.get(analytics.campaign) || { visitors: 0, orders: 0 }
        existingCampaign.visitors += analytics.visitors
        campaignStats.set(analytics.campaign, existingCampaign)
      }
      
      if (analytics.medium) {
        const existingMedium = mediumStats.get(analytics.medium) || { visitors: 0, orders: 0 }
        existingMedium.visitors += analytics.visitors
        mediumStats.set(analytics.medium, existingMedium)
      }
      
      if (analytics.placement) {
        const existingPlacement = placementStats.get(analytics.placement) || { visitors: 0, orders: 0 }
        existingPlacement.visitors += analytics.visitors
        placementStats.set(analytics.placement, existingPlacement)
      }
    })
    
    // Add new VisitorSession data
    visitorSessions.forEach(session => {
      // Sources
      const source = session.source || 'direct'
      const existingSource = sourceStats.get(source) || { visitors: 0, orders: 0 }
      existingSource.visitors++
      sourceStats.set(source, existingSource)

      // Campaigns
      if (session.campaign) {
        const existingCampaign = campaignStats.get(session.campaign) || { visitors: 0, orders: 0 }
        existingCampaign.visitors++
        campaignStats.set(session.campaign, existingCampaign)
      }

      // Medium
      if (session.medium) {
        const existingMedium = mediumStats.get(session.medium) || { visitors: 0, orders: 0 }
        existingMedium.visitors++
        mediumStats.set(session.medium, existingMedium)
      }

      // Placement
      if (session.placement) {
        const existingPlacement = placementStats.get(session.placement) || { visitors: 0, orders: 0 }
        existingPlacement.visitors++
        placementStats.set(session.placement, existingPlacement)
      }
    })

    // Count orders - match orders to sessions by timestamp proximity
    // For simplicity, we'll distribute orders across sources proportionally
    // In a production system, you might track orderId in VisitorSession
    const totalSessionsWithOrders = sourceStats.size > 0 ? completedOrders.length : 0
    if (totalSessionsWithOrders > 0 && sourceStats.size > 0) {
      // Simple distribution: proportional to visitor count
      const totalSessionVisitors = Array.from(sourceStats.values()).reduce((sum, s) => sum + s.visitors, 0)
      completedOrders.forEach(() => {
        sourceStats.forEach((stats, source) => {
          const orderShare = totalSessionsWithOrders * (stats.visitors / totalSessionVisitors)
          stats.orders = Math.round(orderShare)
        })
      })
      
      // Similarly for campaigns, mediums, placements
      const totalCampaignVisitors = Array.from(campaignStats.values()).reduce((sum, s) => sum + s.visitors, 0)
      if (totalCampaignVisitors > 0) {
        campaignStats.forEach((stats) => {
          stats.orders = Math.round(totalSessionsWithOrders * (stats.visitors / totalCampaignVisitors))
        })
      }
      
      const totalMediumVisitors = Array.from(mediumStats.values()).reduce((sum, s) => sum + s.visitors, 0)
      if (totalMediumVisitors > 0) {
        mediumStats.forEach((stats) => {
          stats.orders = Math.round(totalSessionsWithOrders * (stats.visitors / totalMediumVisitors))
        })
      }
      
      const totalPlacementVisitors = Array.from(placementStats.values()).reduce((sum, s) => sum + s.visitors, 0)
      if (totalPlacementVisitors > 0) {
        placementStats.forEach((stats) => {
          stats.orders = Math.round(totalSessionsWithOrders * (stats.visitors / totalPlacementVisitors))
        })
      }
    }

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
          uniqueVisitors: uniqueVisitors,
          totalOrders: completedOrdersCount, // Only count completed (DELIVERED + PAID) orders
          revenue: totalRevenue, // Only revenue from completed orders
          conversionRate: parseFloat(conversionRate as string),
          avgOrderValue,
          bounceRate, // Calculated from VisitorSession data (single-visit visitors / total visitors)
          avgSessionDuration, // Placeholder - requires exit time tracking implementation
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