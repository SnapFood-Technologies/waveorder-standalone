// src/app/api/admin/stores/[businessId]/postal-pricing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

// GET - List all postal pricing for a business
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

    const { searchParams } = new URL(request.url)
    const cityName = searchParams.get('cityName')
    const postalId = searchParams.get('postalId')

    const where: any = {
      businessId
    }

    // Only include non-deleted records
    // In MongoDB, null or undefined means not deleted
    where.deletedAt = null

    if (cityName) {
      // Exact match for city name (case-sensitive)
      where.cityName = cityName.trim()
    }

    if (postalId) {
      where.postalId = postalId
    }

    const pricing = await prisma.postalPricing.findMany({
      where,
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
      },
      orderBy: [
        { cityName: 'asc' },
        { postalId: 'asc' },
        { price: 'asc' }
      ],
      take: 10000 // Limit to prevent huge responses
    })

    // Debug logging (remove in production if needed)
    console.log(`Found ${pricing.length} postal pricing records for business ${businessId}`)

    return NextResponse.json({ pricing: pricing || [] })
  } catch (error) {
    console.error('Error fetching postal pricing:', error)
    return NextResponse.json(
      { message: 'Failed to fetch postal pricing' },
      { status: 500 }
    )
  }
}

// POST - Create a new postal pricing
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

    const body = await request.json()
    const { postalId, cityName, type, price, priceWithoutTax, minOrderValue, maxOrderValue, deliveryTime, deliveryTimeAl, notes } = body

    if (!postalId || !cityName || !cityName.trim() || price === undefined) {
      return NextResponse.json(
        { message: 'Postal ID, city name, and price are required' },
        { status: 400 }
      )
    }

    // Validate postal exists and belongs to business
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

    // Validate type
    if (type && !['normal', 'fast'].includes(type)) {
      return NextResponse.json(
        { message: 'Type must be "normal" or "fast"' },
        { status: 400 }
      )
    }

    // Validate price
    if (price < 0) {
      return NextResponse.json(
        { message: 'Price must be greater than or equal to 0' },
        { status: 400 }
      )
    }

    const postalPricing = await prisma.postalPricing.create({
      data: {
        businessId,
        postalId,
        cityName: cityName.trim(),
        type: type || 'normal',
        price: parseFloat(price),
        priceWithoutTax: priceWithoutTax !== undefined ? parseFloat(priceWithoutTax) : null,
        minOrderValue: minOrderValue !== undefined ? parseFloat(minOrderValue) : null,
        maxOrderValue: maxOrderValue !== undefined ? parseFloat(maxOrderValue) : null,
        deliveryTime: deliveryTime?.trim() || null,
        deliveryTimeAl: deliveryTimeAl?.trim() || null,
        notes: notes?.trim() || null
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

    return NextResponse.json({ pricing: postalPricing }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating postal pricing:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Pricing for this postal service and city already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to create postal pricing' },
      { status: 500 }
    )
  }
}
