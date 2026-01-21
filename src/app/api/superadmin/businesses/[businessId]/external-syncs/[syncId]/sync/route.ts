import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// POST - Trigger sync from external system
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId, syncId } = await params

    // Get per_page from query params (if provided, overrides config)
    const { searchParams } = new URL(request.url)
    const perPageOverride = searchParams.get('per_page')

    // Get sync configuration
    const sync = await (prisma as any).externalSync.findFirst({
      where: {
        id: syncId,
        businessId
      }
    })

    if (!sync) {
      return NextResponse.json(
        { message: 'External sync not found' },
        { status: 404 }
      )
    }

    if (!sync.isActive) {
      return NextResponse.json(
        { message: 'Sync is not active' },
        { status: 400 }
      )
    }

    if (!sync.externalSystemBaseUrl || !sync.externalSystemApiKey) {
      return NextResponse.json(
        { message: 'External system base URL and API key are required' },
        { status: 400 }
      )
    }

    // Get business to ensure it exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // Parse endpoints and brand IDs
    const endpoints = sync.externalSystemEndpoints as any || {}
    const productsEndpoint = endpoints['products-by-brand'] || endpoints['products'] || '/brand-products-export'
    // Use per_page from query param if provided, otherwise from config, otherwise default to 100
    const perPage = perPageOverride ? parseInt(perPageOverride) : (endpoints?.perPage || 100)
    
    // Handle brandIds - can be string (like "13" or "5") or array
    let brandIds: string[] = []
    if (sync.externalBrandIds) {
      if (typeof sync.externalBrandIds === 'string') {
        // If it's a JSON string, parse it first
        try {
          const parsed = JSON.parse(sync.externalBrandIds)
          brandIds = Array.isArray(parsed) 
            ? parsed.filter(id => id != null).map(id => id.toString())
            : [parsed.toString()]
        } catch {
          // If not JSON, treat as plain string
          brandIds = [sync.externalBrandIds]
        }
      } else if (Array.isArray(sync.externalBrandIds)) {
        brandIds = sync.externalBrandIds
          .filter((id: any) => id != null)
          .map((id: any) => id.toString())
      } else {
        // If it's a number or other type, convert to string
        brandIds = [sync.externalBrandIds.toString()]
      }
    }

    let processedCount = 0
    let skippedCount = 0
    const errors: any[] = []
    let lastError: string | null = null
    let syncStatus: 'success' | 'failed' | 'partial' = 'success'

    try {
      // Fetch products from external system
      const baseUrl = sync.externalSystemBaseUrl.replace(/\/$/, '') // Remove trailing slash
      const endpoint = productsEndpoint.startsWith('/') ? productsEndpoint : `/${productsEndpoint}`
      
      // For each brand ID, fetch products
      for (const brandId of brandIds.length > 0 ? brandIds : ['']) {
        let page = 1
        let hasMore = true

        while (hasMore) {
          const url = new URL(`${baseUrl}${endpoint}`)
          if (brandId) {
            // Use brand_id (snake_case) to match your API format
            url.searchParams.set('brand_id', brandId)
          }
          url.searchParams.set('page', page.toString())
          url.searchParams.set('per_page', perPage.toString())

          // Fetch from external API
          const response = await fetch(url.toString(), {
            headers: {
              'X-App-Key': sync.externalSystemApiKey!,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error(`External API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          
          // Handle different response formats
          let products: any[] = []
          if (data.products) {
            products = data.products
          } else if (data.data && Array.isArray(data.data)) {
            products = data.data
          } else if (Array.isArray(data)) {
            products = data
          }

          if (!products || products.length === 0) {
            hasMore = false
            break
          }

          // Process each product
          for (const externalProduct of products) {
            try {
              await processExternalProduct(externalProduct, businessId, sync.id)
              processedCount++
            } catch (error: any) {
              skippedCount++
              errors.push({
                productId: externalProduct.id || 'unknown',
                error: error.message
              })
              console.error('Error processing product:', error)
            }
          }

          // Check if there are more pages
          if (data.pagination) {
            hasMore = data.pagination.hasNext || (page < data.pagination.totalPages)
            page++
          } else if (products.length < perPage) {
            hasMore = false
          } else {
            page++
          }
        }
      }

      if (errors.length > 0 && processedCount === 0) {
        syncStatus = 'failed'
        lastError = `All products failed: ${errors[0]?.error || 'Unknown error'}`
      } else if (errors.length > 0) {
        syncStatus = 'partial'
        lastError = `${errors.length} products failed`
      }

    } catch (error: any) {
      syncStatus = 'failed'
      lastError = error.message || 'Sync failed'
      console.error('Sync error:', error)
    }

    // Update sync status
    await (prisma as any).externalSync.update({
      where: { id: syncId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: syncStatus,
        lastSyncError: lastError
      }
    })

    return NextResponse.json({
      message: 'Sync completed',
      processedCount,
      skippedCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      status: syncStatus
    })

  } catch (error: any) {
    console.error('Error in sync:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to process external product and create/update in WaveOrder
async function processExternalProduct(externalProduct: any, businessId: string, syncId: string) {
  // Validate required fields
  if (!externalProduct.id) {
    throw new Error('Product missing id')
  }

  if (!externalProduct.name) {
    throw new Error('Product missing name')
  }

  // Find or create category
  let categoryId: string
  const categoryName = externalProduct.categoryName || 'Uncategorized'
  
  let category = await prisma.category.findFirst({
    where: {
      businessId,
      name: categoryName
    }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        businessId,
        name: categoryName,
        nameAl: externalProduct.categoryNameAl || null,
        sortOrder: 0,
        isActive: true
      }
    })
  }

  categoryId = category.id

  // Prepare product data
  const productData: any = {
    businessId,
    categoryId,
    name: externalProduct.name,
    nameAl: externalProduct.nameAl || null,
    description: externalProduct.description || null,
    descriptionAl: externalProduct.descriptionAl || null,
    price: parseFloat(externalProduct.price) || parseFloat(externalProduct.salePrice) || 0,
    originalPrice: externalProduct.originalPrice ? parseFloat(externalProduct.originalPrice) : null,
    sku: externalProduct.sku || null,
    stock: parseInt(externalProduct.stockQuantity || externalProduct.stock || '0') || 0,
    isActive: externalProduct.isActive !== undefined ? externalProduct.isActive : true,
    featured: externalProduct.featured || false,
    images: Array.isArray(externalProduct.images) ? externalProduct.images : [],
    metadata: {
      externalProductId: externalProduct.id,
      externalSyncId: syncId,
      externalData: externalProduct
    }
  }

  // Find existing product by external ID in metadata
  // Fetch products and filter in memory (Prisma JSON queries don't work well with MongoDB)
  const products = await prisma.product.findMany({
    where: { businessId },
    include: { variants: true }
  })
  
  const existingProduct = products.find(p => {
    if (p.metadata && typeof p.metadata === 'object' && 'externalProductId' in p.metadata) {
      const metadata = p.metadata as { externalProductId?: string }
      return metadata.externalProductId === externalProduct.id
    }
    return false
  })

  if (existingProduct) {
    // Update existing product
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: productData
    })

    // Handle variants if product type is variable
    if (externalProduct.productType === 'variable' && Array.isArray(externalProduct.variations)) {
      await syncProductVariants(existingProduct.id, externalProduct.variations, syncId)
    }
  } else {
    // Create new product
    const newProduct = await prisma.product.create({
      data: productData,
      include: {
        variants: true
      }
    })

    // Handle variants if product type is variable
    if (externalProduct.productType === 'variable' && Array.isArray(externalProduct.variations)) {
      await syncProductVariants(newProduct.id, externalProduct.variations, syncId)
    }
  }
}

// Helper function to sync product variants
async function syncProductVariants(productId: string, variations: any[], syncId: string) {
  for (const variation of variations) {
    if (!variation.id) {
      continue // Skip invalid variations
    }

    const variantData: any = {
      productId,
      name: variation.name || variation.attributes?.join(' - ') || 'Default',
      price: parseFloat(variation.price) || 0,
      stock: parseInt(variation.stockQuantity || variation.stock || '0') || 0,
      sku: variation.sku || null,
      metadata: {
        externalVariantId: variation.id,
        externalSyncId: syncId,
        externalData: variation
      }
    }

    // Find existing variant by external ID
    // Fetch variants and filter in memory (Prisma JSON queries don't work well with MongoDB)
    const variants = await prisma.productVariant.findMany({
      where: { productId }
    }) as any[]
    
    const existingVariant = variants.find((v: any) => {
      if (v.metadata && typeof v.metadata === 'object' && 'externalVariantId' in v.metadata) {
        const metadata = v.metadata as { externalVariantId?: string }
        return metadata.externalVariantId === variation.id
      }
      return false
    })

    if (existingVariant) {
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: variantData
      })
    } else {
      await prisma.productVariant.create({
        data: variantData
      })
    }
  }
}
