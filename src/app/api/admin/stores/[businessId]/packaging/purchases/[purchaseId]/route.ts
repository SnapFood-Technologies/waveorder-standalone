// src/app/api/admin/stores/[businessId]/packaging/purchases/[purchaseId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// PUT - Update a packaging purchase
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; purchaseId: string }> }
) {
  try {
    const { businessId, purchaseId } = await params

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

    const { supplier, supplierContact, quantity, unitCost, purchaseDate, notes } = await request.json()

    // Verify purchase belongs to this business
    const existingPurchase = await prisma.packagingPurchase.findFirst({
      where: { id: purchaseId, businessId }
    })

    if (!existingPurchase) {
      return NextResponse.json({ message: 'Packaging purchase not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (supplier !== undefined) updateData.supplier = supplier.trim()
    if (supplierContact !== undefined) updateData.supplierContact = supplierContact?.trim() || null
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity)
    if (unitCost !== undefined) updateData.unitCost = parseFloat(unitCost)
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate)
    if (notes !== undefined) updateData.notes = notes?.trim() || null

    // Recalculate total cost if quantity or unitCost changed
    if (updateData.quantity !== undefined || updateData.unitCost !== undefined) {
      const finalQuantity = updateData.quantity ?? existingPurchase.quantity
      const finalUnitCost = updateData.unitCost ?? existingPurchase.unitCost
      updateData.totalCost = finalQuantity * finalUnitCost
    }

    const purchase = await prisma.packagingPurchase.update({
      where: { id: purchaseId },
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

    return NextResponse.json({ purchase })

  } catch (error) {
    console.error('Error updating packaging purchase:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a packaging purchase
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; purchaseId: string }> }
) {
  try {
    const { businessId, purchaseId } = await params

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

    // Verify purchase belongs to this business
    const existingPurchase = await prisma.packagingPurchase.findFirst({
      where: { id: purchaseId, businessId }
    })

    if (!existingPurchase) {
      return NextResponse.json({ message: 'Packaging purchase not found' }, { status: 404 })
    }

    await prisma.packagingPurchase.delete({
      where: { id: purchaseId }
    })

    return NextResponse.json({ message: 'Packaging purchase deleted successfully' })

  } catch (error) {
    console.error('Error deleting packaging purchase:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
