// src/app/api/admin/stores/[businessId]/orders/[orderId]/packaging/[packagingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// PUT - Update order packaging
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string; packagingId: string }> }
) {
  try {
    const { businessId, orderId, packagingId } = await params

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

    // Verify order packaging belongs to this business and order
    const existingPackaging = await prisma.orderPackaging.findFirst({
      where: { id: packagingId, businessId, orderId }
    })

    if (!existingPackaging) {
      return NextResponse.json({ message: 'Order packaging not found' }, { status: 404 })
    }

    const { quantity, itemsPerPackage, cost, notes } = await request.json()

    const updateData: any = {}
    if (quantity !== undefined) updateData.quantity = parseInt(quantity)
    if (itemsPerPackage !== undefined) updateData.itemsPerPackage = itemsPerPackage ? parseInt(itemsPerPackage) : null
    if (cost !== undefined) updateData.cost = cost !== null && cost !== '' ? parseFloat(cost) : null
    if (notes !== undefined) updateData.notes = notes?.trim() || null

    const orderPackaging = await prisma.orderPackaging.update({
      where: { id: packagingId },
      data: updateData,
      include: {
        packagingType: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      }
    })

    return NextResponse.json({ orderPackaging })

  } catch (error) {
    console.error('Error updating order packaging:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove packaging from an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string; packagingId: string }> }
) {
  try {
    const { businessId, orderId, packagingId } = await params

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

    // Verify order packaging belongs to this business and order
    const existingPackaging = await prisma.orderPackaging.findFirst({
      where: { id: packagingId, businessId, orderId }
    })

    if (!existingPackaging) {
      return NextResponse.json({ message: 'Order packaging not found' }, { status: 404 })
    }

    await prisma.orderPackaging.delete({
      where: { id: packagingId }
    })

    return NextResponse.json({ message: 'Order packaging removed successfully' })

  } catch (error) {
    console.error('Error deleting order packaging:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
