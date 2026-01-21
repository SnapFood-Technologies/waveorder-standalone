// app/api/admin/stores/[businessId]/categories/deduplicate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get all categories for this business with metadata
    const allCategories = await prisma.category.findMany({
      where: { businessId },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    // Group categories by externalCategoryId
    const categoriesByExternalId = new Map<string, any[]>()
    
    for (const category of allCategories) {
      if (category.metadata && typeof category.metadata === 'object' && 'externalCategoryId' in category.metadata) {
        const metadata = category.metadata as { externalCategoryId?: string }
        const externalId = metadata.externalCategoryId
        
        if (externalId) {
          if (!categoriesByExternalId.has(externalId)) {
            categoriesByExternalId.set(externalId, [])
          }
          categoriesByExternalId.get(externalId)!.push(category)
        }
      }
    }

    // Find duplicates (groups with more than 1 category)
    const duplicates: Array<{ externalId: string; categories: any[] }> = []
    for (const [externalId, categories] of categoriesByExternalId.entries()) {
      if (categories.length > 1) {
        duplicates.push({ externalId, categories })
      }
    }

    if (duplicates.length === 0) {
      return NextResponse.json({
        message: 'No duplicate categories found',
        duplicatesRemoved: 0,
        productsMoved: 0,
        childrenMoved: 0
      })
    }

    let totalDuplicatesRemoved = 0
    let totalProductsMoved = 0
    let totalChildrenMoved = 0

    // Process each duplicate group
    for (const { externalId, categories } of duplicates) {
      // Sort categories to determine which one to keep:
      // 1. Number of products (descending - keep the one with most products)
      // 2. Number of children (descending - keep the one with most children)
      // 3. Created date (ascending - if tied, keep the oldest)
      const sortedCategories = [...categories].sort((a, b) => {
        const aProducts = a._count.products || 0
        const bProducts = b._count.products || 0
        
        if (aProducts !== bProducts) {
          return bProducts - aProducts // More products = keep (higher priority)
        }
        
        const aChildren = a._count.children || 0
        const bChildren = b._count.children || 0
        
        if (aChildren !== bChildren) {
          return bChildren - aChildren // More children = keep
        }
        
        // If tied, keep the oldest (first created)
        const aDate = new Date(a.createdAt).getTime()
        const bDate = new Date(b.createdAt).getTime()
        return aDate - bDate
      })

      // Keep the first one (best candidate)
      const keepCategory = sortedCategories[0]
      const duplicatesToRemove = sortedCategories.slice(1)

      console.log(`[Deduplicate] External ID ${externalId}: Keeping category "${keepCategory.name}" (${keepCategory.id}), removing ${duplicatesToRemove.length} duplicates`)

      // Process each duplicate
      for (const duplicate of duplicatesToRemove) {
        // Move products from duplicate to kept category
        const productsToMove = await prisma.product.findMany({
          where: { categoryId: duplicate.id }
        })

        if (productsToMove.length > 0) {
          await prisma.product.updateMany({
            where: { categoryId: duplicate.id },
            data: { categoryId: keepCategory.id }
          })
          totalProductsMoved += productsToMove.length
          console.log(`[Deduplicate] Moved ${productsToMove.length} products from "${duplicate.name}" to "${keepCategory.name}"`)
        }

        // Move children from duplicate to kept category
        const childrenToMove = await prisma.category.findMany({
          where: { parentId: duplicate.id }
        })

        if (childrenToMove.length > 0) {
          await prisma.category.updateMany({
            where: { parentId: duplicate.id },
            data: { parentId: keepCategory.id }
          })
          totalChildrenMoved += childrenToMove.length
          console.log(`[Deduplicate] Moved ${childrenToMove.length} children from "${duplicate.name}" to "${keepCategory.name}"`)
        }

        // Delete the duplicate category
        await prisma.category.delete({
          where: { id: duplicate.id }
        })
        
        totalDuplicatesRemoved++
        console.log(`[Deduplicate] Deleted duplicate category "${duplicate.name}" (${duplicate.id})`)
      }
    }

    return NextResponse.json({
      message: `Deduplication completed successfully`,
      duplicatesFound: duplicates.length,
      duplicatesRemoved: totalDuplicatesRemoved,
      productsMoved: totalProductsMoved,
      childrenMoved: totalChildrenMoved,
      details: duplicates.map(({ externalId, categories }) => {
        // Sort to find which one was kept (same logic as above)
        const sorted = [...categories].sort((a, b) => {
          const aProducts = a._count.products || 0
          const bProducts = b._count.products || 0
          if (aProducts !== bProducts) return bProducts - aProducts
          const aChildren = a._count.children || 0
          const bChildren = b._count.children || 0
          if (aChildren !== bChildren) return bChildren - aChildren
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
        return {
          externalId,
          kept: sorted[0].name,
          keptId: sorted[0].id,
          removed: sorted.slice(1).map(c => ({ name: c.name, id: c.id }))
        }
      })
    })

  } catch (error: any) {
    console.error('Error deduplicating categories:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
