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

    const isOriginatorBrand = brand.businessId === businessId

    // Use COUNT queries instead of fetching all products
    const baseWhere = { businessId, brandId }

    const [
      total,
      active,
      priceGreaterThanZero,
      priceZero,
      hasImages,
      hasVariants,
      // Displayable count (active, price > 0, has stock or variants with stock)
      displayableCount
    ] = await Promise.all([
      prisma.product.count({ where: baseWhere }),
      prisma.product.count({ where: { ...baseWhere, isActive: true } }),
      prisma.product.count({ where: { ...baseWhere, price: { gt: 0 } } }),
      prisma.product.count({ where: { ...baseWhere, price: 0 } }),
      prisma.product.count({ where: { ...baseWhere, images: { isEmpty: false } } }),
      prisma.product.count({ where: { ...baseWhere, variants: { some: {} } } }),
      prisma.product.count({
        where: {
          ...baseWhere,
          isActive: true,
          price: { gt: 0 },
          OR: [
            { trackInventory: false },
            { trackInventory: true, stock: { gt: 0 } },
            { variants: { some: { stock: { gt: 0 } } } }
          ]
        }
      })
    ])

    // Additional stock-related counts
    const [
      stockGreaterThanZero,
      stockZero,
      noTrackInventory
    ] = await Promise.all([
      prisma.product.count({ 
        where: { ...baseWhere, variants: { none: {} }, stock: { gt: 0 } } 
      }),
      prisma.product.count({ 
        where: { ...baseWhere, variants: { none: {} }, trackInventory: true, stock: 0 } 
      }),
      prisma.product.count({ 
        where: { ...baseWhere, variants: { none: {} }, trackInventory: false } 
      })
    ])

    // Variant analysis counts
    const [
      productsWithVariants,
      productsWithVariantsAndStock
    ] = await Promise.all([
      prisma.product.count({ where: { ...baseWhere, variants: { some: {} } } }),
      prisma.product.count({ 
        where: { ...baseWhere, variants: { some: { stock: { gt: 0 } } } } 
      })
    ])

    const allVariantsZeroStock = productsWithVariants - productsWithVariantsAndStock

    // Only fetch a SAMPLE of non-displayable products (max 10)
    const notDisplayableSample = await prisma.product.findMany({
      where: {
        ...baseWhere,
        OR: [
          { isActive: false },
          { price: 0 },
          { trackInventory: true, stock: 0, variants: { none: {} } },
          // Products with variants where all have 0 stock
          {
            variants: { some: {} },
            NOT: { variants: { some: { stock: { gt: 0 } } } }
          }
        ]
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
          select: { stock: true },
          take: 10 // Only get first 10 variants
        }
      },
      take: 10 // Only get 10 products for sample
    })

    // Determine reason for each non-displayable product
    const notDisplayableWithReason = notDisplayableSample.map(p => {
      let reason = 'unknown'
      if (!p.isActive) reason = 'inactive'
      else if (p.price === 0) reason = 'zero_price'
      else if (p.variants.length > 0) {
        const variantsWithStock = p.variants.filter(v => v.stock > 0).length
        if (variantsWithStock === 0) reason = 'all_variants_zero_stock'
      } else if (p.trackInventory && p.stock === 0) {
        reason = 'zero_stock'
      }

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        isActive: p.isActive,
        hasImages: p.images.length > 0,
        variantsCount: p.variants.length,
        variantsWithStock: p.variants.filter(v => v.stock > 0).length,
        reason
      }
    })

    return NextResponse.json({
      brand: {
        ...brand,
        isOriginatorBrand
      },
      analysis: {
        total,
        active,
        inactive: total - active,
        priceGreaterThanZero,
        priceZero,
        stockGreaterThanZero,
        stockZero,
        noTrackInventory,
        hasImages,
        noImages: total - hasImages,
        hasVariants,
        variantAnalysis: {
          totalProductsWithVariants: productsWithVariants,
          allVariantsZeroStock,
          someVariantsHaveStock: productsWithVariantsAndStock, // Simplified
          allVariantsHaveStock: 0 // Would need complex query, skip for performance
        }
      },
      storefrontDisplayable: {
        count: displayableCount
      },
      notDisplayableSample: {
        count: total - displayableCount,
        first10: notDisplayableWithReason
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
