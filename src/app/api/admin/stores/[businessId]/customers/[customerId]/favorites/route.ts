// src/app/api/admin/stores/[businessId]/customers/[customerId]/favorites/route.ts
// Customer favorite products API - returns most ordered products for a customer
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const { businessId, customerId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Verify customer exists and belongs to this business
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId
      },
      select: {
        id: true,
        name: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get all order items for this customer with product details
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          customerId,
          businessId,
          // Only count completed orders
          status: {
            in: ['DELIVERED', 'PICKED_UP', 'READY']
          },
          paymentStatus: 'PAID'
        }
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
        product: {
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
        },
        order: {
          select: {
            createdAt: true
          }
        }
      }
    })

    // Aggregate by product
    const productMap = new Map<string, {
      productId: string
      productName: string
      productImage: string | null
      categoryName: string
      currentPrice: number
      timesOrdered: number
      totalQuantity: number
      totalSpent: number
      lastOrderedDate: Date
    }>()

    for (const item of orderItems) {
      if (!item.product) continue // Skip if product was deleted

      const existing = productMap.get(item.productId)
      const orderDate = new Date(item.order.createdAt)

      if (existing) {
        existing.timesOrdered++
        existing.totalQuantity += item.quantity
        existing.totalSpent += item.price * item.quantity
        if (orderDate > existing.lastOrderedDate) {
          existing.lastOrderedDate = orderDate
        }
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.images[0] || null,
          categoryName: item.product.category?.name || 'Uncategorized',
          currentPrice: item.product.price,
          timesOrdered: 1,
          totalQuantity: item.quantity,
          totalSpent: item.price * item.quantity,
          lastOrderedDate: orderDate
        })
      }
    }

    // Convert to array and sort by times ordered (descending)
    const favorites = Array.from(productMap.values())
      .sort((a, b) => b.timesOrdered - a.timesOrdered)
      .slice(0, 10) // Return top 10
      .map(product => ({
        ...product,
        lastOrderedDate: product.lastOrderedDate.toISOString()
      }))

    return NextResponse.json({
      customerId,
      customerName: customer.name,
      favorites,
      totalUniqueProducts: productMap.size
    })

  } catch (error) {
    console.error('Error fetching customer favorites:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
