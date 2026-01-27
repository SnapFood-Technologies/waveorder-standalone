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
    // Get counts
    const [totalProducts, zeroStockCount, lowStockCount, inStockCount] = await Promise.all([
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
      // Low stock (below their lowStockAlert threshold)
      prisma.product.count({
        where: {
          businessId,
          trackInventory: true,
          lowStockAlert: { gt: 0 },
          stock: { gt: 0 },
          variants: { none: {} }
        }
      }).then(async () => {
        // Need to filter where stock < lowStockAlert
        const productsWithLowStock = await prisma.product.findMany({
          where: {
            businessId,
            trackInventory: true,
            lowStockAlert: { gt: 0 },
            stock: { gt: 0 },
            variants: { none: {} }
          },
          select: { stock: true, lowStockAlert: true }
        })
        return productsWithLowStock.filter(p => p.lowStockAlert && p.stock <= p.lowStockAlert).length
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
      })
    ])

    // Get zero stock products
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
        sku: true,
        _count: { select: { variants: true } }
      },
      take: 20,
      orderBy: { name: 'asc' }
    })

    // Get products with all variants having 0 stock
    const productsWithZeroStockVariants = await prisma.product.findMany({
      where: {
        businessId,
        trackInventory: true,
        variants: { some: {} },
        NOT: {
          variants: { some: { stock: { gt: 0 } } }
        }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        variants: {
          select: {
            id: true,
            name: true,
            stock: true
          }
        }
      },
      take: 20,
      orderBy: { name: 'asc' }
    })

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        businessId,
        trackInventory: true,
        lowStockAlert: { gt: 0 },
        stock: { gt: 0 },
        variants: { none: {} }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true
      },
      orderBy: { stock: 'asc' },
      take: 50
    }).then(products => products.filter(p => p.lowStockAlert && p.stock <= p.lowStockAlert).slice(0, 20))

    return NextResponse.json({
      summary: {
        totalProducts,
        zeroStock: zeroStockCount,
        zeroStockVariants: productsWithZeroStockVariants.length,
        lowStock: lowStockProducts.length,
        inStock: inStockCount
      },
      zeroStockProducts: zeroStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        variantsCount: p._count.variants
      })),
      zeroStockVariantsProducts: productsWithZeroStockVariants.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        variants: p.variants.map(v => ({
          name: v.name,
          stock: v.stock
        }))
      })),
      lowStockProducts
    })
  } catch (error) {
    console.error('Error in stock debug:', error)
    return NextResponse.json({ error: 'Failed to analyze stock' }, { status: 500 })
  }
}
