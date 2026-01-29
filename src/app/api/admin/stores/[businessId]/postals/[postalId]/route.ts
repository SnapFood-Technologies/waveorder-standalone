// src/app/api/admin/stores/[businessId]/postals/[postalId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

// GET - Get a single postal service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; postalId: string }> }
) {
  try {
    const { businessId, postalId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const postal = await prisma.postal.findFirst({
      where: {
        id: postalId,
        businessId
      },
      include: {
        _count: {
          select: { pricing: true }
        }
      }
    })

    if (!postal) {
      return NextResponse.json(
        { message: 'Postal service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ postal })
  } catch (error) {
    console.error('Error fetching postal:', error)
    return NextResponse.json(
      { message: 'Failed to fetch postal service' },
      { status: 500 }
    )
  }
}

// PUT - Update a postal service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; postalId: string }> }
) {
  try {
    const { businessId, postalId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { name, nameAl, nameEl, type, description, descriptionAl, descriptionEl, deliveryTime, deliveryTimeAl, deliveryTimeEl, logo, isActive } = body

    // Validate type
    if (type && !['normal', 'fast'].includes(type)) {
      return NextResponse.json(
        { message: 'Type must be "normal" or "fast"' },
        { status: 400 }
      )
    }

    // Check if postal exists and belongs to business
    const existingPostal = await prisma.postal.findFirst({
      where: {
        id: postalId,
        businessId
      }
    })

    if (!existingPostal) {
      return NextResponse.json(
        { message: 'Postal service not found' },
        { status: 404 }
      )
    }

    const postal = await prisma.postal.update({
      where: { id: postalId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameAl !== undefined && { nameAl: nameAl?.trim() || null }),
        ...(nameEl !== undefined && { nameEl: nameEl?.trim() || null }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(descriptionAl !== undefined && { descriptionAl: descriptionAl?.trim() || null }),
        ...(descriptionEl !== undefined && { descriptionEl: descriptionEl?.trim() || null }),
        ...(deliveryTime !== undefined && { deliveryTime: deliveryTime?.trim() || null }),
        ...(deliveryTimeAl !== undefined && { deliveryTimeAl: deliveryTimeAl?.trim() || null }),
        ...(deliveryTimeEl !== undefined && { deliveryTimeEl: deliveryTimeEl?.trim() || null }),
        ...(logo !== undefined && { logo: logo?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    })

    return NextResponse.json({ postal })
  } catch (error: any) {
    console.error('Error updating postal:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'A postal service with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to update postal service' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a postal service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; postalId: string }> }
) {
  try {
    const { businessId, postalId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if postal exists and belongs to business
    const postal = await prisma.postal.findFirst({
      where: {
        id: postalId,
        businessId
      },
      include: {
        _count: {
          select: { pricing: true }
        }
      }
    })

    if (!postal) {
      return NextResponse.json(
        { message: 'Postal service not found' },
        { status: 404 }
      )
    }

    // Check if postal has pricing records
    if (postal._count.pricing > 0) {
      return NextResponse.json(
        { message: 'Cannot delete postal service with existing pricing records. Please delete pricing records first.' },
        { status: 400 }
      )
    }

    await prisma.postal.delete({
      where: { id: postalId }
    })

    return NextResponse.json({ message: 'Postal service deleted successfully' })
  } catch (error) {
    console.error('Error deleting postal:', error)
    return NextResponse.json(
      { message: 'Failed to delete postal service' },
      { status: 500 }
    )
  }
}
