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
  orders: number
  revenue: number
  quantity: number
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

    // Fetch product events (views and add-to-cart)
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
        eventType: true
      }
    })

    // Aggregate events by product
    const eventsByProduct = new Map<string, { views: number; addToCarts: number }>()
    
    for (const event of productEvents) {
      const existing = eventsByProduct.get(event.productId) || { views: 0, addToCarts: 0 }
      if (event.eventType === 'view') {
        existing.views++
      } else if (event.eventType === 'add_to_cart') {
        existing.addToCarts++
      }
      eventsByProduct.set(event.productId, existing)
    }

    // Fetch completed orders with items in the date range
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // Only count completed orders
        status: {
          in: ['DELIVERED', 'PICKED_UP', 'READY']
        },
        paymentStatus: 'PAID'
      },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            price: true
          }
        }
      }
    })

    // Aggregate order data by product
    const ordersByProduct = new Map<string, { orders: number; quantity: number; revenue: number }>()
    
    for (const order of orders) {
      for (const item of order.items) {
        const existing = ordersByProduct.get(item.productId) || { orders: 0, quantity: 0, revenue: 0 }
        existing.orders++
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
        ordersByProduct.set(item.productId, existing)
      }
    }

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

      const events = eventsByProduct.get(productId) || { views: 0, addToCarts: 0 }
      const orderData = ordersByProduct.get(productId) || { orders: 0, quantity: 0, revenue: 0 }

      const viewToCartRate = events.views > 0 
        ? (events.addToCarts / events.views) * 100 
        : 0
      
      const cartToOrderRate = events.addToCarts > 0 
        ? (orderData.orders / events.addToCarts) * 100 
        : 0
      
      const conversionRate = events.views > 0 
        ? (orderData.orders / events.views) * 100 
        : 0

      analyticsData.push({
        productId,
        productName: product.name,
        productImage: product.images[0] || null,
        categoryName: product.category?.name || 'Uncategorized',
        views: events.views,
        addToCarts: events.addToCarts,
        orders: orderData.orders,
        revenue: orderData.revenue,
        quantity: orderData.quantity,
        viewToCartRate: Math.round(viewToCartRate * 10) / 10,
        cartToOrderRate: Math.round(cartToOrderRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      })
    }

    // Calculate totals
    const totalViews = analyticsData.reduce((sum, p) => sum + p.views, 0)
    const totalAddToCarts = analyticsData.reduce((sum, p) => sum + p.addToCarts, 0)
    const totalOrders = analyticsData.reduce((sum, p) => sum + p.orders, 0)
    const totalRevenue = analyticsData.reduce((sum, p) => sum + p.revenue, 0)
    
    const overallViewToCartRate = totalViews > 0 
      ? Math.round((totalAddToCarts / totalViews) * 1000) / 10 
      : 0
    
    const overallCartToOrderRate = totalAddToCarts > 0 
      ? Math.round((totalOrders / totalAddToCarts) * 1000) / 10 
      : 0
    
    const overallConversionRate = totalViews > 0 
      ? Math.round((totalOrders / totalViews) * 1000) / 10 
      : 0

    // Sort and slice for different lists
    const bestSellers = [...analyticsData]
      .sort((a, b) => b.orders - a.orders)
      .slice(0, limit)

    const mostViewed = [...analyticsData]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    // Opportunity products: high views (>10) but low conversion (<5%)
    const opportunityProducts = [...analyticsData]
      .filter(p => p.views >= 10 && p.conversionRate < 5)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    // Low performing: products with add-to-carts but no orders
    const lowPerforming = [...analyticsData]
      .filter(p => p.addToCarts > 0 && p.orders === 0)
      .sort((a, b) => b.addToCarts - a.addToCarts)
      .slice(0, limit)

    return NextResponse.json({
      data: {
        summary: {
          totalViews,
          totalAddToCarts,
          totalOrders,
          totalRevenue,
          overallViewToCartRate,
          overallCartToOrderRate,
          overallConversionRate,
          uniqueProducts: analyticsData.length
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
