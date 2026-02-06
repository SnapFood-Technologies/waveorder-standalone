// src/app/api/admin/stores/[businessId]/orders/production/route.ts
// Production Queue API - shows products to prepare from pending orders
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

interface ProductionItem {
  productId: string
  productName: string
  productImage: string | null
  categoryName: string
  totalQuantity: number
  orderCount: number
  orders: Array<{
    orderId: string
    orderNumber: string
    quantity: number
    customerName: string
    deliveryTime: string | null
    createdAt: string
    status: string
  }>
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

    // Check if production planning is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { 
        showProductionPlanning: true,
        currency: true,
        timezone: true
      }
    })

    if (!business?.showProductionPlanning) {
      return NextResponse.json(
        { message: 'Production planning is not enabled for this business' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today' // today, tomorrow, week, all_pending
    const category = searchParams.get('category') || null

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'tomorrow':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59)
        break
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59)
        break
      case 'all_pending':
      default:
        // No date filter for all pending
        startDate = new Date(0)
        endDate = new Date(9999, 11, 31)
        break
    }

    // Fetch orders that need production (pending, confirmed, preparing statuses)
    // These are orders that haven't been delivered/picked up yet
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']
        },
        // For scheduled orders, filter by deliveryTime date
        // For instant orders, filter by createdAt date
        OR: [
          {
            deliveryTime: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            deliveryTime: null,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: [
        { deliveryTime: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Aggregate by product
    const productMap = new Map<string, ProductionItem>()

    for (const order of orders) {
      for (const item of order.items) {
        if (!item.product) continue
        
        // Filter by category if specified
        if (category && item.product.category?.id !== category) continue

        const existing = productMap.get(item.productId) || {
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.images[0] || null,
          categoryName: item.product.category?.name || 'Uncategorized',
          totalQuantity: 0,
          orderCount: 0,
          orders: []
        }

        existing.totalQuantity += item.quantity
        existing.orderCount += 1
        existing.orders.push({
          orderId: order.id,
          orderNumber: order.orderNumber || `#${order.id.slice(-6)}`,
          quantity: item.quantity,
          customerName: order.customerName || 'Guest',
          deliveryTime: order.deliveryTime?.toISOString() || null,
          createdAt: order.createdAt.toISOString(),
          status: order.status
        })

        productMap.set(item.productId, existing)
      }
    }

    // Convert to array and sort by quantity (highest first)
    const productionItems = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)

    // Get unique categories for filtering
    const categories = await prisma.category.findMany({
      where: { businessId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    // Calculate summary stats
    const totalProducts = productionItems.length
    const totalItems = productionItems.reduce((sum, p) => sum + p.totalQuantity, 0)
    const totalOrders = orders.length

    // Orders by status breakdown
    const ordersByStatus = {
      pending: orders.filter(o => o.status === 'PENDING').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      preparing: orders.filter(o => o.status === 'PREPARING').length,
      ready: orders.filter(o => o.status === 'READY').length
    }

    return NextResponse.json({
      data: {
        productionItems,
        summary: {
          totalProducts,
          totalItems,
          totalOrders,
          ordersByStatus
        },
        categories,
        period,
        timezone: business.timezone,
        currency: business.currency
      }
    })

  } catch (error) {
    console.error('Error fetching production queue:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
