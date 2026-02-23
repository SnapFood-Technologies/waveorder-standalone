// src/app/api/v1/services/[serviceId]/route.ts
/**
 * Public API v1: Individual service endpoint (for SALON businesses)
 * GET - Get single service
 * PUT - Update service (requires services:write scope)
 * DELETE - Delete service (requires services:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'

// ===========================================
// GET - Get Single Service
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
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

    const { serviceId } = await params

    const service = await prisma.product.findFirst({
      where: {
        id: serviceId,
        businessId: auth.businessId,
        isService: true
      },
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
          select: { id: true, name: true }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const response = NextResponse.json({ service })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Service GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

// ===========================================
// PUT - Update Service
// ===========================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
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

    const { serviceId } = await params
    const body = await request.json()

    // Verify service exists and belongs to this business
    const existingService = await prisma.product.findFirst({
      where: {
        id: serviceId,
        businessId: auth.businessId,
        isService: true
      }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Update service
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null
    if (body.images !== undefined) updateData.images = body.images
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.serviceDuration !== undefined) updateData.serviceDuration = body.serviceDuration ? parseInt(body.serviceDuration) : null
    if (body.requiresAppointment !== undefined) updateData.requiresAppointment = body.requiresAppointment

    const service = await prisma.product.update({
      where: { id: serviceId },
      data: updateData,
      select: {
        id: true,
        name: true,
        price: true,
        serviceDuration: true,
        requiresAppointment: true,
        isActive: true,
        updatedAt: true
      }
    })

    const response = NextResponse.json({ service })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Service PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

// ===========================================
// DELETE - Delete Service
// ===========================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
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

    const { serviceId } = await params

    // Verify service exists and belongs to this business
    const existingService = await prisma.product.findFirst({
      where: {
        id: serviceId,
        businessId: auth.businessId,
        isService: true
      }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Delete service
    await prisma.product.delete({
      where: { id: serviceId }
    })

    const response = NextResponse.json({ success: true })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Service DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
