// app/api/v1/products/[productId]/stock/route.ts
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
    const { sku, stockQuantity, reason } = body
    
    if (stockQuantity === undefined || stockQuantity === null) {
      return NextResponse.json(
        { 
          success: false,
          error: 'stockQuantity is required',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }
    
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
    
    // Check if inventory tracking is enabled
    if (!product.trackInventory) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Inventory tracking is disabled for this product',
          code: 'INVENTORY_TRACKING_DISABLED'
        },
        { status: 400 }
      )
    }
    
    const oldStock = product.stock
    const newStock = Math.max(0, Math.floor(stockQuantity)) // Ensure non-negative integer
    
    if (oldStock === newStock) {
      // No change, but still store external ID in metadata if needed
      const metadata = (product.metadata as any) || {}
      if (!metadata.externalProductId) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            metadata: {
              ...metadata,
              externalProductId: externalProductId
            }
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Stock updated successfully (no change)',
        productId: product.id,
        newStock: newStock
      })
    }
    
    const quantityChange = newStock - oldStock
    
    // Update product stock
    const metadata = (product.metadata as any) || {}
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stock: newStock,
        metadata: {
          ...metadata,
          externalProductId: externalProductId // Store external product ID for future lookups
        }
      }
    })
    
    // Create inventory activity
    const activityType = quantityChange > 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE'
    // Use reason from external system if provided, otherwise use default message
    const externalReason = reason ? `External system: ${reason}` : 'External system stock sync'
    
    await prisma.inventoryActivity.create({
      data: {
        productId: product.id,
        businessId,
        type: activityType,
        quantity: quantityChange,
        oldStock,
        newStock,
        reason: externalReason,
        changedBy: 'External System'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      productId: product.id,
      newStock: newStock
    })
    
  } catch (error) {
    console.error('Error updating stock via API:', error)
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
