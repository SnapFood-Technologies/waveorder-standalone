// app/api/v1/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

// Verify business exists
async function verifyBusiness(businessId: string): Promise<boolean> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    })
    return !!business
  } catch (error) {
    return false
  }
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
    
    // Verify business exists
    const businessExists = await verifyBusiness(businessId)
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
      reason 
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
    
    // Create inventory activity if stock changed
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
        images: updatedProduct.images
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
  } finally {
    await prisma.$disconnect()
  }
}
