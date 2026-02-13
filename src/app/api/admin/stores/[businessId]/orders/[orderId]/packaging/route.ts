// src/app/api/admin/stores/[businessId]/orders/[orderId]/packaging/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

// GET - Fetch packaging assigned to an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const { businessId, orderId } = await params

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

    // Verify order belongs to this business
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    const orderPackaging = await prisma.orderPackaging.findMany({
      where: { orderId },
      include: {
        packagingType: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ orderPackaging })

  } catch (error) {
    console.error('Error fetching order packaging:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Assign packaging to an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const { businessId, orderId } = await params

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

    // Verify order belongs to this business
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    const { packagingTypeId, quantity, itemsPerPackage, cost, notes } = await request.json()

    if (!packagingTypeId) {
      return NextResponse.json({ message: 'Packaging type is required' }, { status: 400 })
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ message: 'Valid quantity is required' }, { status: 400 })
    }

    // Verify packaging type belongs to this business
    const packagingType = await prisma.packagingType.findFirst({
      where: { id: packagingTypeId, businessId }
    })

    if (!packagingType) {
      return NextResponse.json({ message: 'Packaging type not found' }, { status: 404 })
    }

    const orderPackaging = await prisma.orderPackaging.create({
      data: {
        businessId,
        orderId,
        packagingTypeId,
        quantity: parseInt(quantity),
        itemsPerPackage: itemsPerPackage ? parseInt(itemsPerPackage) : null,
        cost: cost !== undefined && cost !== null ? parseFloat(cost) : null,
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

    return NextResponse.json({ orderPackaging }, { status: 201 })

  } catch (error) {
    console.error('Error creating order packaging:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
