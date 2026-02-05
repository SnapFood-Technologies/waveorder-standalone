import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch search analytics settings and data for a business
export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params

    // Fetch business with search analytics settings
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        showSearchAnalytics: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get search analytics summary (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalSearches, uniqueTerms, zeroResultSearches, topSearches] = await Promise.all([
      // Total searches
      prisma.searchLog.count({
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      // Unique search terms
      prisma.searchLog.groupBy({
        by: ['searchTerm'],
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }).then(results => results.length),
      // Zero result searches
      prisma.searchLog.count({
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo },
          resultsCount: 0
        }
      }),
      // Top search terms
      prisma.searchLog.groupBy({
        by: ['searchTerm'],
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { searchTerm: true },
        _avg: { resultsCount: true },
        orderBy: { _count: { searchTerm: 'desc' } },
        take: 10
      })
    ])

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name
      },
      settings: {
        showSearchAnalytics: business.showSearchAnalytics
      },
      summary: {
        totalSearches,
        uniqueTerms,
        zeroResultSearches,
        period: '30 days'
      },
      topSearches: topSearches.map(item => ({
        term: item.searchTerm,
        count: item._count.searchTerm,
        avgResults: Math.round(item._avg.resultsCount || 0)
      }))
    })
  } catch (error) {
    console.error('Error fetching search analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search analytics' },
      { status: 500 }
    )
  }
}

// PATCH - Update search analytics settings for a business
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()

    const { showSearchAnalytics } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        showSearchAnalytics: showSearchAnalytics === true
      },
      select: {
        id: true,
        name: true,
        showSearchAnalytics: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Search Analytics ${updatedBusiness.showSearchAnalytics ? 'enabled' : 'disabled'} for ${updatedBusiness.name}`,
      settings: {
        showSearchAnalytics: updatedBusiness.showSearchAnalytics
      }
    })
  } catch (error) {
    console.error('Error updating search analytics settings:', error)
    return NextResponse.json(
      { error: 'Failed to update search analytics settings' },
      { status: 500 }
    )
  }
}
