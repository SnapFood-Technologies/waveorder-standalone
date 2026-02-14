// src/app/api/admin/stores/[businessId]/packaging/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// GET - Fetch all packaging purchases for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

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

    const { searchParams } = new URL(request.url)
    const packagingTypeId = searchParams.get('packagingTypeId')
    const supplier = searchParams.get('supplier')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { businessId }
    
    if (packagingTypeId) {
      where.packagingTypeId = packagingTypeId
    }
    if (supplier) {
      where.supplier = { contains: supplier, mode: 'insensitive' }
    }
    if (startDate || endDate) {
      where.purchaseDate = {}
      if (startDate) {
        where.purchaseDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.purchaseDate.lte = new Date(endDate)
      }
    }

    const purchases = await prisma.packagingPurchase.findMany({
      where,
      include: {
        packagingType: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    })

    return NextResponse.json({ purchases })

  } catch (error) {
    console.error('Error fetching packaging purchases:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new packaging purchase
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

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

    const { packagingTypeId, supplier, supplierContact, quantity, unitCost, purchaseDate, notes } = await request.json()

    if (!packagingTypeId) {
      return NextResponse.json({ message: 'Packaging type is required' }, { status: 400 })
    }
    if (!supplier?.trim()) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 })
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ message: 'Valid quantity is required' }, { status: 400 })
    }
    if (!unitCost || unitCost < 0) {
      return NextResponse.json({ message: 'Valid unit cost is required' }, { status: 400 })
    }

    // Verify packaging type belongs to this business
    const packagingType = await prisma.packagingType.findFirst({
      where: { id: packagingTypeId, businessId }
    })

    if (!packagingType) {
      return NextResponse.json({ message: 'Packaging type not found' }, { status: 404 })
    }

    const totalCost = quantity * unitCost

    const purchase = await prisma.packagingPurchase.create({
      data: {
        businessId,
        packagingTypeId,
        supplier: supplier.trim(),
        supplierContact: supplierContact?.trim() || null,
        quantity: parseFloat(quantity),
        unitCost: parseFloat(unitCost),
        totalCost,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        notes: notes?.trim() || null
      },
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

    return NextResponse.json({ purchase }, { status: 201 })

  } catch (error) {
    console.error('Error creating packaging purchase:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
