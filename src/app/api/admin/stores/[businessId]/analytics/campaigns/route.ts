// src/app/api/admin/stores/[businessId]/analytics/campaigns/route.ts
// Campaign Analytics API - tracks UTM campaign performance for product events
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

interface CampaignData {
  campaign: string | null
  source: string | null
  medium: string | null
  views: number
  addToCarts: number
  orders: number // Orders linked via sessionId
  revenue: number
  viewToCartRate: number
  cartToOrderRate: number
  conversionRate: number
}

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

    // Check if business has PRO or BUSINESS plan
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionPlan: true }
    })

    if (!business || (business.subscriptionPlan !== 'PRO' && business.subscriptionPlan !== 'BUSINESS')) {
      return NextResponse.json(
        { message: 'Campaign Analytics is only available for PRO and BUSINESS plans' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, week, month, all

    // Calculate date range based on period
    let startDate: Date
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    const now = new Date()
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all':
      default:
        startDate = new Date(0) // Beginning of time
        break
    }

    // Fetch product events with UTM params
    const productEvents = await prisma.productEvent.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // Only include events with UTM campaign (or at least source/medium)
        OR: [
          { utmCampaign: { not: null } },
          { utmSource: { not: null } }
        ]
      },
      select: {
        eventType: true,
        sessionId: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        createdAt: true
      }
    })

    // Fetch orders with sessionId and UTM params
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // Only include orders with UTM campaign or source
        OR: [
          { utmCampaign: { not: null } },
          { utmSource: { not: null } }
        ]
      },
      select: {
        id: true,
        sessionId: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        status: true,
        paymentStatus: true,
        total: true,
        items: {
          select: {
            price: true,
            quantity: true
          }
        }
      }
    })

    // Create a set of sessionIds that have orders (for fast lookup)
    const sessionsWithOrders = new Set<string>()
    const ordersBySession = new Map<string, Array<{ total: number; status: string; paymentStatus: string }>>()
    
    for (const order of orders) {
      if (order.sessionId) {
        sessionsWithOrders.add(order.sessionId)
        const existing = ordersBySession.get(order.sessionId) || []
        existing.push({
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus
        })
        ordersBySession.set(order.sessionId, existing)
      }
    }

    // Aggregate events by campaign (group by utmCampaign, utmSource, utmMedium)
    const campaignsMap = new Map<string, CampaignData>()

    for (const event of productEvents) {
      // Create campaign key: campaign_source_medium (or source_medium if no campaign)
      const campaignKey = event.utmCampaign 
        ? `${event.utmCampaign}_${event.utmSource || 'unknown'}_${event.utmMedium || 'unknown'}`
        : `${event.utmSource || 'unknown'}_${event.utmMedium || 'unknown'}`

      const existing = campaignsMap.get(campaignKey) || {
        campaign: event.utmCampaign || null,
        source: event.utmSource || null,
        medium: event.utmMedium || null,
        views: 0,
        addToCarts: 0,
        orders: 0,
        revenue: 0,
        viewToCartRate: 0,
        cartToOrderRate: 0,
        conversionRate: 0
      }

      if (event.eventType === 'view') {
        existing.views++
      } else if (event.eventType === 'add_to_cart') {
        existing.addToCarts++
      }

      // Check if this event led to an order (via sessionId)
      if (event.sessionId && sessionsWithOrders.has(event.sessionId)) {
        const sessionOrders = ordersBySession.get(event.sessionId) || []
        // Count completed orders (DELIVERED/PICKED_UP + PAID)
        const completedOrders = sessionOrders.filter(o => 
          ['DELIVERED', 'PICKED_UP', 'READY'].includes(o.status) && 
          o.paymentStatus === 'PAID'
        )
        existing.orders += completedOrders.length
        existing.revenue += completedOrders.reduce((sum, o) => sum + o.total, 0)
      }

      campaignsMap.set(campaignKey, existing)
    }

    // Calculate conversion rates for each campaign
    const campaigns: CampaignData[] = []
    for (const campaign of campaignsMap.values()) {
      campaign.viewToCartRate = campaign.views > 0 
        ? Math.round((campaign.addToCarts / campaign.views) * 1000) / 10 
        : 0
      
      campaign.cartToOrderRate = campaign.addToCarts > 0 
        ? Math.round((campaign.orders / campaign.addToCarts) * 1000) / 10 
        : 0
      
      campaign.conversionRate = campaign.views > 0 
        ? Math.round((campaign.orders / campaign.views) * 1000) / 10 
        : 0

      campaigns.push(campaign)
    }

    // Sort by revenue (descending)
    campaigns.sort((a, b) => b.revenue - a.revenue)

    // Calculate totals
    const totalViews = campaigns.reduce((sum, c) => sum + c.views, 0)
    const totalAddToCarts = campaigns.reduce((sum, c) => sum + c.addToCarts, 0)
    const totalOrders = campaigns.reduce((sum, c) => sum + c.orders, 0)
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)

    return NextResponse.json({
      data: {
        campaigns,
        summary: {
          totalCampaigns: campaigns.length,
          totalViews,
          totalAddToCarts,
          totalOrders,
          totalRevenue,
          overallViewToCartRate: totalViews > 0 
            ? Math.round((totalAddToCarts / totalViews) * 1000) / 10 
            : 0,
          overallCartToOrderRate: totalAddToCarts > 0 
            ? Math.round((totalOrders / totalAddToCarts) * 1000) / 10 
            : 0,
          overallConversionRate: totalViews > 0 
            ? Math.round((totalOrders / totalViews) * 1000) / 10 
            : 0
        },
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching campaign analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
