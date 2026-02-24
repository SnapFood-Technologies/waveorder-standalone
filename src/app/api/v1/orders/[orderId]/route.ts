// src/app/api/v1/orders/[orderId]/route.ts
/**
 * Public API v1: Individual order endpoint
 * GET - Get single order (read-only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - Get Single Order
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'orders:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon - redirect to appointments endpoint
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if ((business?.businessType === 'SALON' || business?.businessType === 'SERVICES')) {
      return NextResponse.json(
        { error: 'Orders endpoint is not available for SALON businesses. Use /appointments endpoint instead.' },
        { status: 403 }
      )
    }

    const { orderId } = await params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId: auth.businessId
      },
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
            phone: true,
            address: true
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
            modifiers: true,
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
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform items to include product/variant names
    const transformedOrder = {
      ...order,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || null,
        variantId: item.variantId,
        variantName: item.variant?.name || null,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        modifiers: item.modifiers
      }))
    }

    const response = NextResponse.json({ order: transformedOrder })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Order GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
