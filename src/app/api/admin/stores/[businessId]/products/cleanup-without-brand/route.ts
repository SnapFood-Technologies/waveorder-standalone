// src/app/api/admin/stores/[businessId]/products/cleanup-without-brand/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Fetch all products for this business and filter in memory
    // This is more reliable than trying to query null in Prisma
    const allProducts = await prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        sku: true,
        metadata: true,
        brandId: true
      }
    })
    
    // Filter products without brands (null, undefined, or empty string)
    const productsWithoutBrand = allProducts.filter(p => 
      !p.brandId || p.brandId === null || p.brandId === undefined || p.brandId === ''
    )

    if (productsWithoutBrand.length === 0) {
      return NextResponse.json({
        message: 'No products without brands found',
        deletedCount: 0
      })
    }

    // Delete all products without brands using the IDs we found
    const productIdsToDelete = productsWithoutBrand.map(p => p.id)
    
    const deleteResult = await prisma.product.deleteMany({
      where: {
        businessId,
        id: { in: productIdsToDelete }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.count} products without brands`,
      deletedCount: deleteResult.count,
      deletedProducts: productsWithoutBrand.slice(0, 50).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        externalProductId: p.metadata && typeof p.metadata === 'object' 
          ? (p.metadata as any).externalProductId 
          : null
      }))
    })

  } catch (error: any) {
    console.error('Error cleaning up products without brand:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
