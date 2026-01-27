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
    // Get counts using fast COUNT queries
    const [totalProducts, zeroStockCount, inStockCount, zeroStockVariantsCount] = await Promise.all([
      prisma.product.count({ where: { businessId } }),
      
      // Zero stock (products without variants that track inventory and have 0 stock)
      prisma.product.count({
        where: {
          businessId,
          trackInventory: true,
          stock: 0,
          variants: { none: {} }
        }
      }),
      
      // In stock
      prisma.product.count({
        where: {
          businessId,
          OR: [
            { trackInventory: false },
            { trackInventory: true, stock: { gt: 0 } },
            { variants: { some: { stock: { gt: 0 } } } }
          ]
        }
      }),

      // Products with variants where ALL variants have 0 stock
      prisma.product.count({
        where: {
          businessId,
          variants: { some: {} },
          NOT: { variants: { some: { stock: { gt: 0 } } } }
        }
      })
    ])

    // Get sample of zero stock products (limit 20, no variants fetch)
    const zeroStockProducts = await prisma.product.findMany({
      where: {
        businessId,
        trackInventory: true,
        stock: 0,
        variants: { none: {} }
      },
      select: {
        id: true,
        name: true,
        sku: true
      },
      take: 20,
      orderBy: { name: 'asc' }
    })

    // Get sample of products with all variants at 0 stock (limit 10)
    const productsWithZeroStockVariants = await prisma.product.findMany({
      where: {
        businessId,
        variants: { some: {} },
        NOT: { variants: { some: { stock: { gt: 0 } } } }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        _count: { select: { variants: true } }
      },
      take: 10,
      orderBy: { name: 'asc' }
    })

    // Get sample of low stock products (limit 20)
    // Simplified - just get products with stock between 1-10
    const lowStockProducts = await prisma.product.findMany({
      where: {
        businessId,
        trackInventory: true,
        stock: { gt: 0, lte: 10 },
        variants: { none: {} }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true
      },
      orderBy: { stock: 'asc' },
      take: 20
    })

    return NextResponse.json({
      summary: {
        totalProducts,
        zeroStock: zeroStockCount,
        zeroStockVariants: zeroStockVariantsCount,
        lowStock: lowStockProducts.length,
        inStock: inStockCount
      },
      zeroStockProducts: zeroStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        variantsCount: 0
      })),
      zeroStockVariantsProducts: productsWithZeroStockVariants.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        variantsCount: p._count.variants
      })),
      lowStockProducts
    })
  } catch (error) {
    console.error('Error in stock debug:', error)
    return NextResponse.json({ error: 'Failed to analyze stock' }, { status: 500 })
  }
}
