// src/app/api/admin/stores/[businessId]/products/[productId]/analytics/route.ts
// Individual product analytics API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const { businessId, productId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, week, month, all

    // Verify product exists and belongs to this business
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId
      },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

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

    // Fetch product events with sessionId for linking to orders
    const productEvents = await prisma.productEvent.findMany({
      where: {
        businessId,
        productId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        eventType: true,
        source: true,
        sessionId: true, // Include sessionId for linking to orders
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Fetch ALL order items for this product (Orders Placed)
    const allOrderItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          businessId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      select: {
        quantity: true,
        price: true,
        order: {
          select: {
            createdAt: true,
            status: true,
            paymentStatus: true,
            sessionId: true // Include sessionId for linking to events
          }
        }
      }
    })

    // Filter completed orders (for revenue calculation)
    const completedOrderItems = allOrderItems.filter(item => 
      ['DELIVERED', 'PICKED_UP', 'READY'].includes(item.order.status) && 
      item.order.paymentStatus === 'PAID'
    )

    const totalOrdersPlaced = allOrderItems.length
    const totalOrdersCompleted = completedOrderItems.length
    const totalQuantityPlaced = allOrderItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalQuantityCompleted = completedOrderItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRevenue = completedOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Aggregate events and track which events led to orders (after fetching orders)
    let totalViews = 0
    let totalAddToCarts = 0
    let viewsThatLedToOrders = 0
    let addToCartsThatLedToOrders = 0
    const sourceBreakdown: Record<string, { views: number; addToCarts: number; viewsConverted: number; cartsConverted: number }> = {}
    
    // Create a set of sessionIds that have orders for this product
    const sessionsWithOrders = new Set<string>()
    for (const item of allOrderItems) {
      if (item.order.sessionId) {
        sessionsWithOrders.add(item.order.sessionId)
      }
    }
    
    // Process events and link them to orders via sessionId
    for (const event of productEvents) {
      const source = event.source || 'unknown'
      if (!sourceBreakdown[source]) {
        sourceBreakdown[source] = { views: 0, addToCarts: 0, viewsConverted: 0, cartsConverted: 0 }
      }
      
      const eventLedToOrder = event.sessionId ? sessionsWithOrders.has(event.sessionId) : false
      
      if (event.eventType === 'view') {
        totalViews++
        sourceBreakdown[source].views++
        if (eventLedToOrder) {
          viewsThatLedToOrders++
          sourceBreakdown[source].viewsConverted++
        }
      } else if (event.eventType === 'add_to_cart') {
        totalAddToCarts++
        sourceBreakdown[source].addToCarts++
        if (eventLedToOrder) {
          addToCartsThatLedToOrders++
          sourceBreakdown[source].cartsConverted++
        }
      }
    }

    // Calculate conversion rates
    // viewToCartRate: % of views that resulted in add_to_cart
    const viewToCartRate = totalViews > 0 
      ? Math.round((totalAddToCarts / totalViews) * 1000) / 10 
      : 0
    
    // cartToOrderRate: % of add_to_cart events that led to actual orders (direct link via sessionId)
    const cartToOrderRate = totalAddToCarts > 0 
      ? Math.round((addToCartsThatLedToOrders / totalAddToCarts) * 1000) / 10 
      : 0
    
    // conversionRate: % of views that led to actual orders (direct link via sessionId)
    const conversionRate = totalViews > 0 
      ? Math.round((viewsThatLedToOrders / totalViews) * 1000) / 10 
      : 0

    // Build daily trends for chart (using all orders for trends)
    const dailyTrends = buildDailyTrends(productEvents, allOrderItems, startDate, endDate)

    return NextResponse.json({
      data: {
        product: {
          id: product.id,
          name: product.name,
          image: product.images[0] || null,
          price: product.price,
          category: product.category?.name || 'Uncategorized'
        },
        summary: {
          totalViews,
          totalAddToCarts,
          totalOrdersPlaced,     // All orders (customer intent)
          totalOrdersCompleted,  // Fulfilled orders only
          totalQuantityPlaced,
          totalQuantityCompleted,
          totalRevenue,          // From completed orders only
          viewToCartRate,
          cartToOrderRate,
          conversionRate
        },
        sourceBreakdown: Object.entries(sourceBreakdown).map(([source, data]) => ({
          source,
          views: data.views,
          addToCarts: data.addToCarts,
          viewsConverted: data.viewsConverted,
          cartsConverted: data.cartsConverted,
          viewConversionRate: data.views > 0 ? Math.round((data.viewsConverted / data.views) * 1000) / 10 : 0,
          cartConversionRate: data.addToCarts > 0 ? Math.round((data.cartsConverted / data.addToCarts) * 1000) / 10 : 0
        })),
        // Additional metrics showing direct event-to-order linking
        eventToOrderLinking: {
          viewsThatLedToOrders,
          addToCartsThatLedToOrders,
          totalViews,
          totalAddToCarts
        },
        dailyTrends,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Build daily trends for charting
function buildDailyTrends(
  events: Array<{ eventType: string; createdAt: Date }>,
  orderItems: Array<{ order: { createdAt: Date; status: string; paymentStatus: string }; quantity: number }>,
  startDate: Date,
  endDate: Date
) {
  const trends: Array<{
    date: string
    views: number
    addToCarts: number
    orders: number
  }> = []

  // Create a map for quick lookups
  const dateMap = new Map<string, { views: number; addToCarts: number; orders: number }>()

  // Process events
  for (const event of events) {
    const dateKey = event.createdAt.toISOString().split('T')[0]
    const existing = dateMap.get(dateKey) || { views: 0, addToCarts: 0, orders: 0 }
    
    if (event.eventType === 'view') {
      existing.views++
    } else if (event.eventType === 'add_to_cart') {
      existing.addToCarts++
    }
    
    dateMap.set(dateKey, existing)
  }

  // Process orders
  for (const item of orderItems) {
    const dateKey = item.order.createdAt.toISOString().split('T')[0]
    const existing = dateMap.get(dateKey) || { views: 0, addToCarts: 0, orders: 0 }
    existing.orders++
    dateMap.set(dateKey, existing)
  }

  // Fill in all dates in range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    const data = dateMap.get(dateKey) || { views: 0, addToCarts: 0, orders: 0 }
    
    trends.push({
      date: dateKey,
      ...data
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return trends
}
