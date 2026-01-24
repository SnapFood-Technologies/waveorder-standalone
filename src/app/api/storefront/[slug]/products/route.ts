// app/api/storefront/[slug]/products/route.ts
// PERFORMANCE OPTIMIZED: Separate endpoint for products with filtering, search, and pagination
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  try {
    const { slug } = await context.params
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const categoryId = searchParams.get('categoryId')
    const searchTerm = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Filter parameters
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : null
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : null
    const collectionIds = searchParams.get('collections') ? searchParams.get('collections')!.split(',') : []
    const groupIds = searchParams.get('groups') ? searchParams.get('groups')!.split(',') : []
    const brandIds = searchParams.get('brands') ? searchParams.get('brands')!.split(',') : []
    const sortBy = searchParams.get('sortBy') || 'name-asc'
    
    // Find business by slug
    const business = await prisma.business.findUnique({
      where: { 
        slug,
        isActive: true,
        setupWizardCompleted: true
      },
      select: {
        id: true,
        language: true,
        storefrontLanguage: true,
        connectedBusinesses: true
      }
    }) as any

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build businessIds array for connected businesses
    const hasConnections = business.connectedBusinesses && Array.isArray(business.connectedBusinesses) && business.connectedBusinesses.length > 0
    const businessIds = hasConnections 
      ? [business.id, ...business.connectedBusinesses]
      : [business.id]

    // Get category info to handle parent/child relationships
    // Run this in parallel with business lookup for better performance
    let categoryIdsToFilter: string[] = []
    if (categoryId && categoryId !== 'all') {
      categoryIdsToFilter = [categoryId] // Default to single category
      
      // Only fetch children if needed (async, don't block)
      try {
        const category = await prisma.category.findUnique({
          where: { 
            id: categoryId,
            businessId: hasConnections ? { in: businessIds } : business.id,
            isActive: true
          },
          select: {
            id: true,
            parentId: true,
            // @ts-ignore - Children relation
            children: {
              where: { isActive: true },
              select: { id: true }
            }
          }
        })
        
        if (category?.children && category.children.length > 0) {
          // Parent category: include parent + all children
          categoryIdsToFilter = [category.id, ...category.children.map((c: any) => c.id)]
        } else if (category) {
          // Child category or category without children: just this category
          categoryIdsToFilter = [category.id]
        }
      } catch (error) {
        // Fallback to single category if query fails
        categoryIdsToFilter = [categoryId]
      }
    }

    // Build where clause for products
    const productWhere: any = {
      businessId: hasConnections ? { in: businessIds } : business.id,
      isActive: true,
      price: { gt: 0 }
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

    // Search filter (name or description)
    if (searchTerm.trim()) {
      productWhere.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { descriptionAl: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Build orderBy clause
    let orderBy: any = { name: 'asc' }
    switch (sortBy) {
      case 'name-desc':
        orderBy = { name: 'desc' }
        break
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      default:
        orderBy = { name: 'asc' }
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
    const transformedProducts = products
      .filter((product: any) => {
        // Filter out products with stock 0
        if (product.trackInventory) {
          if (product.variants && product.variants.length > 0) {
            return product.variants.some((v: any) => v.stock > 0)
          }
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
