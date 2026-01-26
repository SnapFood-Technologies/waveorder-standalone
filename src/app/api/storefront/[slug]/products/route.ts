// app/api/storefront/[slug]/products/route.ts
// PERFORMANCE OPTIMIZED: Separate endpoint for products with filtering, search, and pagination
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

// Helper function to calculate effective price
function calculateEffectivePrice(price: number, originalPrice: number | null, saleStartDate: Date | null, saleEndDate: Date | null): { effectivePrice: number; effectiveOriginalPrice: number | null } {
  const now = new Date()
  const isSaleActive = (!saleStartDate || now >= saleStartDate) && (!saleEndDate || now <= saleEndDate)
  
  if (isSaleActive && originalPrice && originalPrice > price) {
    return { effectivePrice: price, effectiveOriginalPrice: originalPrice }
  } else {
    return {
      effectivePrice: originalPrice && originalPrice > price ? originalPrice : price,
      effectiveOriginalPrice: null
    }
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  let slug: string = 'unknown'
  let business: any = null
  let categoryIds: string[] = []
  let searchTerm: string = ''
  
  try {
    slug = (await context.params).slug
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const categoryIdParam = searchParams.get('categoryId')
    // Support multiple category IDs for marketplace deduplication (comma-separated)
    categoryIds = categoryIdParam ? categoryIdParam.split(',').filter(id => id.trim()) : []
    searchTerm = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Filter parameters
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : null
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : null
    const collectionIds = searchParams.get('collections') ? searchParams.get('collections')!.split(',').filter(id => id.trim()) : []
    const groupIds = searchParams.get('groups') ? searchParams.get('groups')!.split(',').filter(id => id.trim()) : []
    const brandIds = searchParams.get('brands') ? searchParams.get('brands')!.split(',').filter(id => id.trim()) : []
    const sortBy = searchParams.get('sortBy') || 'stock-desc'
    
    // Find business by slug
    const businessData = await prisma.business.findUnique({
      where: { 
        slug,
        isActive: true,
        setupWizardCompleted: true
      }
    }) as any
    
    if (!businessData) {
      // Log 404 for business not found in products route
      const userAgent = request.headers.get('user-agent') || undefined
      const referrer = request.headers.get('referer') || undefined
      const ipAddress = extractIPAddress(request)
      
      logSystemEvent({
        logType: 'storefront_404',
        severity: 'error',
        slug,
        endpoint: '/api/storefront/[slug]/products',
        method: 'GET',
        statusCode: 404,
        errorMessage: 'Business not found',
        ipAddress,
        userAgent,
        referrer,
        url: request.url,
        metadata: { reason: 'business_not_found', route: 'products' }
      })
      
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }
    
    business = {
      id: businessData.id,
      language: businessData.language,
      storefrontLanguage: businessData.storefrontLanguage,
      connectedBusinesses: businessData.connectedBusinesses,
      hideProductsWithoutPhotos: businessData.hideProductsWithoutPhotos
    }


    // Build businessIds array for connected businesses
    const hasConnections = business.connectedBusinesses && Array.isArray(business.connectedBusinesses) && business.connectedBusinesses.length > 0
    const businessIds = hasConnections 
      ? [business.id, ...business.connectedBusinesses]
      : [business.id]

    // Get category info to handle parent/child relationships
    // OPTIMIZATION: Use a single query to get category + children in parallel
    let categoryIdsToFilter: string[] = []
    if (categoryIds.length > 0) {
      // Support multiple category IDs (for marketplace deduplication)
      categoryIdsToFilter = [...categoryIds]
      
      // OPTIMIZED: For each category, check if it has children and include them
      try {
        // Fetch all categories and their children in parallel
        const categoriesWithChildren = await Promise.all(
          categoryIds.map(async (categoryId) => {
            const [category, childCategories] = await Promise.all([
              prisma.category.findUnique({
                where: { 
                  id: categoryId,
                  businessId: { in: businessIds },
                  isActive: true
                },
                select: {
                  id: true,
                  parentId: true
                }
              }),
              // Fetch children using parentId filter
              prisma.category.findMany({
                where: {
                  parentId: categoryId,
                  businessId: { in: businessIds },
                  isActive: true
                },
                select: { id: true }
              })
            ])
            
            if (childCategories && childCategories.length > 0) {
              // Parent category: include parent + all children
              return [categoryId, ...childCategories.map((c: any) => c.id)]
            } else if (category) {
              // Child category or category without children: just this category
              return [categoryId]
            }
            return [categoryId]
          })
        )
        
        // Flatten and deduplicate all category IDs
        categoryIdsToFilter = [...new Set(categoriesWithChildren.flat())]
      } catch (error) {
        // Fallback to provided category IDs if query fails
        categoryIdsToFilter = categoryIds
      }
    }

    // Build where clause for products
    const productWhere: any = {
      businessId: { in: businessIds },
      isActive: true,
      price: { gt: 0 }
    }

    // Exclude products without photos if setting is enabled
    if (business.hideProductsWithoutPhotos) {
      productWhere.images = {
        isEmpty: false
      }
    }

    // Category filter
    if (categoryIdsToFilter.length > 0) {
      productWhere.categoryId = { in: categoryIdsToFilter }
    }

    // Price filter
    if (priceMin !== null || priceMax !== null) {
      productWhere.price = {}
      if (priceMin !== null) productWhere.price.gte = priceMin
      if (priceMax !== null) productWhere.price.lte = priceMax
    }

    // Collection filter
    if (collectionIds.length > 0) {
      productWhere.collectionIds = { hasSome: collectionIds }
    }

    // Group filter
    if (groupIds.length > 0) {
      productWhere.groupIds = { hasSome: groupIds }
    }

    // Brand filter
    if (brandIds.length > 0) {
      productWhere.brandId = { in: brandIds }
    }

    // Stock filter: Only show products with stock > 0 OR products that don't track inventory
    // For products with variants, we'll check variant stock in post-processing
    const stockConditions: any[] = [
      { trackInventory: false }, // Products that don't track inventory always show
      { trackInventory: true, stock: { gt: 0 } } // Products that track inventory must have stock > 0
    ]

    // Search filter (name or description)
    if (searchTerm.trim()) {
      // Combine search OR with stock conditions using AND
      productWhere.AND = [
        {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { descriptionAl: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        {
          OR: stockConditions
        }
      ]
    } else {
      // No search term, just apply stock conditions
      productWhere.OR = stockConditions
    }

    // Build orderBy clause
    let orderBy: any = { stock: 'desc' }
    switch (sortBy) {
      case 'name-asc':
        orderBy = { name: 'asc' }
        break
      case 'name-desc':
        orderBy = { name: 'desc' }
        break
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'stock-desc':
        orderBy = { stock: 'desc' }
        break
      default:
        orderBy = { stock: 'desc' }
    }

    // Fetch products with pagination - use Promise.all for parallel execution
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          descriptionAl: true,
          images: true,
          price: true,
          originalPrice: true,
          sku: true,
          stock: true,
          trackInventory: true,
          featured: true,
          metaTitle: true,
          metaDescription: true,
          categoryId: true,
          saleStartDate: true,
          saleEndDate: true,
          collectionIds: true,
          groupIds: true,
          brandId: true,
          variants: {
            orderBy: { price: 'asc' },
            select: {
              id: true,
              name: true,
              price: true,
              originalPrice: true,
              stock: true,
              sku: true,
              metadata: true,
              saleStartDate: true,
              saleEndDate: true
            }
          },
          modifiers: {
            orderBy: { price: 'asc' },
            select: {
              id: true,
              name: true,
              price: true,
              required: true
            }
          }
        }
      }),
      prisma.product.count({ where: productWhere })
    ])

    // Get storefront language
    const storefrontLanguage = business.storefrontLanguage || business.language || 'en'
    const useAlbanian = storefrontLanguage === 'al' || storefrontLanguage === 'sq'
    const exceptionSlugs = ['swarovski', 'swatch', 'villeroy-boch']
    const isExceptionSlug = exceptionSlugs.includes(slug)

    // Transform products
    // Note: We've already filtered products with 0 stock at the database level
    // But we still need to check variants since variant stock can't be filtered at DB level easily
    const transformedProducts = products
      .filter((product: any) => {
        // For products with variants, check if any variant has stock
        if (product.trackInventory && product.variants && product.variants.length > 0) {
          return product.variants.some((v: any) => v.stock > 0)
        }
        // For products without variants, they're already filtered at DB level
        // But double-check for safety
        if (product.trackInventory) {
          return product.stock > 0
        }
        return true
      })
      .map((product: any) => {
        const productPricing = calculateEffectivePrice(
          product.price,
          product.originalPrice,
          product.saleStartDate,
          product.saleEndDate
        )

        const productDescription = isExceptionSlug
          ? (product.description || product.descriptionAl || '')
          : (useAlbanian && product.descriptionAl 
            ? product.descriptionAl 
            : product.description)

        return {
          id: product.id,
          name: product.name,
          description: productDescription,
          descriptionAl: product.descriptionAl,
          images: product.images,
          price: productPricing.effectivePrice,
          originalPrice: productPricing.effectiveOriginalPrice,
          sku: product.sku,
          stock: product.stock,
          trackInventory: product.trackInventory,
          featured: product.featured,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          categoryId: product.categoryId,
          collectionIds: product.collectionIds || [],
          groupIds: product.groupIds || [],
          brandId: product.brandId,
          variants: product.variants.map((variant: any) => {
            const variantPricing = calculateEffectivePrice(
              variant.price,
              variant.originalPrice,
              variant.saleStartDate,
              variant.saleEndDate
            )
            return {
              id: variant.id,
              name: variant.name,
              price: variantPricing.effectivePrice,
              originalPrice: variantPricing.effectiveOriginalPrice,
              stock: variant.stock,
              sku: variant.sku,
              metadata: variant.metadata || null,
              saleStartDate: variant.saleStartDate || null,
              saleEndDate: variant.saleEndDate || null
            }
          }),
          modifiers: product.modifiers.map((modifier: any) => ({
            id: modifier.id,
            name: modifier.name,
            price: modifier.price,
            required: modifier.required
          }))
        }
      })

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Products API error:', error)
    
    // Extract request metadata for logging
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    const ipAddress = extractIPAddress(request)
    
    // Log product loading error
    logSystemEvent({
      logType: 'products_error',
      severity: 'error',
      slug: slug || 'unknown',
      businessId: business?.id,
      endpoint: '/api/storefront/[slug]/products',
      method: 'GET',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      ipAddress,
      userAgent,
      referrer,
      url: request.url,
      metadata: { 
        errorType: 'products_fetch_error',
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        searchTerm: searchTerm || undefined
      }
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
