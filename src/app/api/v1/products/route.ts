// src/app/api/v1/products/route.ts
/**
 * Public API v1: Products endpoint
 * GET - List products
 * POST - Create product (requires products:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - List Products
// ===========================================
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'products:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const categoryId = searchParams.get('categoryId')
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      businessId: auth.businessId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (brandId) {
      where.brandId = brandId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    const response = NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Products GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// ===========================================
// POST - Create Product
// ===========================================
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'products:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    const body = await request.json()

    // Validate required fields
    const { name, price, categoryId } = body
    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'name and price are required' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }

    // Verify category belongs to this business
    const category = await prisma.category.findFirst({
      where: { id: categoryId, businessId: auth.businessId }
    })
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        businessId: auth.businessId,
        categoryId,
        name,
        description: body.description || null,
        price: parseFloat(price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
        sku: body.sku || null,
        stock: body.stock ? parseInt(body.stock) : 0,
        lowStockAlert: body.lowStockAlert ? parseInt(body.lowStockAlert) : null,
        trackInventory: body.trackInventory ?? true,
        images: body.images || [],
        isActive: body.isActive ?? true,
        featured: body.featured ?? false,
        brandId: body.brandId || null
      },
      select: {
        id: true,
        name: true,
        price: true,
        sku: true,
        stock: true,
        isActive: true,
        createdAt: true
      }
    })

    const response = NextResponse.json({ product }, { status: 201 })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Products POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
