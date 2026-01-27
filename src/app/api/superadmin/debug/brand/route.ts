import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')
  const brandId = searchParams.get('brandId')

  if (!businessId || !brandId) {
    return NextResponse.json({ error: 'businessId and brandId are required' }, { status: 400 })
  }

  try {
    // Get brand info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        businessId: true,
        isActive: true
      }
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if it's the originator's brand
    const isOriginatorBrand = brand.businessId === businessId

    // Get all products for this brand (from the originator's perspective)
    const products = await prisma.product.findMany({
      where: {
        businessId: businessId,
        brandId: brandId
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        isActive: true,
        trackInventory: true,
        images: true,
        variants: {
          select: {
            id: true,
            name: true,
            stock: true,
            price: true
          }
        }
      }
    })

    // Analyze products
    const analysis = {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      inactive: products.filter(p => !p.isActive).length,
      priceGreaterThanZero: products.filter(p => p.price > 0).length,
      priceZero: products.filter(p => p.price === 0).length,
      stockGreaterThanZero: products.filter(p => !p.variants.length && p.stock > 0).length,
      stockZero: products.filter(p => !p.variants.length && p.trackInventory && p.stock === 0).length,
      noTrackInventory: products.filter(p => !p.variants.length && !p.trackInventory).length,
      hasImages: products.filter(p => p.images.length > 0).length,
      noImages: products.filter(p => p.images.length === 0).length,
      hasVariants: products.filter(p => p.variants.length > 0).length,
      variantAnalysis: {
        totalProductsWithVariants: 0,
        allVariantsZeroStock: 0,
        someVariantsHaveStock: 0,
        allVariantsHaveStock: 0
      }
    }

    // Analyze variants
    const productsWithVariants = products.filter(p => p.variants.length > 0)
    analysis.variantAnalysis.totalProductsWithVariants = productsWithVariants.length

    for (const product of productsWithVariants) {
      const variantsWithStock = product.variants.filter(v => v.stock > 0).length
      if (variantsWithStock === 0) {
        analysis.variantAnalysis.allVariantsZeroStock++
      } else if (variantsWithStock === product.variants.length) {
        analysis.variantAnalysis.allVariantsHaveStock++
      } else {
        analysis.variantAnalysis.someVariantsHaveStock++
      }
    }

    // Check which products are displayable on storefront
    const isDisplayable = (product: typeof products[0]) => {
      // Must be active
      if (!product.isActive) return { displayable: false, reason: 'inactive' }
      // Must have price > 0
      if (product.price === 0) return { displayable: false, reason: 'zero_price' }
      
      // If has variants, at least one must have stock
      if (product.variants.length > 0) {
        const variantsWithStock = product.variants.filter(v => v.stock > 0).length
        if (variantsWithStock === 0) {
          return { displayable: false, reason: 'all_variants_zero_stock' }
        }
        return { displayable: true, reason: '' }
      }
      
      // No variants - check stock
      if (product.trackInventory && product.stock === 0) {
        return { displayable: false, reason: 'zero_stock' }
      }
      
      return { displayable: true, reason: '' }
    }

    const displayableCount = products.filter(p => isDisplayable(p).displayable).length
    const notDisplayable = products.filter(p => !isDisplayable(p).displayable).map(p => {
      const result = isDisplayable(p)
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        isActive: p.isActive,
        hasImages: p.images.length > 0,
        variantsCount: p.variants.length,
        variantsWithStock: p.variants.filter(v => v.stock > 0).length,
        reason: result.reason
      }
    })

    return NextResponse.json({
      brand: {
        ...brand,
        isOriginatorBrand
      },
      analysis,
      storefrontDisplayable: {
        count: displayableCount
      },
      notDisplayableSample: {
        count: notDisplayable.length,
        first10: notDisplayable.slice(0, 10)
      },
      apiComparison: {
        storefrontUrl: `/api/storefront/${businessId}/products?brandId=${brandId}`
      }
    })
  } catch (error) {
    console.error('Error in brand debug:', error)
    return NextResponse.json({ error: 'Failed to analyze brand' }, { status: 500 })
  }
}
