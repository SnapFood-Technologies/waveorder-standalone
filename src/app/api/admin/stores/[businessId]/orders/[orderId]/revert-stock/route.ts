// src/app/api/admin/stores/[businessId]/orders/[orderId]/revert-stock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const { businessId, orderId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

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

    if (order.status !== 'CANCELLED') {
      return NextResponse.json({ 
        message: 'Can only revert stock for cancelled orders' 
      }, { status: 400 })
    }

    let revertedItems = 0

    for (const item of order.items) {
      if (!item.product.trackInventory) {
        continue
      }

      try {
        const newProductStock = item.product.stock + item.quantity

        await prisma.product.update({
          where: { id: item.product.id },
          data: { stock: newProductStock }
        })

        await prisma.inventoryActivity.create({
          data: {
            productId: item.product.id,
            businessId,
            type: 'RETURN',
            quantity: item.quantity,
            oldStock: item.product.stock,
            newStock: newProductStock,
            reason: `Order cancellation revert - Order #${order.orderNumber}`,
            changedBy: access.session.user.id
          }
        })

        if (item.variantId && item.variant) {
          const newVariantStock = item.variant.stock + item.quantity

          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: newVariantStock }
          })

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
              changedBy: access.session.user.id
            }
          })
        }

        revertedItems++

      } catch (error) {
        console.error(`Error reverting stock for item ${item.id}:`, error)
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