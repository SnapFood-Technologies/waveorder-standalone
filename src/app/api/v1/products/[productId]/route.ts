// src/app/api/v1/products/[productId]/route.ts
/**
 * Public API v1: Individual product endpoint
 * GET - Get single product
 * PUT - Update product (requires products:write scope)
 * DELETE - Delete product (requires products:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - Get Single Product
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'products:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const { productId } = await params

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId: auth.businessId
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        costPrice: true,
        sku: true,
        stock: true,
        lowStockAlert: true,
        trackInventory: true,
        images: true,
        isActive: true,
        featured: true,
        categoryId: true,
        brandId: true,
        category: {
          select: { id: true, name: true }
        },
        brand: {
          select: { id: true, name: true }
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            sku: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const response = NextResponse.json({ product })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Product GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// ===========================================
// PUT - Update Product
// ===========================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'products:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon - redirect to services endpoint
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if (business?.businessType === 'SALON') {
      return NextResponse.json(
        { error: 'Products endpoint is not available for SALON businesses. Use /services endpoint instead.' },
        { status: 403 }
      )
    }

    const { productId } = await params

    // Verify product exists and belongs to this business
    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, businessId: auth.businessId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json()

    // Build update data (only include provided fields)
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice ? parseFloat(body.costPrice) : null
    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock)
    if (body.lowStockAlert !== undefined) updateData.lowStockAlert = body.lowStockAlert ? parseInt(body.lowStockAlert) : null
    if (body.trackInventory !== undefined) updateData.trackInventory = body.trackInventory
    if (body.images !== undefined) updateData.images = body.images
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.categoryId !== undefined) {
      // Verify category belongs to business
      if (body.categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: body.categoryId, businessId: auth.businessId }
        })
        if (!category) {
          return NextResponse.json({ error: 'Category not found' }, { status: 400 })
        }
      }
      updateData.categoryId = body.categoryId
    }
    if (body.brandId !== undefined) updateData.brandId = body.brandId || null

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        price: true,
        sku: true,
        stock: true,
        isActive: true,
        updatedAt: true
      }
    })

    const response = NextResponse.json({ product })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Product PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// ===========================================
// DELETE - Delete Product
// ===========================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'products:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon - redirect to services endpoint
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if (business?.businessType === 'SALON') {
      return NextResponse.json(
        { error: 'Products endpoint is not available for SALON businesses. Use /services endpoint instead.' },
        { status: 403 }
      )
    }

    const { productId } = await params

    // Verify product exists and belongs to this business
    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, businessId: auth.businessId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id: productId }
    })

    const response = NextResponse.json({ message: 'Product deleted successfully' })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Product DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
