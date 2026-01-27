import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { businessId } = await params

  try {
    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        isActive: true,
        externalProductSyncEnabled: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get product counts
    const [
      totalProducts,
      activeProducts,
      zeroPriceProducts,
      zeroStockProducts,
      noImageProducts,
      productsWithVariants,
      productsWithAllVariantsZeroStock
    ] = await Promise.all([
      prisma.product.count({ where: { businessId } }),
      prisma.product.count({ where: { businessId, isActive: true } }),
      prisma.product.count({ where: { businessId, price: 0 } }),
      prisma.product.count({ where: { businessId, trackInventory: true, stock: 0, variants: { none: {} } } }),
      prisma.product.count({ where: { businessId, images: { isEmpty: true } } }),
      prisma.product.count({ where: { businessId, variants: { some: {} } } }),
      // Products with variants where ALL variants have 0 stock
      prisma.product.count({
        where: {
          businessId,
          trackInventory: true,
          variants: { some: {} },
          NOT: {
            variants: {
              some: {
                stock: { gt: 0 }
              }
            }
          }
        }
      })
    ])

    // Calculate displayable products (active, price > 0, has stock or variants with stock)
    const displayableProducts = await prisma.product.count({
      where: {
        businessId,
        isActive: true,
        price: { gt: 0 },
        OR: [
          { trackInventory: false },
          { trackInventory: true, stock: { gt: 0 } },
          { variants: { some: { stock: { gt: 0 } } } }
        ]
      }
    })

    // Get category count
    const totalCategories = await prisma.category.count({ where: { businessId } })
    const emptyCategories = await prisma.category.count({
      where: {
        businessId,
        products: { none: {} }
      }
    })

    // Get sync status
    const syncConfig = await prisma.externalProductSync.findFirst({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      select: {
        lastSyncAt: true,
        lastSyncStatus: true,
        lastSyncError: true
      }
    })

    return NextResponse.json({
      business,
      health: {
        totalProducts,
        displayableProducts,
        productsWithIssues: totalProducts - displayableProducts,
        totalCategories,
        emptyCategories
      },
      issues: {
        zeroPrice: zeroPriceProducts,
        zeroStock: zeroStockProducts,
        noImages: noImageProducts,
        inactive: totalProducts - activeProducts,
        variantsZeroStock: productsWithAllVariantsZeroStock
      },
      syncStatus: {
        hasExternalSync: business.externalProductSyncEnabled,
        lastSync: syncConfig?.lastSyncAt,
        lastSyncStatus: syncConfig?.lastSyncStatus,
        lastSyncError: syncConfig?.lastSyncError
      }
    })
  } catch (error) {
    console.error('Error in business health debug:', error)
    return NextResponse.json({ error: 'Failed to analyze business health' }, { status: 500 })
  }
}
