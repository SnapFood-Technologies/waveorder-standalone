// src/app/api/admin/stores/[businessId]/packaging/types/[typeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// PUT - Update a packaging type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; typeId: string }> }
) {
  try {
    const { businessId, typeId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if packaging tracking is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { packagingTrackingEnabled: true }
    })

    if (!business?.packagingTrackingEnabled) {
      return NextResponse.json({ message: 'Packaging tracking is not enabled for this business' }, { status: 403 })
    }

    const { name, description, unit, isActive } = await request.json()

    // Verify packaging type belongs to this business
    const existingType = await prisma.packagingType.findFirst({
      where: { id: typeId, businessId }
    })

    if (!existingType) {
      return NextResponse.json({ message: 'Packaging type not found' }, { status: 404 })
    }

    const packagingType = await prisma.packagingType.update({
      where: { id: typeId },
      data: {
        name: name?.trim() || existingType.name,
        description: description !== undefined ? (description?.trim() || null) : existingType.description,
        unit: unit || existingType.unit,
        isActive: isActive !== undefined ? isActive : existingType.isActive
      }
    })

    return NextResponse.json({ packagingType })

  } catch (error) {
    console.error('Error updating packaging type:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a packaging type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; typeId: string }> }
) {
  try {
    const { businessId, typeId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if packaging tracking is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { packagingTrackingEnabled: true }
    })

    if (!business?.packagingTrackingEnabled) {
      return NextResponse.json({ message: 'Packaging tracking is not enabled for this business' }, { status: 403 })
    }

    // Verify packaging type belongs to this business
    const existingType = await prisma.packagingType.findFirst({
      where: { id: typeId, businessId }
    })

    if (!existingType) {
      return NextResponse.json({ message: 'Packaging type not found' }, { status: 404 })
    }

    // Check if packaging type is used in any orders
    const usageCount = await prisma.orderPackaging.count({
      where: { packagingTypeId: typeId }
    })

    if (usageCount > 0) {
      // Instead of deleting, deactivate it
      await prisma.packagingType.update({
        where: { id: typeId },
        data: { isActive: false }
      })
      return NextResponse.json({ message: 'Packaging type deactivated (used in orders)' })
    }

    await prisma.packagingType.delete({
      where: { id: typeId }
    })

    return NextResponse.json({ message: 'Packaging type deleted successfully' })

  } catch (error) {
    console.error('Error deleting packaging type:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
