// app/api/storefront/[slug]/products/route.ts
// PERFORMANCE OPTIMIZED: Separate endpoint for products with filtering, search, and pagination
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

// Helper function to normalize diacritics for search
// Converts diacritic characters to their base form AND vice versa
// Also handles Albanian word form variations (ë↔a endings for definite/plural)
// e.g., "Pjate" → ["Pjate", "Pjatë", "Pjata"], "Lugë" → ["Lugë", "Luge", "Luga"]
function getSearchVariants(searchTerm: string): string[] {
  // Map base characters to their diacritic versions (Albanian focused)
  const baseToDiacritic: Record<string, string> = {
    'e': 'ë', 'E': 'Ë',
    'c': 'ç', 'C': 'Ç',
  }
  
  // Map diacritics to base characters
  const diacriticToBase: Record<string, string> = {
    'ë': 'e', 'Ë': 'E',
    'ç': 'c', 'Ç': 'C',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ē': 'e',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ē': 'E',
  }
  
  const variants = new Set<string>()
  variants.add(searchTerm)
  
  // Create variant with diacritics removed (base form)
  let baseForm = searchTerm
  for (const [diacritic, base] of Object.entries(diacriticToBase)) {
    baseForm = baseForm.split(diacritic).join(base)
  }
  variants.add(baseForm)
  
  // Create variant with diacritics added (for Albanian: e→ë, c→ç)
  let diacriticForm = searchTerm
  for (const [base, diacritic] of Object.entries(baseToDiacritic)) {
    diacriticForm = diacriticForm.split(base).join(diacritic)
  }
  variants.add(diacriticForm)
  
  // Albanian word form variations: ë↔a endings (definite/plural forms)
  // gotë → gota, pjatë → pjata, lugë → luga, etc.
  const term = searchTerm.toLowerCase()
  
  // If word ends in 'ë', also search for ending in 'a'
  if (term.endsWith('ë')) {
    const aEnding = searchTerm.slice(0, -1) + 'a'
    const AEnding = searchTerm.slice(0, -1) + 'A'
    variants.add(aEnding)
    // Also add base form of 'a' ending (in case original had 'Ë')
    variants.add(aEnding.replace(/Ë/g, 'E').replace(/ë/g, 'e'))
  }
  
  // If word ends in 'e', also search for ending in 'a' (e could be ë)
  if (term.endsWith('e') && !term.endsWith('ë')) {
    const aEnding = searchTerm.slice(0, -1) + 'a'
    variants.add(aEnding)
  }
  
  // If word ends in 'a', also search for ending in 'ë' and 'e'
  if (term.endsWith('a')) {
    const ëEnding = searchTerm.slice(0, -1) + 'ë'
    const eEnding = searchTerm.slice(0, -1) + 'e'
    variants.add(ëEnding)
    variants.add(eEnding)
  }
  
  return Array.from(variants)
}

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
    
    // Single product fetch parameter (for share links)
    const singleProductId = searchParams.get('productId')
    
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
      hideProductsWithoutPhotos: businessData.hideProductsWithoutPhotos,
      showStockBadge: businessData.showStockBadge ?? false
    }


    // Build businessIds array for connected businesses
    const hasConnections = business.connectedBusinesses && Array.isArray(business.connectedBusinesses) && business.connectedBusinesses.length > 0
    const businessIds = hasConnections 
      ? [business.id, ...business.connectedBusinesses]
      : [business.id]

    // SINGLE PRODUCT FETCH: If productId is provided, fetch just that product (for share links)
    if (singleProductId) {
      const singleProduct = await prisma.product.findFirst({
        where: {
          id: singleProductId,
          businessId: { in: businessIds },
          isActive: true,
          price: { gt: 0 }
        },
        include: {
          category: {
            select: { id: true, name: true, nameAl: true, nameEl: true }
          },
          brand: {
            select: { id: true, name: true, logo: true }
          }
        }
      }) as any

      if (!singleProduct) {
        return NextResponse.json({
          products: [],
          pagination: { page: 1, limit: 1, total: 0, hasMore: false },
          message: 'Product not found'
        })
      }

      // Calculate effective price for the single product
      const { effectivePrice, effectiveOriginalPrice } = calculateEffectivePrice(
        singleProduct.price,
        singleProduct.originalPrice,
        singleProduct.saleStartDate,
        singleProduct.saleEndDate
      )

      // Parse modifiers and variants JSON
      let parsedModifiers = []
      let parsedVariants = []
      
      try {
        if (singleProduct.modifiers) {
          parsedModifiers = typeof singleProduct.modifiers === 'string' 
            ? JSON.parse(singleProduct.modifiers) 
            : singleProduct.modifiers
        }
      } catch {
        parsedModifiers = []
      }
      
      try {
        if (singleProduct.variants) {
          parsedVariants = typeof singleProduct.variants === 'string' 
            ? JSON.parse(singleProduct.variants) 
            : singleProduct.variants
        }
      } catch {
        parsedVariants = []
      }

      const formattedProduct = {
        id: singleProduct.id,
        name: singleProduct.name,
        nameAl: singleProduct.nameAl,
        nameEl: singleProduct.nameEl,
        description: singleProduct.description,
        descriptionAl: singleProduct.descriptionAl,
        descriptionEl: singleProduct.descriptionEl,
        price: effectivePrice,
        originalPrice: effectiveOriginalPrice,
        images: singleProduct.images || [],
        categoryId: singleProduct.categoryId,
        categoryName: singleProduct.category?.name || null,
        categoryNameAl: singleProduct.category?.nameAl || null,
        categoryNameEl: singleProduct.category?.nameEl || null,
        stock: singleProduct.stock,
        trackInventory: singleProduct.trackInventory,
        modifiers: parsedModifiers,
        variants: parsedVariants,
        sortOrder: singleProduct.sortOrder,
        businessId: singleProduct.businessId,
        brandId: singleProduct.brandId,
        brand: singleProduct.brand ? {
          id: singleProduct.brand.id,
          name: singleProduct.brand.name,
          logo: singleProduct.brand.logo
        } : null
      }

      return NextResponse.json({
        products: [formattedProduct],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          hasMore: false
        }
      })
    }

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
      // Ensure price > 0 constraint is maintained (don't allow free products)
      if (priceMin !== null) {
        productWhere.price.gte = Math.max(priceMin, 0.01)
      } else {
        // If only priceMax is set, still enforce price > 0
        productWhere.price.gt = 0
      }
      if (priceMax !== null) {
        productWhere.price.lte = priceMax
      }
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
    // When showStockBadge is enabled, include all products (even out of stock)
    const stockConditions: any[] = business.showStockBadge 
      ? [] // No stock filter when badge is enabled
      : [
          { trackInventory: false }, // Products that don't track inventory always show
          { trackInventory: true, stock: { gt: 0 } } // Products that track inventory must have stock > 0
        ]

    // Search filter (name or description) with diacritic-insensitive matching
    // e.g., "Pjate" matches "Pjatë", "Luge" matches "Lugë"
    if (searchTerm.trim()) {
      const searchVariants = getSearchVariants(searchTerm.trim())
      
      // Build OR conditions for all search variants
      const searchConditions: any[] = []
      for (const variant of searchVariants) {
        searchConditions.push({ name: { contains: variant, mode: 'insensitive' } })
        searchConditions.push({ description: { contains: variant, mode: 'insensitive' } })
        searchConditions.push({ descriptionAl: { contains: variant, mode: 'insensitive' } })
        searchConditions.push({ descriptionEl: { contains: variant, mode: 'insensitive' } })
      }
      
      if (stockConditions.length > 0) {
        productWhere.AND = [
          { OR: searchConditions },
          { OR: stockConditions }
        ]
      } else {
        // No stock filter (showStockBadge enabled)
        productWhere.OR = searchConditions
      }
    } else if (stockConditions.length > 0) {
      // No search term, just apply stock conditions (if not showing badge)
      productWhere.OR = stockConditions
    }
    // If showStockBadge is enabled and no search term, no OR conditions needed

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
          descriptionEl: true,
          images: true,
          price: true,
          originalPrice: true,
          sku: true,
          stock: true,
          trackInventory: true,
          lowStockAlert: true,
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
    const useGreek = storefrontLanguage === 'el'
    // Exception slugs: always show English names/descriptions (product data is in English)
    const exceptionSlugs = ['swarovski', 'swatch', 'villeroy-boch', 'naia-studio']
    const isExceptionSlug = exceptionSlugs.includes(slug)

    // Transform products
    // Note: We've already filtered products with 0 stock at the database level (unless showStockBadge is enabled)
    // But we still need to check variants since variant stock can't be filtered at DB level easily
    const transformedProducts = products
      .filter((product: any) => {
        // If showStockBadge is enabled, show all products including out of stock
        if (business.showStockBadge) return true
        
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

        // Product name localization - ONLY for naia-studio
        // Greek storefront → nameEl first, fallback to name
        // English storefront → name first, fallback to nameEl
        // All other stores → use default name
        const productName = slug === 'naia-studio'
          ? (useGreek
              ? (product.nameEl || product.name || '')
              : (product.name || product.nameEl || ''))
          : product.name

        const productDescription = isExceptionSlug
          ? (product.description || product.descriptionAl || product.descriptionEl || '')
          : (useAlbanian && product.descriptionAl 
            ? product.descriptionAl 
            : useGreek && product.descriptionEl
              ? product.descriptionEl
              : product.description)

        return {
          id: product.id,
          name: productName,
          description: productDescription,
          descriptionAl: product.descriptionAl,
          descriptionEl: product.descriptionEl,
          images: product.images,
          price: productPricing.effectivePrice,
          originalPrice: productPricing.effectiveOriginalPrice,
          sku: product.sku,
          stock: product.stock,
          trackInventory: product.trackInventory,
          lowStockAlert: product.lowStockAlert,
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

    // FIX Bug #3: Calculate actual total accounting for variant stock filtering
    // The DB count doesn't account for products filtered out due to variant stock
    // We need to adjust the total to reflect actual displayable products
    
    // Count how many products were filtered out on this page due to variant stock
    const productsBeforeVariantFilter = products.length
    const productsAfterVariantFilter = transformedProducts.length
    const productsFilteredByVariantStock = productsBeforeVariantFilter - productsAfterVariantFilter
    
    // Calculate filter ratio for this batch (what percentage got filtered out)
    const filterRatio = productsBeforeVariantFilter > 0 
      ? productsFilteredByVariantStock / productsBeforeVariantFilter 
      : 0
    
    // Estimate actual total by applying same filter ratio to total count
    // This is more accurate than just subtracting the current page's filtered count
    const estimatedActualTotal = Math.round(totalCount * (1 - filterRatio))
    
    // Special case: if we fetched products but ALL were filtered out, 
    // and this is page 1, the actual total is likely 0 (or very small)
    let actualTotal: number
    if (page === 1 && productsAfterVariantFilter === 0 && productsBeforeVariantFilter > 0) {
      // All products on first page were filtered - likely ALL products have variant stock issues
      actualTotal = 0
    } else if (productsAfterVariantFilter < limit && page === 1) {
      // First page has fewer products than limit - this IS the actual total
      actualTotal = productsAfterVariantFilter
    } else {
      actualTotal = estimatedActualTotal
    }
    
    // Log search queries for analytics (only on first page to avoid duplicates)
    if (searchTerm.trim() && page === 1 && business?.id) {
      try {
        const ipAddress = extractIPAddress(request)
        const userAgent = request.headers.get('user-agent') || undefined
        const sessionId = request.headers.get('x-session-id') || undefined
        
        // Log search asynchronously (don't block response)
        prisma.searchLog.create({
          data: {
            businessId: business.id,
            searchTerm: searchTerm.trim().substring(0, 200), // Limit length
            resultsCount: actualTotal,
            sessionId: sessionId || null,
            ipAddress: ipAddress ? ipAddress.substring(0, 45) : null, // Limit IP length
            userAgent: userAgent ? userAgent.substring(0, 500) : null // Limit UA length
          }
        }).catch(err => {
          // Silently fail - don't break product search for analytics
          console.error('Failed to log search:', err)
        })
      } catch (logError) {
        // Silently fail - don't break product search for analytics
        console.error('Search log error:', logError)
      }
    }

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: actualTotal,
        totalPages: Math.max(1, Math.ceil(actualTotal / limit)),
        hasMore: productsAfterVariantFilter === limit && actualTotal > skip + limit
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
