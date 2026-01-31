// app/api/superadmin/analytics/geolocation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Exclude test businesses from all analytics
    // Use NOT to handle null/missing testMode field (existing businesses before this field was added)
    const excludeTestCondition = { NOT: { testMode: true } }

    // 1. Businesses by country (active only, excluding test)
    const businessesByCountry = await prisma.business.groupBy({
      by: ['country'],
      where: {
        country: { not: null },
        isActive: true,
        ...excludeTestCondition
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    // Also count active businesses without country (excluding test)
    const businessesWithoutCountry = await prisma.business.count({
      where: { 
        country: null,
        isActive: true,
        ...excludeTestCondition
      }
    })

    // 2. Businesses by city (extract from address - top 10, active only, excluding test)
    const allBusinesses = await prisma.business.findMany({
      where: { 
        address: { not: null },
        isActive: true,
        ...excludeTestCondition
      },
      select: { address: true, country: true }
    })

    // Parse city from address (last part before country typically)
    const cityCounts: Record<string, number> = {}
    allBusinesses.forEach(b => {
      if (b.address) {
        // Try to extract city from address
        const parts = b.address.split(',').map(p => p.trim())
        if (parts.length >= 2) {
          // City is usually second to last part
          const cityPart = parts[parts.length - 2] || parts[0]
          const city = cityPart.replace(/\d+/g, '').trim() // Remove postal codes
          if (city && city.length > 2) {
            cityCounts[city] = (cityCounts[city] || 0) + 1
          }
        }
      }
    })

    const businessesByCity = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))

    // 3. Top countries by page views (from VisitorSession, excluding test businesses)
    const viewsByCountry = await prisma.visitorSession.groupBy({
      by: ['country'],
      where: {
        country: { not: null },
        visitedAt: { gte: startDate },
        business: excludeTestCondition
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 15
    })

    // 4. Top cities by page views (excluding test businesses)
    const viewsByCity = await prisma.visitorSession.groupBy({
      by: ['city'],
      where: {
        city: { not: null },
        visitedAt: { gte: startDate },
        business: excludeTestCondition
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })

    // 5. Traffic trends by country over time (last 30 days, top 5 countries)
    const topCountries = viewsByCountry.slice(0, 5).map(v => v.country).filter(Boolean) as string[]
    
    const trafficTrends = await prisma.visitorSession.findMany({
      where: {
        country: { in: topCountries },
        visitedAt: { gte: startDate },
        business: excludeTestCondition
      },
      select: {
        country: true,
        visitedAt: true
      },
      orderBy: { visitedAt: 'asc' }
    })

    // Group by date and country
    const trendsByDateCountry: Record<string, Record<string, number>> = {}
    trafficTrends.forEach(session => {
      const date = session.visitedAt.toISOString().split('T')[0]
      if (!trendsByDateCountry[date]) {
        trendsByDateCountry[date] = {}
      }
      const country = session.country || 'Unknown'
      trendsByDateCountry[date][country] = (trendsByDateCountry[date][country] || 0) + 1
    })

    const trafficTrendsFormatted = Object.entries(trendsByDateCountry)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, countries]) => ({
        date,
        ...countries
      }))

    // 6. Mobile vs Desktop by country
    const devicesByCountry = await prisma.visitorSession.groupBy({
      by: ['country', 'deviceType'],
      where: {
        country: { not: null },
        deviceType: { not: null },
        visitedAt: { gte: startDate }
      },
      _count: { id: true }
    })

    // Format device data by country
    const deviceDataByCountry: Record<string, { mobile: number; desktop: number; tablet: number }> = {}
    devicesByCountry.forEach(d => {
      const country = d.country || 'Unknown'
      if (!deviceDataByCountry[country]) {
        deviceDataByCountry[country] = { mobile: 0, desktop: 0, tablet: 0 }
      }
      const deviceType = (d.deviceType?.toLowerCase() || 'unknown') as 'mobile' | 'desktop' | 'tablet'
      if (deviceType in deviceDataByCountry[country]) {
        deviceDataByCountry[country][deviceType] = d._count.id
      }
    })

    const mobileVsDesktopByCountry = Object.entries(deviceDataByCountry)
      .map(([country, devices]) => ({
        country,
        mobile: devices.mobile,
        desktop: devices.desktop,
        tablet: devices.tablet,
        total: devices.mobile + devices.desktop + devices.tablet
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 7. Top browsers by region (excluding test businesses)
    const browsersByCountry = await prisma.visitorSession.groupBy({
      by: ['country', 'browser'],
      where: {
        country: { not: null },
        browser: { not: null },
        visitedAt: { gte: startDate },
        business: excludeTestCondition
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    // Group browsers by country
    const browserDataByCountry: Record<string, Record<string, number>> = {}
    browsersByCountry.forEach(b => {
      const country = b.country || 'Unknown'
      if (!browserDataByCountry[country]) {
        browserDataByCountry[country] = {}
      }
      const browser = b.browser || 'Unknown'
      browserDataByCountry[country][browser] = b._count.id
    })

    const topBrowsersByRegion = Object.entries(browserDataByCountry)
      .slice(0, 10)
      .map(([country, browsers]) => ({
        country,
        browsers: Object.entries(browsers)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([browser, count]) => ({ browser, count }))
      }))

    // Total stats - merge old Analytics + new VisitorSession (same as superadmin dashboard)
    // Exclude test businesses from views
    const oldPageViews = await prisma.analytics.aggregate({
      where: {
        date: { gte: startDate },
        business: excludeTestCondition
      },
      _sum: { visitors: true }
    })
    
    const newPageViews = await prisma.visitorSession.count({
      where: { 
        visitedAt: { gte: startDate },
        business: excludeTestCondition
      }
    })
    
    const totalViews = (oldPageViews?._sum.visitors || 0) + (newPageViews || 0)

    // Exclude test businesses from count
    const totalBusinessesWithCountry = await prisma.business.count({
      where: { 
        country: { not: null },
        isActive: true,
        ...excludeTestCondition
      }
    })

    return NextResponse.json({
      data: {
        // Business distribution
        businessesByCountry: businessesByCountry.map(b => ({
          country: b.country || 'Unknown',
          count: b._count.id
        })),
        businessesWithoutCountry,
        businessesByCity,
        
        // Traffic
        viewsByCountry: viewsByCountry.map(v => ({
          country: v.country || 'Unknown',
          views: v._count.id
        })),
        viewsByCity: viewsByCity.map(v => ({
          city: v.city || 'Unknown',
          views: v._count.id
        })),
        trafficTrends: trafficTrendsFormatted,
        topCountriesForTrends: topCountries,
        
        // Device & Browser
        mobileVsDesktopByCountry,
        topBrowsersByRegion,
        
        // Summary
        totalViews,
        totalBusinesses: totalBusinessesWithCountry,
        uniqueCountries: viewsByCountry.length,
        uniqueCities: viewsByCity.length
      }
    })
  } catch (error) {
    console.error('Error fetching geolocation analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
