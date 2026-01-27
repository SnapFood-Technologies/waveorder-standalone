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
    // Get all categories with product counts
    const categories = await prisma.category.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        parentId: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // For each category, check how many products are actually displayable
    const categoriesWithAnalysis = await Promise.all(
      categories.map(async (cat) => {
        // Count displayable products (active, price > 0, has stock)
        const displayableCount = await prisma.product.count({
          where: {
            businessId,
            categoryId: cat.id,
            isActive: true,
            price: { gt: 0 },
            OR: [
              { trackInventory: false },
              { trackInventory: true, stock: { gt: 0 } },
              { variants: { some: { stock: { gt: 0 } } } }
            ]
          }
        })

        return {
          ...cat,
          totalProducts: cat._count.products,
          displayableProducts: displayableCount
        }
      })
    )

    // Find empty categories
    const emptyCategories = categoriesWithAnalysis.filter(c => c.totalProducts === 0)

    // Find categories with products but 0 displayable
    const zeroDisplayable = categoriesWithAnalysis
      .filter(c => c.totalProducts > 0 && c.displayableProducts === 0)
      .map(c => {
        // Determine the likely reason
        let reason = 'unknown'
        return {
          id: c.id,
          name: c.name,
          totalProducts: c.totalProducts,
          displayableProducts: c.displayableProducts,
          reason: 'Products inactive, zero price, or zero stock'
        }
      })

    // Summary
    const summary = {
      total: categories.length,
      withProducts: categoriesWithAnalysis.filter(c => c.totalProducts > 0).length,
      empty: emptyCategories.length,
      parents: categories.filter(c => c.parentId === null).length,
      zeroDisplayable: zeroDisplayable.length
    }

    return NextResponse.json({
      summary,
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
