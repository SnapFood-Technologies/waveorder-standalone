// src/app/api/v1/orders/route.ts
/**
 * Public API v1: Orders endpoint
 * GET - List orders (read-only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - List Orders
// ===========================================
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'orders:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon - redirect to appointments endpoint
    const businessCheck = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if ((businessCheck?.businessType === 'SALON' || businessCheck?.businessType === 'SERVICES')) {
      return NextResponse.json(
        { error: 'Orders endpoint is not available for SALON businesses. Use /appointments endpoint instead.' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const status = searchParams.get('status')
    const type = searchParams.get('type') // DELIVERY, PICKUP, DINE_IN
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      businessId: auth.businessId
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate)
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate)
      }
    }

    // Fetch orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          type: true,
          total: true,
          subtotal: true,
          deliveryFee: true,
          discount: true,
          tax: true,
          paymentMethod: true,
          paymentStatus: true,
          notes: true,
          customerName: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              quantity: true,
              price: true,
              originalPrice: true,
              product: {
                select: {
                  name: true
                }
              },
              variant: {
                select: {
                  name: true
                }
              }
            }
          },
          deliveryAddress: true,
          deliveryTime: true,
          createdAt: true,
          updatedAt: true
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ])

    // Transform items to include product/variant names
    const transformedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || null,
        variantId: item.variantId,
        variantName: item.variant?.name || null,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice
      }))
    }))

    const response = NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Orders GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
