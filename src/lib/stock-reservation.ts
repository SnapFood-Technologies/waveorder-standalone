// src/lib/stock-reservation.ts
import { prisma } from '@/lib/prisma'

interface OrderItem {
  productId: string
  variantId?: string | null
  quantity: number
}

/**
 * Reserve stock for order items when an order is created
 * This prevents overselling by tracking reserved stock separately
 */
export async function reserveStock(items: OrderItem[]): Promise<{ success: boolean; error?: string }> {
  try {
    for (const item of items) {
      if (item.variantId) {
        // Reserve variant stock
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { trackInventory: true } } }
        })

        if (!variant || !variant.product.trackInventory) continue

        const availableStock = variant.stock - variant.reservedStock
        if (availableStock < item.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for variant ${variant.name}. Available: ${availableStock}` 
          }
        }

        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { reservedStock: { increment: item.quantity } }
        })
      } else {
        // Reserve product stock
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })

        if (!product || !product.trackInventory) continue

        const availableStock = product.stock - product.reservedStock
        if (availableStock < item.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for product. Available: ${availableStock}` 
          }
        }

        await prisma.product.update({
          where: { id: item.productId },
          data: { reservedStock: { increment: item.quantity } }
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reserving stock:', error)
    return { success: false, error: 'Failed to reserve stock' }
  }
}

/**
 * Release reserved stock when an order is cancelled
 */
export async function releaseReservedStock(items: OrderItem[]): Promise<void> {
  try {
    for (const item of items) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { reservedStock: { decrement: item.quantity } }
        })
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { reservedStock: { decrement: item.quantity } }
        })
      }
    }
  } catch (error) {
    console.error('Error releasing reserved stock:', error)
  }
}

/**
 * Commit reserved stock when an order is completed
 * This converts reserved stock to actual stock deduction
 */
export async function commitReservedStock(
  items: OrderItem[], 
  businessId: string
): Promise<void> {
  try {
    for (const item of items) {
      if (item.variantId) {
        // Deduct from actual stock and release reservation
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { 
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity }
          }
        })

        // Log inventory activity
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId }
        })
        
        if (variant) {
          await (prisma as any).inventoryActivity.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              businessId,
              type: 'ORDER_SALE',
              quantity: -item.quantity,
              oldStock: variant.stock + item.quantity,
              newStock: variant.stock,
              reason: 'Order completed',
              changedBy: 'system'
            }
          })
        }
      } else {
        // Deduct from actual stock and release reservation
        await prisma.product.update({
          where: { id: item.productId },
          data: { 
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity }
          }
        })

        // Log inventory activity
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        
        if (product) {
          await (prisma as any).inventoryActivity.create({
            data: {
              productId: item.productId,
              businessId,
              type: 'ORDER_SALE',
              quantity: -item.quantity,
              oldStock: product.stock + item.quantity,
              newStock: product.stock,
              reason: 'Order completed',
              changedBy: 'system'
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error committing reserved stock:', error)
  }
}

/**
 * Get available stock (actual stock minus reserved)
 */
export function getAvailableStock(stock: number, reservedStock: number): number {
  return Math.max(0, stock - reservedStock)
}

/**
 * Check if stock is available for an order
 */
export async function checkStockAvailability(items: OrderItem[]): Promise<{ 
  available: boolean
  unavailableItems: { productId: string; variantId?: string; requested: number; available: number }[]
}> {
  const unavailableItems: { productId: string; variantId?: string; requested: number; available: number }[] = []

  for (const item of items) {
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { select: { trackInventory: true } } }
      })

      if (variant && variant.product.trackInventory) {
        const available = getAvailableStock(variant.stock, variant.reservedStock)
        if (available < item.quantity) {
          unavailableItems.push({
            productId: item.productId,
            variantId: item.variantId,
            requested: item.quantity,
            available
          })
        }
      }
    } else {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (product && product.trackInventory) {
        const available = getAvailableStock(product.stock, product.reservedStock)
        if (available < item.quantity) {
          unavailableItems.push({
            productId: item.productId,
            requested: item.quantity,
            available
          })
        }
      }
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems
  }
}
