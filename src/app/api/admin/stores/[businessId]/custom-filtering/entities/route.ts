import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - Get available entities for custom filtering
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

    // Check if custom filtering feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customFiltering')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Check for connected businesses
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const hasConnections = business?.connectedBusinesses && Array.isArray(business.connectedBusinesses) && business.connectedBusinesses.length > 0
    
    // Build businessIds array for queries (include connected businesses)
    const businessIds = hasConnections 
      ? [businessId, ...business.connectedBusinesses]
      : [businessId]

    // Fetch all available entities in parallel
    const [categories, collections, groups, brands] = await Promise.all([
      prisma.category.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      }),
      prisma.collection.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      }),
      prisma.group.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      }),
      prisma.brand.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({
      categories,
      collections,
      groups,
      brands
    })

  } catch (error) {
    console.error('Error fetching filter entities:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}