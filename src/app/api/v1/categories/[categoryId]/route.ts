// src/app/api/v1/categories/[categoryId]/route.ts
/**
 * Public API v1: Individual category endpoint
 * GET - Get single category
 * PUT - Update category (requires categories:write scope)
 * DELETE - Delete category (requires categories:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - Get Single Category
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'categories:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const { categoryId } = await params

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId: auth.businessId
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        sortOrder: true,
        isActive: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const response = NextResponse.json({ category })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Category GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// ===========================================
// PUT - Update Category
// ===========================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'categories:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const { categoryId } = await params

    // Verify category exists and belongs to this business
    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, businessId: auth.businessId }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const body = await request.json()

    // Build update data (only include provided fields)
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.image !== undefined) updateData.image = body.image
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        updatedAt: true
      }
    })

    const response = NextResponse.json({ category })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Category PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// ===========================================
// DELETE - Delete Category
// ===========================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'categories:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const { categoryId } = await params

    // Verify category exists and belongs to this business
    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId, businessId: auth.businessId }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId }
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${productCount} products. Move or delete products first.` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    const response = NextResponse.json({ message: 'Category deleted successfully' })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Category DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
