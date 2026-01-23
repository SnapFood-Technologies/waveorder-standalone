import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - Get a single brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; brandId: string }> }
) {
  try {
    const { businessId, brandId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if brands feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'brands')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        businessId
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!brand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 })
    }

    return NextResponse.json({ brand })

  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; brandId: string }> }
) {
  try {
    const { businessId, brandId } = await params

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
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json(
        { message: 'Brand name is required' },
        { status: 400 }
      )
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        businessId
      }
    })

    if (!existingBrand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 })
    }

    // Check for duplicate name (if name is being updated)
    if (name && name.trim() !== existingBrand.name) {
      const duplicateBrand = await prisma.brand.findFirst({
        where: {
          businessId,
          name: name.trim(),
          id: { not: brandId }
        }
      })

      if (duplicateBrand) {
        return NextResponse.json(
          { message: 'A brand with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update brand
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameAl !== undefined && { nameAl: nameAl?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(logo !== undefined && { logo: logo || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
        ...(isActive !== undefined && { isActive }),
        ...(metadata !== undefined && { metadata })
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({ brand })

  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; brandId: string }> }
) {
  try {
    const { businessId, brandId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if brands feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'brands')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Check if brand exists
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        businessId
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!brand) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 })
    }

    // Check if brand has products
    if (brand._count.products > 0) {
      return NextResponse.json(
        { message: `Cannot delete brand with ${brand._count.products} associated products. Please reassign or delete products first.` },
        { status: 400 }
      )
    }

    // Delete brand
    await prisma.brand.delete({
      where: { id: brandId }
    })

    return NextResponse.json({ message: 'Brand deleted successfully' })

  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
