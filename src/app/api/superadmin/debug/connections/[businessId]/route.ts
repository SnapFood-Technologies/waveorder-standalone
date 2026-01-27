import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { businessId } = await params

  try {
    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Count own products (products created by this business)
    const ownProductsCount = await prisma.product.count({
      where: { businessId }
    })

    // Count products shared with this business (instead of fetching all)
    const productsSharedWithThisBusinessCount = await prisma.product.count({
      where: {
        connectedBusinesses: { has: businessId },
        businessId: { not: businessId }
      }
    })

    // Count products this business has shared (instead of fetching all)
    const productsSharedByThisBusinessCount = await prisma.product.count({
      where: {
        businessId,
        connectedBusinesses: { isEmpty: false }
      }
    })


    // Determine role based on counts (fast)
    let role = 'standalone'
    if (productsSharedWithThisBusinessCount > 0 && productsSharedByThisBusinessCount > 0) {
      role = 'both'
    } else if (productsSharedWithThisBusinessCount > 0) {
      role = 'receiver'
    } else if (productsSharedByThisBusinessCount > 0) {
      role = 'sharer'
    }

    // Get connected businesses from Business.connectedBusinesses field (fast - single record)
    const businessWithConnections = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const connectedBusinessIds = businessWithConnections?.connectedBusinesses || []
    
    // Get details of connected businesses
    const connectedBusinessDetails = connectedBusinessIds.length > 0 
      ? await prisma.business.findMany({
          where: { id: { in: connectedBusinessIds } },
          select: { id: true, name: true, slug: true }
        })
      : []

    return NextResponse.json({
      business,
      role,
      connectedBusinesses: connectedBusinessDetails.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        productsReceived: 0, // Not calculated to avoid slow query
        productsShared: 0,   // Not calculated to avoid slow query
        relationship: 'connected'
      })),
      summary: {
        ownProducts: ownProductsCount,
        productsReceivedFromOthers: productsSharedWithThisBusinessCount,
        productsSharedWithOthers: productsSharedByThisBusinessCount,
        totalConnections: connectedBusinessIds.length
      }
    })
  } catch (error) {
    console.error('Error in connections debug:', error)
    return NextResponse.json({ error: 'Failed to analyze connections' }, { status: 500 })
  }
}
