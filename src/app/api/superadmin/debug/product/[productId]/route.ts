import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId } = await params

  try {
    // Get product with all details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        brand: {
          select: {
            id: true,
            name: true
          }
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            sku: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check displayability
    let isDisplayable = true
    let reason = ''

    if (!product.isActive) {
      isDisplayable = false
      reason = 'Product is not active'
    } else if (product.price === 0) {
      isDisplayable = false
      reason = 'Product price is 0'
    } else if (product.variants.length > 0) {
      const variantsWithStock = product.variants.filter(v => v.stock > 0).length
      if (variantsWithStock === 0) {
        isDisplayable = false
        reason = 'All variants have 0 stock'
      }
    } else if (product.trackInventory && product.stock === 0) {
      isDisplayable = false
      reason = 'Product tracks inventory and has 0 stock'
    }

    // Additional checks
    const additionalInfo = {
      hasImages: product.images.length > 0,
      imageCount: product.images.length,
      hasCategory: !!product.categoryId,
      hasBrand: !!product.brandId,
      hasDescription: !!product.description && product.description.length > 0,
      variantCount: product.variants.length,
      variantsWithStock: product.variants.filter(v => v.stock > 0).length
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        isActive: product.isActive,
        trackInventory: product.trackInventory,
        images: product.images,
        sku: product.sku,
        business: product.business,
        category: product.category,
        brand: product.brand,
        variants: product.variants
      },
      isDisplayable,
      reason,
      additionalInfo
    })
  } catch (error) {
    console.error('Error in product debug:', error)
    return NextResponse.json({ error: 'Failed to analyze product' }, { status: 500 })
  }
}
