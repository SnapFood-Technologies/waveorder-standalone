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
    // Get summary counts (fast)
    const [totalCategories, emptyCount, parentCount] = await Promise.all([
      prisma.category.count({ where: { businessId } }),
      prisma.category.count({ 
        where: { businessId, products: { none: {} } } 
      }),
      prisma.category.count({ 
        where: { businessId, parentId: null } 
      })
    ])

    // Get only empty categories (limited to 50)
    const emptyCategories = await prisma.category.findMany({
      where: { 
        businessId, 
        products: { none: {} } 
      },
      select: {
        id: true,
        name: true
      },
      take: 50,
      orderBy: { name: 'asc' }
    })

    // Get categories with products but likely 0 displayable
    // Only fetch categories that have products with issues
    const categoriesWithIssues = await prisma.category.findMany({
      where: {
        businessId,
        products: { some: {} }, // Has at least 1 product
        // All products are either inactive, zero price, or zero stock
        NOT: {
          products: {
            some: {
              isActive: true,
              price: { gt: 0 },
              OR: [
                { trackInventory: false },
                { trackInventory: true, stock: { gt: 0 } },
                { variants: { some: { stock: { gt: 0 } } } }
              ]
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } }
      },
      take: 20,
      orderBy: { name: 'asc' }
    })

    const zeroDisplayable = categoriesWithIssues.map(c => ({
      id: c.id,
      name: c.name,
      totalProducts: c._count.products,
      displayableProducts: 0,
      reason: 'Products inactive, zero price, or zero stock'
    }))

    return NextResponse.json({
      summary: {
        total: totalCategories,
        withProducts: totalCategories - emptyCount,
        empty: emptyCount,
        parents: parentCount,
        zeroDisplayable: zeroDisplayable.length
      },
      emptyCategories: emptyCategories.map(c => ({
        id: c.id,
        name: c.name
      })),
      zeroDisplayable
    })
  } catch (error) {
    console.error('Error in category debug:', error)
    return NextResponse.json({ error: 'Failed to analyze categories' }, { status: 500 })
  }
}
