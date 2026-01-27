// Debug endpoint to analyze brand products
// Usage: /api/admin/stores/{businessId}/debug/brand/{brandId}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; brandId: string }> }
) {
  try {
    const { businessId, brandId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { 
        id: true, 
        name: true, 
        slug: true,
        connectedBusinesses: true,
        hideProductsWithoutPhotos: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get brand info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true, businessId: true, isActive: true }
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Business IDs for query (originator + connected)
    const hasConnections = business.connectedBusinesses && business.connectedBusinesses.length > 0
    const businessIds = hasConnections 
      ? [business.id, ...business.connectedBusinesses]
      : [business.id]

    // Get ALL products for this brand (no filters)
    const allProducts = await prisma.product.findMany({
      where: {
        businessId: { in: businessIds },
        brandId: brandId
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        trackInventory: true,
        isActive: true,
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
      total: allProducts.length,
      
      // By active status
      active: allProducts.filter(p => p.isActive).length,
      inactive: allProducts.filter(p => !p.isActive).length,
      
      // By price
      priceZero: allProducts.filter(p => p.price === 0 || p.price === null).length,
      priceGreaterThanZero: allProducts.filter(p => p.price > 0).length,
      
      // By stock (products without variants)
      stockZero: allProducts.filter(p => p.trackInventory && (!p.variants || p.variants.length === 0) && p.stock === 0).length,
      stockGreaterThanZero: allProducts.filter(p => p.trackInventory && (!p.variants || p.variants.length === 0) && p.stock > 0).length,
      noTrackInventory: allProducts.filter(p => !p.trackInventory).length,
      
      // By images
      noImages: allProducts.filter(p => !p.images || p.images.length === 0).length,
      hasImages: allProducts.filter(p => p.images && p.images.length > 0).length,
      
      // By variants
      hasVariants: allProducts.filter(p => p.variants && p.variants.length > 0).length,
      noVariants: allProducts.filter(p => !p.variants || p.variants.length === 0).length,
      
      // Products with variants - variant stock analysis
      variantAnalysis: (() => {
        const productsWithVariants = allProducts.filter(p => p.variants && p.variants.length > 0)
        return {
          totalProductsWithVariants: productsWithVariants.length,
          allVariantsZeroStock: productsWithVariants.filter(p => 
            p.variants.every(v => v.stock === 0)
          ).length,
          someVariantsHaveStock: productsWithVariants.filter(p => 
            p.variants.some(v => v.stock > 0)
          ).length,
          allVariantsHaveStock: productsWithVariants.filter(p => 
            p.variants.every(v => v.stock > 0)
          ).length
        }
      })()
    }

    // Storefront displayable calculation (matching products/route.ts logic)
    const storefrontDisplayable = allProducts.filter(product => {
      // Must be active
      if (!product.isActive) return false
      
      // Must have price > 0
      if (product.price <= 0) return false
      
      // If hideProductsWithoutPhotos is enabled, must have images
      if (business.hideProductsWithoutPhotos && (!product.images || product.images.length === 0)) {
        return false
      }
      
      // Stock check
      if (product.trackInventory) {
        if (product.variants && product.variants.length > 0) {
          // For products with variants, at least one variant must have stock
          return product.variants.some(v => v.stock > 0)
        } else {
          // For products without variants, must have stock > 0
          return product.stock > 0
        }
      }
      
      // Products that don't track inventory are always displayable
      return true
    })

    // Sample of products that are NOT displayable (first 10)
    const notDisplayable = allProducts.filter(product => {
      const isDisplayable = storefrontDisplayable.some(d => d.id === product.id)
      return !isDisplayable
    }).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      trackInventory: p.trackInventory,
      isActive: p.isActive,
      hasImages: p.images && p.images.length > 0,
      variantsCount: p.variants?.length || 0,
      variantsWithStock: p.variants?.filter(v => v.stock > 0).length || 0,
      reason: getNotDisplayableReason(p, business.hideProductsWithoutPhotos)
    }))

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        hasConnections,
        connectedBusinessesCount: business.connectedBusinesses?.length || 0,
        hideProductsWithoutPhotos: business.hideProductsWithoutPhotos
      },
      brand: {
        id: brand.id,
        name: brand.name,
        businessId: brand.businessId,
        isActive: brand.isActive,
        isOriginatorBrand: brand.businessId === businessId,
        isSupplierBrand: brand.businessId !== businessId
      },
      analysis,
      storefrontDisplayable: {
        count: storefrontDisplayable.length,
        note: 'Products that would actually show on storefront after all filters'
      },
      notDisplayableSample: {
        count: allProducts.length - storefrontDisplayable.length,
        first10: notDisplayable,
        note: 'First 10 products that are NOT displayable on storefront'
      },
      apiComparison: {
        note: 'Compare with storefront API',
        storefrontUrl: `/api/storefront/${business.slug}/products?brands=${brandId}&page=1&limit=50`
      }
    })

  } catch (error) {
    console.error('Debug brand error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getNotDisplayableReason(product: any, hideProductsWithoutPhotos: boolean): string {
  const reasons: string[] = []
  
  if (!product.isActive) {
    reasons.push('INACTIVE')
  }
  
  if (product.price <= 0) {
    reasons.push('PRICE_ZERO')
  }
  
  if (hideProductsWithoutPhotos && (!product.images || product.images.length === 0)) {
    reasons.push('NO_IMAGES')
  }
  
  if (product.trackInventory) {
    if (product.variants && product.variants.length > 0) {
      const hasVariantStock = product.variants.some((v: any) => v.stock > 0)
      if (!hasVariantStock) {
        reasons.push('ALL_VARIANTS_ZERO_STOCK')
      }
    } else if (product.stock === 0) {
      reasons.push('ZERO_STOCK')
    }
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'UNKNOWN'
}
