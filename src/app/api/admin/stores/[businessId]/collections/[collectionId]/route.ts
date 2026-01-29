import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - Get a single collection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; collectionId: string }> }
) {
  try {
    const { businessId, collectionId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if collections feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'collections')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        businessId
      }
    })

    if (!collection) {
      return NextResponse.json({ message: 'Collection not found' }, { status: 404 })
    }

    // Get product count
    const productCount = await prisma.product.count({
      where: {
        businessId,
        collectionIds: {
          has: collectionId
        }
      }
    })

    const collectionWithCount = {
      ...collection,
      _count: {
        products: productCount
      }
    }

    return NextResponse.json({ collection: collectionWithCount })

  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a collection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; collectionId: string }> }
) {
  try {
    const { businessId, collectionId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if collections feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'collections')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { name, nameAl, nameEl, description, image, sortOrder, isActive, featured, metadata } = body

    // Validate required fields
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json(
        { message: 'Collection name is required' },
        { status: 400 }
      )
    }

    // Check if collection exists
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        businessId
      }
    })

    if (!existingCollection) {
      return NextResponse.json({ message: 'Collection not found' }, { status: 404 })
    }

    // Check for duplicate name (if name is being updated)
    if (name && name.trim() !== existingCollection.name) {
      const duplicateCollection = await prisma.collection.findFirst({
        where: {
          businessId,
          name: name.trim(),
          id: { not: collectionId }
        }
      })

      if (duplicateCollection) {
        return NextResponse.json(
          { message: 'A collection with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update collection
    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameAl !== undefined && { nameAl: nameAl?.trim() || null }),
        ...(nameEl !== undefined && { nameEl: nameEl?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(image !== undefined && { image: image || null }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
        ...(isActive !== undefined && { isActive }),
        ...(featured !== undefined && { featured }),
        ...(metadata !== undefined && { metadata })
      }
    })

    // Get product count
    const productCount = await prisma.product.count({
      where: {
        businessId,
        collectionIds: {
          has: collectionId
        }
      }
    })

    const collectionWithCount = {
      ...collection,
      _count: {
        products: productCount
      }
    }

    return NextResponse.json({ collection: collectionWithCount })

  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; collectionId: string }> }
) {
  try {
    const { businessId, collectionId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if collections feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'collections')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Check if collection exists
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        businessId
      }
    })

    if (!collection) {
      return NextResponse.json({ message: 'Collection not found' }, { status: 404 })
    }

    // Get product count
    const productCount = await prisma.product.count({
      where: {
        businessId,
        collectionIds: {
          has: collectionId
        }
      }
    })

    // Check if collection has products
    if (productCount > 0) {
      return NextResponse.json(
        { message: `Cannot delete collection with ${productCount} associated products. Please remove products from this collection first.` },
        { status: 400 }
      )
    }

    // Delete collection
    await prisma.collection.delete({
      where: { id: collectionId }
    })

    return NextResponse.json({ message: 'Collection deleted successfully' })

  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
