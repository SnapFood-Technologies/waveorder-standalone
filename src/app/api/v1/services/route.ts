// src/app/api/v1/services/route.ts
/**
 * Public API v1: Services endpoint (for SALON businesses)
 * GET - List services
 * POST - Create service (requires services:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - List Services
// ===========================================
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'services:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if (business?.businessType !== 'SALON' && business?.businessType !== 'SERVICES') {
      return NextResponse.json(
        { error: 'Services endpoint is only available for SALON businesses. Use /products endpoint for other business types.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const offset = (page - 1) * limit

    // Build where clause - services are products with isService = true
    const where: any = {
      businessId: auth.businessId,
      isService: true
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Fetch services
    const [services, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          originalPrice: true,
          images: true,
          isActive: true,
          featured: true,
          categoryId: true,
          serviceDuration: true,
          requiresAppointment: true,
          modifiers: {
            select: {
              id: true,
              name: true,
              price: true,
              required: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
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
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Services GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// ===========================================
// POST - Create Service
// ===========================================
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'services:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if (business?.businessType !== 'SALON' && business?.businessType !== 'SERVICES') {
      return NextResponse.json(
        { error: 'Services endpoint is only available for SALON businesses. Use /products endpoint for other business types.' },
        { status: 403 }
      )
    }

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

    // Create service (product with isService = true)
    const service = await prisma.product.create({
      data: {
        businessId: auth.businessId,
        categoryId,
        name,
        description: body.description || null,
        price: parseFloat(price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        images: body.images || [],
        isActive: body.isActive ?? true,
        featured: body.featured ?? false,
        isService: true, // Mark as service
        serviceDuration: body.serviceDuration ? parseInt(body.serviceDuration) : null,
        requiresAppointment: body.requiresAppointment ?? true
      },
      select: {
        id: true,
        name: true,
        price: true,
        serviceDuration: true,
        requiresAppointment: true,
        isActive: true,
        createdAt: true
      }
    })

    const response = NextResponse.json({ service }, { status: 201 })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Services POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
