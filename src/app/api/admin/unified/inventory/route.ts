// src/app/api/admin/unified/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get all businesses for this user
    const businessUsers = await prisma.businessUser.findMany({
      where: { userId: session.user.id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (businessUsers.length === 0) {
      return NextResponse.json({ stores: [], lowStockProducts: [] })
    }

    const businessIds = businessUsers.map(bu => bu.businessId)

    // Get inventory stats for each business
    const storeInventory = await Promise.all(
      businessUsers.map(async (bu) => {
        const businessId = bu.business.id

        // Get product counts
        const totalProducts = await prisma.product.count({
          where: { businessId, isActive: true }
        })

        // Get low stock products (stock > 0 but at or below 10 units)
        const lowStockCount = await prisma.product.count({
          where: {
            businessId,
            isActive: true,
            trackInventory: true,
            stock: { gt: 0, lte: 10 }
          }
        })

        // Get out of stock products
        const outOfStockCount = await prisma.product.count({
          where: {
            businessId,
            isActive: true,
            trackInventory: true,
            stock: { lte: 0 }
          }
        })

        return {
          id: bu.business.id,
          name: bu.business.name,
          slug: bu.business.slug,
          totalProducts,
          lowStockCount,
          outOfStockCount,
          totalValue: 0 // Would need to calculate stock * price
        }
      })
    )

    // Get low stock products across all stores
    const lowStockProducts = await prisma.product.findMany({
      where: {
        businessId: { in: businessIds },
        isActive: true,
        trackInventory: true,
        stock: { lte: 10, gte: 0 }
      },
      orderBy: { stock: 'asc' },
      take: 20,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockAlert: true,
        businessId: true,
        business: {
          select: { name: true, slug: true }
        }
      }
    })

    const formattedLowStock = lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      stock: product.stock,
      lowStockAlert: product.lowStockAlert || 10,
      businessId: product.businessId,
      businessName: product.business.name,
      businessSlug: product.business.slug
    }))

    return NextResponse.json({
      stores: storeInventory,
      lowStockProducts: formattedLowStock
    })

  } catch (error) {
    console.error('Error fetching unified inventory:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
