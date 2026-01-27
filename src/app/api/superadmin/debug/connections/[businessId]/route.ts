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

    // Find products that have this business in connectedBusinesses (shared from other businesses)
    const productsSharedWithThisBusiness = await prisma.product.findMany({
      where: {
        connectedBusinesses: { has: businessId },
        businessId: { not: businessId } // Not owned by this business
      },
      select: {
        id: true,
        businessId: true
      }
    })

    // Find products this business has shared with others
    const productsSharedByThisBusiness = await prisma.product.findMany({
      where: {
        businessId,
        connectedBusinesses: { isEmpty: false }
      },
      select: {
        id: true,
        connectedBusinesses: true
      }
    })

    // Get unique businesses this one is connected to (as receiver)
    const businessesSharingWithUs = [...new Set(productsSharedWithThisBusiness.map(p => p.businessId))]
    
    // Get unique businesses this one shares with (as sharer)
    const businessesWeShareWith = [...new Set(productsSharedByThisBusiness.flatMap(p => p.connectedBusinesses))]

    // Determine role
    let role = 'standalone'
    if (businessesSharingWithUs.length > 0 && businessesWeShareWith.length > 0) {
      role = 'both' // Both receives and shares products
    } else if (businessesSharingWithUs.length > 0) {
      role = 'receiver' // Receives products from other businesses (marketplace/originator)
    } else if (businessesWeShareWith.length > 0) {
      role = 'sharer' // Shares products with other businesses (supplier)
    }

    // Get details of connected businesses
    const connectedBusinessIds = [...new Set([...businessesSharingWithUs, ...businessesWeShareWith])]
    const connectedBusinessDetails = await prisma.business.findMany({
      where: { id: { in: connectedBusinessIds } },
      select: { id: true, name: true, slug: true }
    })

    // Build connection info
    const connections = connectedBusinessDetails.map(b => {
      const productsReceived = productsSharedWithThisBusiness.filter(p => p.businessId === b.id).length
      const productsShared = productsSharedByThisBusiness.filter(p => p.connectedBusinesses.includes(b.id)).length
      
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        productsReceived,
        productsShared,
        relationship: productsReceived > 0 && productsShared > 0 ? 'bidirectional' :
                      productsReceived > 0 ? 'receiving' : 'sharing'
      }
    })

    return NextResponse.json({
      business,
      role,
      connectedBusinesses: connections,
      summary: {
        ownProducts: ownProductsCount,
        productsReceivedFromOthers: productsSharedWithThisBusiness.length,
        productsSharedWithOthers: productsSharedByThisBusiness.reduce((sum, p) => sum + p.connectedBusinesses.length, 0),
        totalConnections: connectedBusinessIds.length
      }
    })
  } catch (error) {
    console.error('Error in connections debug:', error)
    return NextResponse.json({ error: 'Failed to analyze connections' }, { status: 500 })
  }
}
