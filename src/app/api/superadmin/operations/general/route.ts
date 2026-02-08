// app/api/superadmin/operations/general/route.ts
// SuperAdmin Operations Analytics - General (platform-wide search analytics per business)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'last_30_days'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'this_week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last_7_days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last_30_days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last_90_days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 90)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
    }

    const dateFilter = { createdAt: { gte: startDate } }

    // Platform-wide search summary
    const [
      totalSearches,
      uniqueTermsResult,
      zeroResultSearches,
      topSearchTerms,
      searchesByDay,
      searchesByBusiness
    ] = await Promise.all([
      // Total searches platform-wide
      prisma.searchLog.count({ where: dateFilter }),

      // Unique search terms platform-wide
      prisma.searchLog.groupBy({
        by: ['searchTerm'],
        where: dateFilter
      }),

      // Zero result searches
      prisma.searchLog.count({
        where: { ...dateFilter, resultsCount: 0 }
      }),

      // Top search terms platform-wide
      prisma.searchLog.groupBy({
        by: ['searchTerm'],
        where: dateFilter,
        _count: { searchTerm: true },
        _avg: { resultsCount: true },
        orderBy: { _count: { searchTerm: 'desc' } },
        take: 20
      }),

      // Searches by day for trend chart
      prisma.searchLog.findMany({
        where: dateFilter,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),

      // Searches grouped by business
      prisma.searchLog.groupBy({
        by: ['businessId'],
        where: dateFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      })
    ])

    // Get business details for the top searching businesses
    const businessIds = searchesByBusiness.map(s => s.businessId)
    const businesses = businessIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: businessIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            businessType: true
          }
        })
      : []

    const businessMap = new Map(businesses.map(b => [b.id, b]))

    // Get per-business search details (unique terms, zero results)
    const perBusinessStats = await Promise.all(
      searchesByBusiness.slice(0, 20).map(async (item) => {
        const [uniqueTerms, zeroResults, topTerms] = await Promise.all([
          prisma.searchLog.groupBy({
            by: ['searchTerm'],
            where: { businessId: item.businessId, ...dateFilter }
          }),
          prisma.searchLog.count({
            where: { businessId: item.businessId, ...dateFilter, resultsCount: 0 }
          }),
          prisma.searchLog.groupBy({
            by: ['searchTerm'],
            where: { businessId: item.businessId, ...dateFilter },
            _count: { searchTerm: true },
            _avg: { resultsCount: true },
            orderBy: { _count: { searchTerm: 'desc' } },
            take: 5
          })
        ])

        const business = businessMap.get(item.businessId)

        return {
          businessId: item.businessId,
          businessName: business?.name || 'Unknown',
          businessSlug: business?.slug || '',
          businessType: business?.businessType || 'OTHER',
          totalSearches: item._count.id,
          uniqueTerms: uniqueTerms.length,
          zeroResults,
          topTerms: topTerms.map(t => ({
            term: t.searchTerm,
            count: t._count.searchTerm,
            avgResults: Math.round(t._avg.resultsCount || 0)
          }))
        }
      })
    )

    // Aggregate searches by day
    const searchesByDayMap = new Map<string, number>()
    searchesByDay.forEach(log => {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      searchesByDayMap.set(dateKey, (searchesByDayMap.get(dateKey) || 0) + 1)
    })

    // Fill in missing days with 0 (last 7 days for chart)
    const searchTrend: Array<{ date: string; count: number }> = []
    const chartStart = new Date(now)
    chartStart.setDate(now.getDate() - 6)
    chartStart.setHours(0, 0, 0, 0)
    const current = new Date(chartStart)
    while (current <= now) {
      const dateKey = current.toISOString().split('T')[0]
      searchTrend.push({
        date: dateKey,
        count: searchesByDayMap.get(dateKey) || 0
      })
      current.setDate(current.getDate() + 1)
    }

    // Top zero-result terms (platform-wide) -- what customers search but can't find
    const zeroResultTerms = await prisma.searchLog.groupBy({
      by: ['searchTerm'],
      where: { ...dateFilter, resultsCount: 0 },
      _count: { searchTerm: true },
      orderBy: { _count: { searchTerm: 'desc' } },
      take: 10
    })

    return NextResponse.json({
      summary: {
        totalSearches,
        uniqueTerms: uniqueTermsResult.length,
        zeroResultSearches,
        zeroResultRate: totalSearches > 0
          ? ((zeroResultSearches / totalSearches) * 100).toFixed(1)
          : '0.0',
        businessesWithSearches: searchesByBusiness.length
      },
      topSearchTerms: topSearchTerms.map(t => ({
        term: t.searchTerm,
        count: t._count.searchTerm,
        avgResults: Math.round(t._avg.resultsCount || 0)
      })),
      zeroResultTerms: zeroResultTerms.map(t => ({
        term: t.searchTerm,
        count: t._count.searchTerm
      })),
      searchTrend,
      perBusinessStats
    })
  } catch (error) {
    console.error('Error fetching general operations analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
