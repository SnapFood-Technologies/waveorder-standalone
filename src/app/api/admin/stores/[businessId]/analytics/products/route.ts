// src/app/api/admin/stores/[businessId]/analytics/products/route.ts
// Product analytics API - tracks views, add-to-cart, and conversions
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

interface ProductAnalyticsData {
  productId: string
  productName: string
  productImage: string | null
  categoryName: string
  views: number
  addToCarts: number
  ordersPlaced: number      // All orders (shows customer intent/demand)
  ordersCompleted: number   // Only delivered/picked_up/ready + paid
  revenue: number           // Revenue from completed orders only
  quantityPlaced: number    // Total quantity ordered
  quantityCompleted: number // Quantity from completed orders
  viewToCartRate: number
  cartToOrderRate: number   // Based on ordersPlaced (customer action)
  conversionRate: number    // Based on ordersPlaced (customer action)
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, week, month, all
    const limit = parseInt(searchParams.get('limit') || '10')

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

    // Fetch product events (views and add-to-cart) with sessionId for abandoned cart tracking
    const productEvents = await prisma.productEvent.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        productId: true,
        eventType: true,
        sessionId: true,
        createdAt: true
      }
    })

    // Aggregate events by product and track which events led to orders
    const eventsByProduct = new Map<string, { views: number; addToCarts: number; viewsThatLedToOrders: number; addToCartsThatLedToOrders: number }>()
    
    for (const event of productEvents) {
      const existing = eventsByProduct.get(event.productId) || { views: 0, addToCarts: 0, viewsThatLedToOrders: 0, addToCartsThatLedToOrders: 0 }
      if (event.eventType === 'view') {
        existing.views++
      } else if (event.eventType === 'add_to_cart') {
        existing.addToCarts++
      }
      eventsByProduct.set(event.productId, existing)
    }

    // Fetch ALL orders with items in the date range (for "Orders Placed" metric)
    const allOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        sessionId: true, // Include sessionId for direct linking
        items: {
          select: {
            productId: true,
            quantity: true,
            price: true
          }
        }
      }
    })

    // Separate completed orders (for revenue calculation)
    const completedOrders = allOrders.filter(order => 
      ['DELIVERED', 'PICKED_UP', 'READY'].includes(order.status) && 
      order.paymentStatus === 'PAID'
    )
    
    // Use allOrders for abandoned cart check (any order counts as conversion)
    const orders = allOrders

    // Aggregate order data by product - track both placed and completed separately
    const ordersByProduct = new Map<string, { 
      ordersPlaced: number; 
      ordersCompleted: number; 
      quantityPlaced: number;
      quantityCompleted: number; 
      revenue: number 
    }>()
    
    // Count ALL orders (Orders Placed)
    for (const order of allOrders) {
      for (const item of order.items) {
        const existing = ordersByProduct.get(item.productId) || { 
          ordersPlaced: 0, 
          ordersCompleted: 0, 
          quantityPlaced: 0,
          quantityCompleted: 0, 
          revenue: 0 
        }
        existing.ordersPlaced++
        existing.quantityPlaced += item.quantity
        ordersByProduct.set(item.productId, existing)
      }
    }
    
    // Count completed orders and revenue separately
    for (const order of completedOrders) {
      for (const item of order.items) {
        const existing = ordersByProduct.get(item.productId) || { 
          ordersPlaced: 0, 
          ordersCompleted: 0, 
          quantityPlaced: 0,
          quantityCompleted: 0, 
          revenue: 0 
        }
        existing.ordersCompleted++
        existing.quantityCompleted += item.quantity
        existing.revenue += item.price * item.quantity
        ordersByProduct.set(item.productId, existing)
      }
    }

    // Calculate abandoned cart rate
    // Definition: Sessions with add_to_cart but no order with matching sessionId
    const addToCartSessions = new Map<string, { productIds: Set<string> }>()
    
    for (const event of productEvents) {
      if (event.eventType === 'add_to_cart' && event.sessionId) {
        const existing = addToCartSessions.get(event.sessionId) || { 
          productIds: new Set<string>()
        }
        existing.productIds.add(event.productId)
        addToCartSessions.set(event.sessionId, existing)
      }
    }

    // Create a set of sessionIds that have orders (for fast lookup)
    const sessionsWithOrders = new Set<string>()
    // Also track which products were ordered per session for accurate conversion tracking
    const sessionsWithOrdersByProduct = new Map<string, Set<string>>()
    for (const order of orders) {
      if (order.sessionId) {
        sessionsWithOrders.add(order.sessionId)
        // Track which products were ordered in this session
        const productIds = new Set(order.items.map(item => item.productId))
        sessionsWithOrdersByProduct.set(order.sessionId, productIds)
      }
    }

    // Track which events led to orders (for accurate conversion rates)
    for (const event of productEvents) {
      if (!event.sessionId) continue
      
      const productId = event.productId
      const existing = eventsByProduct.get(productId)
      if (!existing) continue
      
      // Check if this sessionId has an order that includes this product
      const sessionProductIds = sessionsWithOrdersByProduct.get(event.sessionId)
      if (sessionProductIds && sessionProductIds.has(productId)) {
        if (event.eventType === 'view') {
          existing.viewsThatLedToOrders++
        } else if (event.eventType === 'add_to_cart') {
          existing.addToCartsThatLedToOrders++
        }
        eventsByProduct.set(productId, existing)
      }
    }

    // Check which sessions resulted in orders (direct link via sessionId)
    let abandonedCarts = 0
    let convertedCarts = 0

    for (const [sessionId, cartData] of addToCartSessions) {
      // Direct link: check if this sessionId has any order
      if (sessionsWithOrders.has(sessionId)) {
        // Verify the order contains at least one product from the cart
        const hasMatchingOrder = orders.some(order => 
          order.sessionId === sessionId && 
          order.items.some(item => cartData.productIds.has(item.productId))
        )
        
        if (hasMatchingOrder) {
          convertedCarts++
        } else {
          // Session has order but not for these products - still counts as converted
          convertedCarts++
        }
      } else {
        abandonedCarts++
      }
    }

    const totalCartSessions = abandonedCarts + convertedCarts
    const abandonedCartRate = totalCartSessions > 0
      ? Math.round((abandonedCarts / totalCartSessions) * 1000) / 10
      : 0

    // Get all product IDs that have any activity
    const allProductIds = new Set([
      ...eventsByProduct.keys(),
      ...ordersByProduct.keys()
    ])

    // Fetch product details
    const products = await prisma.product.findMany({
      where: {
        id: { in: Array.from(allProductIds) },
        businessId
      },
      select: {
        id: true,
        name: true,
        images: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    // Build analytics data for each product
    const analyticsData: ProductAnalyticsData[] = []
    
    for (const productId of allProductIds) {
      const product = productMap.get(productId)
      if (!product) continue // Skip if product no longer exists

      const events = eventsByProduct.get(productId) || { views: 0, addToCarts: 0, viewsThatLedToOrders: 0, addToCartsThatLedToOrders: 0 }
      const orderData = ordersByProduct.get(productId) || { 
        ordersPlaced: 0, 
        ordersCompleted: 0, 
        quantityPlaced: 0,
        quantityCompleted: 0, 
        revenue: 0 
      }

      const viewToCartRate = events.views > 0 
        ? (events.addToCarts / events.views) * 100 
        : 0
      
      // Use sessionId linking for accurate conversion rates (direct link via sessionId)
      const cartToOrderRate = events.addToCarts > 0 
        ? (events.addToCartsThatLedToOrders / events.addToCarts) * 100 
        : 0
      
      const conversionRate = events.views > 0 
        ? (events.viewsThatLedToOrders / events.views) * 100 
        : 0

      analyticsData.push({
        productId,
        productName: product.name,
        productImage: product.images[0] || null,
        categoryName: product.category?.name || 'Uncategorized',
        views: events.views,
        addToCarts: events.addToCarts,
        ordersPlaced: orderData.ordersPlaced,
        ordersCompleted: orderData.ordersCompleted,
        revenue: orderData.revenue,
        quantityPlaced: orderData.quantityPlaced,
        quantityCompleted: orderData.quantityCompleted,
        viewToCartRate: Math.round(viewToCartRate * 10) / 10,
        cartToOrderRate: Math.round(cartToOrderRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      })
    }

    // Calculate totals
    const totalViews = analyticsData.reduce((sum, p) => sum + p.views, 0)
    const totalAddToCarts = analyticsData.reduce((sum, p) => sum + p.addToCarts, 0)
    // Use actual order counts, not sum of per-product appearances
    const totalOrdersPlaced = allOrders.length
    const totalOrdersCompleted = completedOrders.length
    const totalRevenue = analyticsData.reduce((sum, p) => sum + p.revenue, 0)
    
    const overallViewToCartRate = totalViews > 0 
      ? Math.round((totalAddToCarts / totalViews) * 1000) / 10 
      : 0
    
    // Use ordersPlaced for conversion rates (customer action)
    const overallCartToOrderRate = totalAddToCarts > 0 
      ? Math.round((totalOrdersPlaced / totalAddToCarts) * 1000) / 10 
      : 0
    
    const overallConversionRate = totalViews > 0 
      ? Math.round((totalOrdersPlaced / totalViews) * 1000) / 10 
      : 0

    // Sort and slice for different lists - use ordersPlaced for sorting
    const bestSellers = [...analyticsData]
      .sort((a, b) => b.ordersPlaced - a.ordersPlaced)
      .slice(0, limit)

    const mostViewed = [...analyticsData]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    // Opportunity products: high views (>10) but low conversion (<5%)
    const opportunityProducts = [...analyticsData]
      .filter(p => p.views >= 10 && p.conversionRate < 5)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    // Low performing: products with add-to-carts but no orders placed
    const lowPerforming = [...analyticsData]
      .filter(p => p.addToCarts > 0 && p.ordersPlaced === 0)
      .sort((a, b) => b.addToCarts - a.addToCarts)
      .slice(0, limit)

    return NextResponse.json({
      data: {
        summary: {
          totalViews,
          totalAddToCarts,
          totalOrdersPlaced,     // All orders (customer intent)
          totalOrdersCompleted,  // Fulfilled orders only
          totalRevenue,          // From completed orders only
          overallViewToCartRate,
          overallCartToOrderRate,
          overallConversionRate,
          uniqueProducts: analyticsData.length,
          // Abandoned cart metrics
          abandonedCarts,
          convertedCarts,
          totalCartSessions,
          abandonedCartRate
        },
        bestSellers,
        mostViewed,
        opportunityProducts,
        lowPerforming,
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
