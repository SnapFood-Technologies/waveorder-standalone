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

    // 1. Businesses by country
    const businessesByCountry = await prisma.business.groupBy({
      by: ['country'],
      where: {
        country: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    // Also count businesses without country
    const businessesWithoutCountry = await prisma.business.count({
      where: { country: null }
    })

    // 2. Businesses by city (extract from address - top 10)
    const allBusinesses = await prisma.business.findMany({
      where: { address: { not: null } },
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

    // 3. Top countries by page views (from VisitorSession)
    const viewsByCountry = await prisma.visitorSession.groupBy({
      by: ['country'],
      where: {
        country: { not: null },
        visitedAt: { gte: startDate }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 15
    })

    // 4. Top cities by page views
    const viewsByCity = await prisma.visitorSession.groupBy({
      by: ['city'],
      where: {
        city: { not: null },
        visitedAt: { gte: startDate }
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
        visitedAt: { gte: startDate }
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

    // 7. Top browsers by region
    const browsersByCountry = await prisma.visitorSession.groupBy({
      by: ['country', 'browser'],
      where: {
        country: { not: null },
        browser: { not: null },
        visitedAt: { gte: startDate }
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

    // 8. Customer locations (from orders)
    const ordersWithAddress = await prisma.order.findMany({
      where: {
        deliveryAddress: { not: null },
        createdAt: { gte: startDate }
      },
      select: {
        deliveryAddress: true,
        customerId: true
      }
    })

    // Parse country from delivery address
    const customerCountryCounts: Record<string, number> = {}
    const customerCityCounts: Record<string, number> = {}
    
    ordersWithAddress.forEach(order => {
      if (order.deliveryAddress) {
        const parts = order.deliveryAddress.split(',').map(p => p.trim())
        if (parts.length >= 1) {
          // Country is usually last part
          const country = parts[parts.length - 1]
          if (country && country.length > 1) {
            customerCountryCounts[country] = (customerCountryCounts[country] || 0) + 1
          }
          // City is usually second to last
          if (parts.length >= 2) {
            const cityPart = parts[parts.length - 2]
            const city = cityPart.replace(/\d+/g, '').trim()
            if (city && city.length > 2) {
              customerCityCounts[city] = (customerCityCounts[city] || 0) + 1
            }
          }
        }
      }
    })

    const customersByCountry = Object.entries(customerCountryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, orders]) => ({ country, orders }))

    const customersByCity = Object.entries(customerCityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, orders]) => ({ city, orders }))

    // 9. Repeat customers by country
    const repeatCustomerOrders = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    })

    const repeatCustomerIds = repeatCustomerOrders.map(r => r.customerId)
    
    const repeatCustomerAddresses = await prisma.order.findMany({
      where: {
        customerId: { in: repeatCustomerIds },
        deliveryAddress: { not: null }
      },
      select: {
        customerId: true,
        deliveryAddress: true
      },
      distinct: ['customerId']
    })

    const repeatCustomerCountryCounts: Record<string, number> = {}
    repeatCustomerAddresses.forEach(order => {
      if (order.deliveryAddress) {
        const parts = order.deliveryAddress.split(',').map(p => p.trim())
        const country = parts[parts.length - 1]
        if (country && country.length > 1) {
          repeatCustomerCountryCounts[country] = (repeatCustomerCountryCounts[country] || 0) + 1
        }
      }
    })

    const repeatCustomersByCountry = Object.entries(repeatCustomerCountryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    // Total stats
    const totalViews = await prisma.visitorSession.count({
      where: { visitedAt: { gte: startDate } }
    })

    const totalOrders = await prisma.order.count({
      where: { createdAt: { gte: startDate } }
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
        
        // Customer distribution
        customersByCountry,
        customersByCity,
        repeatCustomersByCountry,
        
        // Summary
        totalViews,
        totalOrders,
        uniqueCountries: viewsByCountry.length,
        uniqueCities: viewsByCity.length
      }
    })
  } catch (error) {
    console.error('Error fetching geolocation analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
