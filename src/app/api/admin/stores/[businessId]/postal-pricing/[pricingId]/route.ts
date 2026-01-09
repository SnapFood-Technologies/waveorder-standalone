// src/app/api/admin/stores/[businessId]/postal-pricing/[pricingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

// GET - Get a single postal pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; pricingId: string }> }
) {
  try {
    const { businessId, pricingId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const pricing = await prisma.postalPricing.findFirst({
      where: {
        id: pricingId,
        businessId
      },
      include: {
        postal: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            type: true,
            logo: true
          }
        }
      }
    })

    if (!pricing) {
      return NextResponse.json(
        { message: 'Postal pricing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error('Error fetching postal pricing:', error)
    return NextResponse.json(
      { message: 'Failed to fetch postal pricing' },
      { status: 500 }
    )
  }
}

// PUT - Update postal pricing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; pricingId: string }> }
) {
  try {
    const { businessId, pricingId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { postalId, cityName, type, price, priceWithoutTax, minOrderValue, maxOrderValue, deliveryTime, deliveryTimeAl, notes } = body

    // Check if pricing exists and belongs to business
    const existingPricing = await prisma.postalPricing.findFirst({
      where: {
        id: pricingId,
        businessId
      }
    })

    if (!existingPricing) {
      return NextResponse.json(
        { message: 'Postal pricing not found' },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (type && !['normal', 'fast'].includes(type)) {
      return NextResponse.json(
        { message: 'Type must be "normal" or "fast"' },
        { status: 400 }
      )
    }

    // Validate price if provided
    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { message: 'Price must be greater than or equal to 0' },
        { status: 400 }
      )
    }

    // If postalId is being changed, validate it exists
    if (postalId && postalId !== existingPricing.postalId) {
      const postal = await prisma.postal.findFirst({
        where: {
          id: postalId,
          businessId
        }
      })

      if (!postal) {
        return NextResponse.json(
          { message: 'Postal service not found' },
          { status: 404 }
        )
      }
    }

    const pricing = await prisma.postalPricing.update({
      where: { id: pricingId },
      data: {
        ...(postalId !== undefined && { postalId }),
        ...(cityName !== undefined && { cityName: cityName.trim() }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceWithoutTax !== undefined && { priceWithoutTax: priceWithoutTax !== null ? parseFloat(priceWithoutTax) : null }),
        ...(minOrderValue !== undefined && { minOrderValue: minOrderValue !== null ? parseFloat(minOrderValue) : null }),
        ...(maxOrderValue !== undefined && { maxOrderValue: maxOrderValue !== null ? parseFloat(maxOrderValue) : null }),
        ...(deliveryTime !== undefined && { deliveryTime: deliveryTime?.trim() || null }),
        ...(deliveryTimeAl !== undefined && { deliveryTimeAl: deliveryTimeAl?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null })
      },
      include: {
        postal: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            type: true,
            logo: true
          }
        }
      }
    })

    return NextResponse.json({ pricing })
  } catch (error: any) {
    console.error('Error updating postal pricing:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Pricing for this postal service and city already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to update postal pricing' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete postal pricing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; pricingId: string }> }
) {
  try {
    const { businessId, pricingId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if pricing exists and belongs to business
    const pricing = await prisma.postalPricing.findFirst({
      where: {
        id: pricingId,
        businessId
      }
    })

    if (!pricing) {
      return NextResponse.json(
        { message: 'Postal pricing not found' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.postalPricing.update({
      where: { id: pricingId },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Postal pricing deleted successfully' })
  } catch (error) {
    console.error('Error deleting postal pricing:', error)
    return NextResponse.json(
      { message: 'Failed to delete postal pricing' },
      { status: 500 }
    )
  }
}
