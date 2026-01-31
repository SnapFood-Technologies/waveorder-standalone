// app/api/v1/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasFeature } from '@/lib/stripe'


// Helper to extract API key (business ID) from request
function getApiKey(request: NextRequest): string | null {
  // Try Authorization header first: Bearer {api_key}
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim()
  }
  
  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader.trim()
  }
  
  return null
}

// Verify business exists and check API access
async function verifyBusinessAndApiAccess(businessId: string): Promise<{ valid: boolean; hasApiAccess: boolean; plan?: string }> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    })
    
    if (!business) {
      return { valid: false, hasApiAccess: false }
    }
    
    // Get business owner's plan to check API access
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const hasApiAccess = hasFeature(userPlan, 'apiAccess')
    
    return { valid: true, hasApiAccess, plan: userPlan }
  } catch (error) {
    return { valid: false, hasApiAccess: false }
  }
}

// Legacy function for backwards compatibility
async function verifyBusiness(businessId: string): Promise<boolean> {
  const result = await verifyBusinessAndApiAccess(businessId)
  return result.valid
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId: externalProductId } = await params
    
    // Get API key (business ID) from headers
    const businessId = getApiKey(request)
    
    if (!businessId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - API key required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }
    
    // Verify business exists and check API access
    const { valid: businessExists, hasApiAccess, plan } = await verifyBusinessAndApiAccess(businessId)
    
    if (!businessExists) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Invalid API key',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }
    
    // Check if plan allows API access (Business plan only)
    if (!hasApiAccess) {
      return NextResponse.json(
        { 
          success: false,
          error: `API access is not available on the ${plan} plan. Please upgrade to the BUSINESS plan to use the API.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: 'apiAccess',
          plan
        },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      sku, 
      price, 
      salePrice, 
      isActive, 
      stockQuantity, 
      stockStatus,
      name,
      nameAl,
      description,
      descriptionAl,
      images,
      gallery,
      categoryId,
      categoryName,
      productType,
      variations,
      reason,
      dateSaleStart, // Product-level sale start date
      dateSaleEnd    // Product-level sale end date
    } = body
    
    // Find product by external product ID (stored in metadata) or SKU
    let product = null
    
    // First, try to find by external product ID in metadata
    const products = await prisma.product.findMany({
      where: { businessId }
    })
    
    // Check if any product has this external ID in metadata
    for (const p of products) {
      if (p.metadata && typeof p.metadata === 'object' && 'externalProductId' in p.metadata) {
        const metadata = p.metadata as { externalProductId?: string }
        if (metadata.externalProductId === externalProductId) {
          product = p
          break
        }
      }
    }
    
    // If not found by external ID, try SKU lookup
    if (!product && sku) {
      product = await prisma.product.findFirst({
        where: {
          businessId,
          sku: sku
        }
      })
    }
    
    // Still not found? Try productId as our internal ID (for backwards compatibility)
    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          id: externalProductId,
          businessId
        }
      })
    }
    
    if (!product) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    // Build update data object (only include fields that are provided)
    const updateData: any = {}
    const metadata = (product.metadata as any) || {}
    
    // Store external product ID in metadata for future lookups
    updateData.metadata = {
      ...metadata,
      externalProductId: externalProductId
    }
    
    // Price updates
    if (price !== undefined && price !== null) {
      const regularPrice = parseFloat(price)
      if (isNaN(regularPrice) || regularPrice < 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid price value',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        )
      }
      
      // Handle sale price logic
      if (salePrice !== undefined && salePrice !== null) {
        const salePriceValue = parseFloat(salePrice)
        if (!isNaN(salePriceValue) && salePriceValue > 0 && salePriceValue < regularPrice) {
          // Product is on sale: sale price becomes current price, regular price stored in originalPrice
          updateData.price = salePriceValue
          updateData.originalPrice = regularPrice
        } else if (salePriceValue === 0 || salePriceValue >= regularPrice) {
          // No sale or invalid sale price: regular price is current price, no originalPrice
          updateData.price = regularPrice
          updateData.originalPrice = null
        } else {
          updateData.price = regularPrice
        }
      } else {
        // No sale price provided: just set regular price
        updateData.price = regularPrice
        // Clear sale price if it exists
        if (product.originalPrice && product.price < product.originalPrice) {
          // Currently on sale, clear it
          updateData.originalPrice = null
          updateData.price = regularPrice
        }
      }
    } else if (salePrice !== undefined && salePrice !== null) {
      // Sale price provided but no regular price - use current price as regular
      const salePriceValue = parseFloat(salePrice)
      if (!isNaN(salePriceValue) && salePriceValue > 0) {
        if (salePriceValue < product.price) {
          updateData.originalPrice = product.price
          updateData.price = salePriceValue
        } else {
          updateData.originalPrice = null
        }
      }
    }
    
    // Product status (isActive)
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }
    
    // Handle product-level sale dates
    if (dateSaleStart !== undefined && dateSaleStart !== null) {
      try {
        const saleStart = new Date(dateSaleStart)
        if (!isNaN(saleStart.getTime())) {
          updateData.saleStartDate = saleStart
        }
      } catch {
        // Invalid date, skip
      }
    } else if (dateSaleStart === null) {
      // Explicitly clear sale start date
      updateData.saleStartDate = null
    }
    
    if (dateSaleEnd !== undefined && dateSaleEnd !== null) {
      try {
        const saleEnd = new Date(dateSaleEnd)
        if (!isNaN(saleEnd.getTime())) {
          updateData.saleEndDate = saleEnd
        }
      } catch {
        // Invalid date, skip
      }
    } else if (dateSaleEnd === null) {
      // Explicitly clear sale end date
      updateData.saleEndDate = null
    }
    
    // Stock quantity
    let stockChanged = false
    let oldStock = product.stock
    if (stockQuantity !== undefined && stockQuantity !== null) {
      const newStock = Math.max(0, Math.floor(stockQuantity))
      if (product.trackInventory && product.stock !== newStock) {
        updateData.stock = newStock
        stockChanged = true
        oldStock = product.stock
      } else if (product.trackInventory) {
        updateData.stock = newStock
      }
    }
    
    // Stock status (can be derived, but can also be explicitly set)
    // If stockStatus is provided and stock is 0, ensure stock is 0
    if (stockStatus === 'outofstock' && product.stock > 0) {
      updateData.stock = 0
      stockChanged = true
      oldStock = product.stock
    }
    
    // Title/Name
    // For now: use nameAl for English (external platform uses 'name' internally)
    // nameAl maps to 'name' (English) in our database
    if (nameAl !== undefined && nameAl !== null) {
      updateData.name = String(nameAl) // nameAl in API = name (English) in database
    }
    // Note: name field in API is not used for now, use nameAl instead
    
    // Helper function to clean HTML from descriptions
    const cleanDescription = (desc: string | null | undefined): string | null => {
      if (!desc || desc === '') return null
      
      let cleaned = String(desc)
      
      // Remove <p><br></p> and empty paragraph tags
      cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
      cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '')
      
      // Strip wrapping <p> tags if content is just plain text (no other HTML tags)
      // Matches: <p>content</p> where content has no other HTML tags
      const singlePTagMatch = cleaned.match(/^<p>(.*?)<\/p>$/i)
      if (singlePTagMatch) {
        const innerContent = singlePTagMatch[1].trim()
        // Check if inner content has no other HTML tags (just text)
        if (!/<[^>]+>/.test(innerContent)) {
          cleaned = innerContent
        }
      }
      
      cleaned = cleaned.trim()
      return cleaned === '' ? null : cleaned
    }
    
    // Description (clean HTML tags)
    if (description !== undefined && description !== null) {
      updateData.description = cleanDescription(description)
    }
    if (descriptionAl !== undefined && descriptionAl !== null) {
      updateData.descriptionAl = cleanDescription(descriptionAl)
    }
    
    // Images/Gallery (Option 1: Replace entire array)
    // Support both 'images' (array of URLs) or 'gallery' (array of URLs)
    // If both provided, 'images' takes precedence
    // First image is main image, rest are gallery images
    if (images !== undefined && images !== null) {
      if (Array.isArray(images)) {
        // Validate all items are strings (URLs)
        const imageUrls = images.filter(url => typeof url === 'string' && url.trim() !== '')
        updateData.images = imageUrls
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'images must be an array of image URLs',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        )
      }
    } else if (gallery !== undefined && gallery !== null) {
      // If only 'gallery' is provided, use it as images array
      if (Array.isArray(gallery)) {
        const imageUrls = gallery.filter(url => typeof url === 'string' && url.trim() !== '')
        updateData.images = imageUrls
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'gallery must be an array of image URLs',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        )
      }
    }
    
    // Category
    if (categoryId !== undefined && categoryId !== null) {
      // Verify category exists and belongs to this business
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          businessId
        }
      })
      if (!category) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Category not found',
            code: 'CATEGORY_NOT_FOUND'
          },
          { status: 400 }
        )
      }
      updateData.categoryId = categoryId
    } else if (categoryName !== undefined && categoryName !== null) {
      // Try to find category by name (check both English and Albanian)
      const categoryNameStr = String(categoryName)
      // @ts-ignore - Prisma types may not be up to date, but nameAl exists in schema
      let category = await prisma.category.findFirst({
        where: {
          businessId,
          OR: [
            { name: categoryNameStr },
            { nameAl: categoryNameStr }
          ]
        }
      })
      
      if (!category) {
        // Create category if it doesn't exist
        category = await prisma.category.create({
          data: {
            name: categoryNameStr, // Store as English name (since nameAl is used for English in API)
            businessId,
            isActive: true
          }
        })
      }
      updateData.categoryId = category.id
    }
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: updateData
    })
    
    // Fetch existing variants to check if we need to clear them
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: product.id }
    })
    
    // Handle product type change: if productType is 'simple', clear all variations
    if (productType === 'simple' && existingVariants.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: product.id }
      })
    }
    
    // Handle variations if provided
    if (variations !== undefined && Array.isArray(variations)) {
      const variantSkuMap = new Map(existingVariants.map(v => [v.sku || '', v]))
      
      // Process each variation from the request
      for (const variation of variations) {
        const {
          sku: variationSku,
          articleNo,
          price: variationPrice,
          salePrice: variationSalePrice,
          originalPrice: variationOriginalPrice,
          stockQuantity: variationStockQuantity,
          stockStatus: variationStockStatus,
          image: variationImage,
          attributes,
          dateSaleStart,
          dateSaleEnd
        } = variation
        
        // Validate required fields
        if (!variationSku) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Variation SKU is required',
              code: 'VALIDATION_ERROR'
            },
            { status: 400 }
          )
        }
        
        if (variationPrice === undefined || variationPrice === null) {
          return NextResponse.json(
            { 
              success: false,
              error: `Variation price is required for SKU: ${variationSku}`,
              code: 'VALIDATION_ERROR'
            },
            { status: 400 }
          )
        }
        
        if (variationStockQuantity === undefined || variationStockQuantity === null) {
          return NextResponse.json(
            { 
              success: false,
              error: `Variation stockQuantity is required for SKU: ${variationSku}`,
              code: 'VALIDATION_ERROR'
            },
            { status: 400 }
          )
        }
        
        // Build variant metadata
        const variantMetadata: any = {}
        if (articleNo !== undefined) variantMetadata.articleNo = articleNo
        if (variationImage !== undefined) variantMetadata.image = variationImage
        if (attributes !== undefined && typeof attributes === 'object') variantMetadata.attributes = attributes
        if (dateSaleStart !== undefined) variantMetadata.dateSaleStart = dateSaleStart // Keep in metadata for backward compatibility
        if (dateSaleEnd !== undefined) variantMetadata.dateSaleEnd = dateSaleEnd // Keep in metadata for backward compatibility
        if (variationSalePrice !== undefined) variantMetadata.salePrice = variationSalePrice
        if (variationOriginalPrice !== undefined) variantMetadata.originalPrice = variationOriginalPrice
        
        // Parse and store sale dates in database fields
        let variantSaleStartDate: Date | null = null
        let variantSaleEndDate: Date | null = null
        
        if (dateSaleStart !== undefined && dateSaleStart !== null) {
          try {
            const saleStart = new Date(dateSaleStart)
            if (!isNaN(saleStart.getTime())) {
              variantSaleStartDate = saleStart
            }
          } catch {
            // Invalid date, skip
          }
        }
        
        if (dateSaleEnd !== undefined && dateSaleEnd !== null) {
          try {
            const saleEnd = new Date(dateSaleEnd)
            if (!isNaN(saleEnd.getTime())) {
              variantSaleEndDate = saleEnd
            }
          } catch {
            // Invalid date, skip
          }
        }
        
        // Determine variant name from attributes or use SKU
        let variantName = variationSku
        if (attributes && typeof attributes === 'object') {
          const attributeValues = Object.values(attributes).filter(v => v)
          if (attributeValues.length > 0) {
            variantName = attributeValues.join(' - ')
          }
        }
        
        // Determine variant price (use salePrice if on sale, otherwise regular price)
        const finalVariantPrice = variationOriginalPrice && variationPrice < variationOriginalPrice
          ? variationPrice // Sale price
          : variationPrice // Regular price
        
        const existingVariant = variantSkuMap.get(variationSku)
        
        if (existingVariant) {
          // Update existing variant
          const oldVariantStock = existingVariant.stock
          const newVariantStock = Math.max(0, Math.floor(variationStockQuantity))
          
          await (prisma.productVariant.update as any)({
            where: { id: existingVariant.id },
            data: {
              name: variantName,
              price: finalVariantPrice,
              originalPrice: variationOriginalPrice && variationOriginalPrice > finalVariantPrice ? variationOriginalPrice : null,
              stock: newVariantStock,
              sku: variationSku,
              saleStartDate: variantSaleStartDate,
              saleEndDate: variantSaleEndDate,
              metadata: variantMetadata
            }
          })
          
          // Create inventory activity if stock changed
          if (oldVariantStock !== newVariantStock) {
            const quantityChange = newVariantStock - oldVariantStock
            const activityType = quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE'
            const externalReason = reason ? `OmniStack Gateway: ${reason}` : 'OmniStack Gateway variation update'
            
            await prisma.inventoryActivity.create({
              data: {
                productId: product.id,
                variantId: existingVariant.id,
                businessId,
                type: activityType,
                quantity: quantityChange,
                oldStock: oldVariantStock,
                newStock: newVariantStock,
                reason: externalReason,
                changedBy: 'OmniStack Gateway'
              }
            })
          }
        } else {
          // Create new variant
          const newVariantStock = Math.max(0, Math.floor(variationStockQuantity))
          
          const newVariant = await (prisma.productVariant.create as any)({
            data: {
              productId: product.id,
              name: variantName,
              price: finalVariantPrice,
              originalPrice: variationOriginalPrice && variationOriginalPrice > finalVariantPrice ? variationOriginalPrice : null,
              stock: newVariantStock,
              sku: variationSku,
              saleStartDate: variantSaleStartDate,
              saleEndDate: variantSaleEndDate,
              metadata: variantMetadata
            }
          })
          
          // Create inventory activity for new variant
          const externalReason = reason ? `OmniStack Gateway: ${reason}` : 'OmniStack Gateway variation creation'
          await prisma.inventoryActivity.create({
            data: {
              productId: product.id,
              variantId: newVariant.id,
              businessId,
              type: 'MANUAL_INCREASE',
              quantity: newVariantStock,
              oldStock: 0,
              newStock: newVariantStock,
              reason: externalReason,
              changedBy: 'OmniStack Gateway'
            }
          })
        }
      }
      
      // Delete variants that are not in the request (if productType is variable)
      // Note: We only delete if productType is explicitly 'variable' to avoid accidental deletions
      if (productType === 'variable') {
        const requestedSkus = new Set(variations.map((v: any) => v.sku).filter(Boolean))
        const variantsToDelete = existingVariants.filter(v => v.sku && !requestedSkus.has(v.sku))
        
        if (variantsToDelete.length > 0) {
          await prisma.productVariant.deleteMany({
            where: {
              id: { in: variantsToDelete.map(v => v.id) }
            }
          })
        }
      }
    } else if (variations !== undefined && Array.isArray(variations) && variations.length === 0) {
      // Explicitly clear variations: variations: [] means delete all variations
      // This handles the case where OmniStack sends variations: [] to clear variations
      if (existingVariants.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { productId: product.id }
        })
      }
    }
    
    // Create inventory activity if stock changed (for main product)
    if (stockChanged && product.trackInventory) {
      const newStock = updateData.stock || updatedProduct.stock
      const quantityChange = newStock - oldStock
      const activityType = quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE'
      const externalReason = reason ? `OmniStack Gateway: ${reason}` : 'OmniStack Gateway product update'
      
      await prisma.inventoryActivity.create({
        data: {
          productId: product.id,
          businessId,
          type: activityType,
          quantity: quantityChange,
          oldStock,
          newStock,
          reason: externalReason,
          changedBy: 'OmniStack Gateway'
        }
      })
    }
    
    // Fetch updated product with variants
    const productWithVariants = await prisma.product.findUnique({
      where: { id: updatedProduct.id },
      include: {
        variants: true
      }
    }) as any
    
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: updatedProduct.id,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        originalPrice: updatedProduct.originalPrice,
        stock: updatedProduct.stock,
        isActive: updatedProduct.isActive,
        sku: updatedProduct.sku,
        images: updatedProduct.images,
        productType: productType || (productWithVariants?.variants && productWithVariants.variants.length > 0 ? 'variable' : 'simple'),
        variations: productWithVariants?.variants?.map((v: any) => {
          const vMetadata = (v.metadata as any) || {}
          return {
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            stockQuantity: v.stock,
            stockStatus: v.stock > 0 ? 'instock' : 'outofstock',
            articleNo: vMetadata.articleNo,
            salePrice: vMetadata.salePrice,
            originalPrice: vMetadata.originalPrice,
            image: vMetadata.image,
            attributes: vMetadata.attributes,
            dateSaleStart: vMetadata.dateSaleStart,
            dateSaleEnd: vMetadata.dateSaleEnd
          }
        }) || []
      }
    })
    
  } catch (error) {
    console.error('Error updating product via API:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
