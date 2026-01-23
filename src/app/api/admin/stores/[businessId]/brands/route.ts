import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - List all brands for a business
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

    // Check if brands feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'brands')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Get connected businesses for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { businessId: businessId },
          { businessId: { in: business?.connectedBusinesses || [] } }
        ]
      },
      include: {
        _count: {
          select: {
            products: true
          }
        },
        business: { select: { id: true, name: true } }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ brands })

  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new brand
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

    // Check if brands feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'brands')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { name, nameAl, description, logo, website, sortOrder, isActive, metadata } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: 'Brand name is required' },
        { status: 400 }
      )
    }

    // Check if brand with same name already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        businessId,
        name: name.trim()
      }
    })

    if (existingBrand) {
      return NextResponse.json(
        { message: 'A brand with this name already exists' },
        { status: 400 }
      )
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        businessId,
        name: name.trim(),
        nameAl: nameAl?.trim() || null,
        description: description?.trim() || null,
        logo: logo || null,
        website: website?.trim() || null,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        isActive: isActive !== undefined ? isActive : true,
        metadata: metadata || null
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({ brand }, { status: 201 })

  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
