import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - List all collections for a business
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

    // Check if collections feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'collections')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Get all collections
    const collections = await prisma.collection.findMany({
      where: { businessId },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get product counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const productCount = await prisma.product.count({
          where: {
            businessId,
            collectionIds: {
              has: collection.id
            }
          }
        })

        return {
          ...collection,
          _count: {
            products: productCount
          }
        }
      })
    )

    return NextResponse.json({ collections: collectionsWithCounts })

  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new collection
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

    // Check if collections feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'collections')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { name, nameAl, description, image, sortOrder, isActive, featured, metadata } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: 'Collection name is required' },
        { status: 400 }
      )
    }

    // Check if collection with same name already exists
    const existingCollection = await prisma.collection.findFirst({
      where: {
        businessId,
        name: name.trim()
      }
    })

    if (existingCollection) {
      return NextResponse.json(
        { message: 'A collection with this name already exists' },
        { status: 400 }
      )
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        businessId,
        name: name.trim(),
        nameAl: nameAl?.trim() || null,
        description: description?.trim() || null,
        image: image || null,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        isActive: isActive !== undefined ? isActive : true,
        featured: featured !== undefined ? featured : false,
        metadata: metadata || null
      }
    })

    // Add product count
    const collectionWithCount = {
      ...collection,
      _count: {
        products: 0
      }
    }

    return NextResponse.json({ collection: collectionWithCount }, { status: 201 })

  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
