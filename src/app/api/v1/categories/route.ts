// src/app/api/v1/categories/route.ts
/**
 * Public API v1: Categories endpoint
 * GET - List categories
 * POST - Create category (requires categories:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - List Categories
// ===========================================
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'categories:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'

    // Fetch categories
    const categories = await prisma.category.findMany({
      where: {
        businessId: auth.businessId
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        sortOrder: true,
        isActive: true,
        ...(includeProducts && {
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              isActive: true
            },
            where: { isActive: true }
          }
        }),
        _count: {
          select: { products: true }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    const response = NextResponse.json({
      categories: categories.map(cat => ({
        ...cat,
        productCount: cat._count.products,
        _count: undefined
      }))
    })

    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Categories GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// ===========================================
// POST - Create Category
// ===========================================
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'categories:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const body = await request.json()

    // Validate required fields
    const { name } = body
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Get next sortOrder
    const lastCategory = await prisma.category.findFirst({
      where: { businessId: auth.businessId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })
    const nextPosition = (lastCategory?.sortOrder ?? -1) + 1

    // Create category
    const category = await prisma.category.create({
      data: {
        businessId: auth.businessId,
        name: name.trim(),
        description: body.description || null,
        image: body.image || null,
        sortOrder: body.sortOrder ?? nextPosition,
        isActive: body.isActive ?? true
      },
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        createdAt: true
      }
    })

    const response = NextResponse.json({ category }, { status: 201 })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Categories POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
