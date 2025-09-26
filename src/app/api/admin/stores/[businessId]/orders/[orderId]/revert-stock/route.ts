// src/app/api/admin/stores/[businessId]/orders/[orderId]/revert-stock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get order with items
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId: businessId
      },
      include: {
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                stock: true, 
                trackInventory: true 
              }
            },
            variant: {
              select: { 
                id: true, 
                name: true, 
                stock: true 
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Check if order is cancelled
    if (order.status !== 'CANCELLED') {
      return NextResponse.json({ 
        message: 'Can only revert stock for cancelled orders' 
      }, { status: 400 })
    }

    let revertedItems = 0

    // Process each order item to revert stock
    for (const item of order.items) {
      // Only revert if inventory tracking is enabled
      if (!item.product.trackInventory) {
        continue
      }

      try {
        // Revert product stock
        const newProductStock = item.product.stock + item.quantity

        await prisma.product.update({
          where: { id: item.product.id },
          data: { stock: newProductStock }
        })

        // Create inventory activity for product
        await prisma.inventoryActivity.create({
          data: {
            productId: item.product.id,
            businessId,
            type: 'RETURN', // Using RETURN type for cancelled order reverts
            quantity: item.quantity, // Positive because we're adding back
            oldStock: item.product.stock,
            newStock: newProductStock,
            reason: `Order cancellation revert - Order #${order.orderNumber}`,
            changedBy: session.user.id
          }
        })

        // Handle variant stock if applicable
        if (item.variantId && item.variant) {
          const newVariantStock = item.variant.stock + item.quantity

          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: newVariantStock }
          })

          // Create inventory activity for variant
          await prisma.inventoryActivity.create({
            data: {
              productId: item.product.id,
              variantId: item.variantId,
              businessId,
              type: 'RETURN',
              quantity: item.quantity,
              oldStock: item.variant.stock,
              newStock: newVariantStock,
              reason: `Order cancellation revert - Order #${order.orderNumber} (Variant: ${item.variant.name})`,
              changedBy: session.user.id
            }
          })
        }

        revertedItems++

      } catch (error) {
        console.error(`Error reverting stock for item ${item.id}:`, error)
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({
      message: `Successfully reverted stock for ${revertedItems} items`,
      revertedItems,
      totalItems: order.items.length
    })

  } catch (error) {
    console.error('Error reverting order stock:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}