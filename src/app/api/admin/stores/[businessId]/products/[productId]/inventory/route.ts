// app/api/admin/stores/[businessId]/products/[productId]/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { syncProductToOmniGateway } from '@/lib/omnigateway'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; productId: string }> }
) {
  try {
    const { businessId, productId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { newStock, reason } = await request.json()

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId
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

    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    const user = await prisma.user.findUnique({
      where: { id: access.session.user.id }
    })

    await prisma.inventoryActivity.create({
      data: {
        productId,
        businessId,
        type: quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE',
        quantity: quantityChange,
        oldStock,
        newStock,
        reason: reason || 'Manual stock adjustment',
        changedBy: user?.name
      }
    })

    // Sync stock update to OmniStack Gateway (if product is linked)
    // Fetch full product with category for sync
    const updatedProduct = await prisma.product.findFirst({
      where: { id: productId, businessId },
      include: { category: true }
    });
    
    if (updatedProduct) {
      // Run in background - don't block the response
      syncProductToOmniGateway(updatedProduct).catch(err => {
        console.error('[OmniGateway] Background sync failed:', err);
      });
    }

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
    const { businessId, productId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const whereClause: any = {
      productId,
      businessId
    }

    if (search) {
      whereClause.OR = [
        {
          reason: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const total = await prisma.inventoryActivity.count({
      where: whereClause
    })

    const activities = await prisma.inventoryActivity.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true
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
      skip,
      take: limit
    })

    const pages = Math.ceil(total / limit)

    return NextResponse.json({ 
      activities,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })

  } catch (error) {
    console.error('Error fetching inventory activities:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}