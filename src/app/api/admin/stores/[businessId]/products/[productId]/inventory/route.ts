
// app/api/admin/stores/[businessId]/products/[productId]/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, productId } = await params
    const { newStock, reason } = await request.json()

    // Get current product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        business: {
          users: {
            some: {
              user: {
                email: session.user.email
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    if (!product.trackInventory) {
      return NextResponse.json({ message: 'Inventory tracking disabled for this product' }, { status: 400 })
    }

    const oldStock = product.stock
    const quantityChange = newStock - oldStock

    if (quantityChange === 0) {
      return NextResponse.json({ message: 'No stock change needed' }, { status: 400 })
    }

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      

    // Create inventory activity
    await prisma.inventoryActivity.create({
      data: {
        productId,
        businessId,
        type: quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE',
        quantity: quantityChange,
        oldStock,
        newStock,
        reason: reason || 'Manual stock adjustment',
        changedBy: user?.name // Add this line
      }
    })

    return NextResponse.json({ 
      message: 'Stock updated successfully',
      oldStock,
      newStock,
      change: quantityChange
    })

  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, productId } = await params

    const activities = await prisma.inventoryActivity.findMany({
      where: {
        productId,
        businessId,
        business: {
          users: {
            some: {
              user: {
                email: session.user.email
              }
            }
          }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        variant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching inventory activities:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}