// src/app/api/admin/stores/[businessId]/analytics/search/route.ts
// Search analytics API - tracks search queries and results
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

interface SearchAnalyticsData {
  term: string
  count: number
  avgResults: number
  zeroResultsCount: number
  lastSearched: Date
}

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

    // Check if search analytics is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        showSearchAnalytics: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // If feature is disabled, return empty response with flag
    if (!business.showSearchAnalytics) {
      return NextResponse.json({
        enabled: false,
        message: 'Search Analytics is not enabled for this business. Contact support to enable this feature.',
        data: null
      })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, week, month, all
    const limit = parseInt(searchParams.get('limit') || '50')

    // Calculate date range based on period
    let startDate: Date
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    const now = new Date()
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all':
      default:
        startDate = new Date(0) // Beginning of time
        break
    }

    // Fetch search logs for the period
    const searchLogs = await prisma.searchLog.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        searchTerm: true,
        resultsCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Aggregate search data
    const searchTermMap = new Map<string, {
      count: number
      totalResults: number
      zeroResultsCount: number
      lastSearched: Date
    }>()

    for (const log of searchLogs) {
      const term = log.searchTerm.toLowerCase()
      const existing = searchTermMap.get(term) || {
        count: 0,
        totalResults: 0,
        zeroResultsCount: 0,
        lastSearched: log.createdAt
      }
      
      existing.count++
      existing.totalResults += log.resultsCount
      if (log.resultsCount === 0) {
        existing.zeroResultsCount++
      }
      if (log.createdAt > existing.lastSearched) {
        existing.lastSearched = log.createdAt
      }
      
      searchTermMap.set(term, existing)
    }

    // Convert to array and calculate averages
    const searchData: SearchAnalyticsData[] = Array.from(searchTermMap.entries())
      .map(([term, data]) => ({
        term,
        count: data.count,
        avgResults: Math.round(data.totalResults / data.count),
        zeroResultsCount: data.zeroResultsCount,
        lastSearched: data.lastSearched
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    // Calculate summary statistics
    const totalSearches = searchLogs.length
    const uniqueTerms = searchTermMap.size
    const zeroResultSearches = searchLogs.filter(log => log.resultsCount === 0).length
    const zeroResultRate = totalSearches > 0 
      ? Math.round((zeroResultSearches / totalSearches) * 1000) / 10 
      : 0

    // Get trending searches (most searched in last 24 hours)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentSearches = searchLogs.filter(log => log.createdAt >= twentyFourHoursAgo)
    const recentTermMap = new Map<string, number>()
    
    for (const log of recentSearches) {
      const term = log.searchTerm.toLowerCase()
      recentTermMap.set(term, (recentTermMap.get(term) || 0) + 1)
    }
    
    const trending = Array.from(recentTermMap.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get zero-result searches (opportunities to add products)
    const zeroResultTerms = Array.from(searchTermMap.entries())
      .filter(([_, data]) => data.zeroResultsCount > 0)
      .map(([term, data]) => ({
        term,
        count: data.count,
        zeroResultsCount: data.zeroResultsCount,
        zeroResultRate: Math.round((data.zeroResultsCount / data.count) * 100)
      }))
      .sort((a, b) => b.zeroResultsCount - a.zeroResultsCount)
      .slice(0, 20)

    // Search volume by day (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentLogs = searchLogs.filter(log => log.createdAt >= thirtyDaysAgo)
    
    const dailyVolume = new Map<string, number>()
    for (const log of recentLogs) {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      dailyVolume.set(dateKey, (dailyVolume.get(dateKey) || 0) + 1)
    }
    
    const volumeByDay = Array.from(dailyVolume.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      enabled: true,
      data: {
        summary: {
          totalSearches,
          uniqueTerms,
          zeroResultSearches,
          zeroResultRate,
          averageResultsPerSearch: totalSearches > 0 
            ? Math.round(searchLogs.reduce((sum, log) => sum + log.resultsCount, 0) / totalSearches)
            : 0
        },
        topSearches: searchData,
        trending,
        zeroResultTerms,
        volumeByDay,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching search analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
