// src/app/api/admin/stores/[businessId]/analytics/geographic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


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

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = now
    }

    endDate.setHours(23, 59, 59, 999)

    // Fetch BOTH old Analytics AND new VisitorSession data
    // Old Analytics data
    const oldAnalytics = await prisma.analytics.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { country: { not: null } },
          { city: { not: null } }
        ]
      },
      select: {
        country: true,
        city: true,
        region: true,
        visitors: true
      }
    })
    
    // New VisitorSession data
    const visitorSessions = await prisma.visitorSession.findMany({
      where: {
        businessId,
        visitedAt: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { country: { not: null } },
          { city: { not: null } }
        ]
      },
      select: {
        country: true,
        city: true,
        region: true
      }
    })

    // Fetch orders with customer location data
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        paymentStatus: 'PAID',
        OR: [
          { type: 'DELIVERY', status: 'DELIVERED' },
          { type: 'PICKUP', status: 'PICKED_UP' },
          { type: 'DINE_IN', status: 'PICKED_UP' }
        ],
        NOT: {
          status: {
            in: ['CANCELLED', 'REFUNDED']
          }
        }
      },
      select: {
        total: true,
        customer: {
          select: {
            addressJson: true
          }
        }
      }
    })

    // Aggregate by country - COMBINE old Analytics + new VisitorSessions
    const countryMap = new Map<string, { visitors: number; orders: number; revenue: number }>()
    
    // Add old Analytics data
    oldAnalytics.forEach(analytics => {
      if (analytics.country) {
        const existing = countryMap.get(analytics.country) || { visitors: 0, orders: 0, revenue: 0 }
        existing.visitors += analytics.visitors
        countryMap.set(analytics.country, existing)
      }
    })
    
    // Add new VisitorSession data
    visitorSessions.forEach(session => {
      if (session.country) {
        const existing = countryMap.get(session.country) || { visitors: 0, orders: 0, revenue: 0 }
        existing.visitors++
        countryMap.set(session.country, existing)
      }
    })

    // Add order data (try to extract country from customer address)
    orders.forEach(order => {
      if (order.customer?.addressJson) {
        try {
          const address = typeof order.customer.addressJson === 'string' 
            ? JSON.parse(order.customer.addressJson)
            : order.customer.addressJson
          
          const country = address?.country || address?.countryCode
          if (country) {
            const countryName = typeof country === 'string' && country.length === 2
              ? getCountryNameFromCode(country)
              : country
            
            if (countryName) {
              const existing = countryMap.get(countryName) || { visitors: 0, orders: 0, revenue: 0 }
              existing.orders += 1
              existing.revenue += order.total
              countryMap.set(countryName, existing)
            }
          }
        } catch (e) {
          // Skip invalid address JSON
        }
      }
    })

    // Aggregate by city - COMBINE old Analytics + new VisitorSessions
    const cityMap = new Map<string, { city: string; country: string; visitors: number; orders: number; revenue: number }>()
    
    // Add old Analytics data
    oldAnalytics.forEach(analytics => {
      if (analytics.city && analytics.country) {
        const key = `${analytics.city}|${analytics.country}`
        const existing = cityMap.get(key) || { city: analytics.city, country: analytics.country, visitors: 0, orders: 0, revenue: 0 }
        existing.visitors += analytics.visitors
        cityMap.set(key, existing)
      }
    })
    
    // Add new VisitorSession data
    visitorSessions.forEach(session => {
      if (session.city && session.country) {
        const key = `${session.city}|${session.country}`
        const existing = cityMap.get(key) || { city: session.city, country: session.country, visitors: 0, orders: 0, revenue: 0 }
        existing.visitors++
        cityMap.set(key, existing)
      }
    })

    // Add order data for cities
    orders.forEach(order => {
      if (order.customer?.addressJson) {
        try {
          const address = typeof order.customer.addressJson === 'string' 
            ? JSON.parse(order.customer.addressJson)
            : order.customer.addressJson
          
          const city = address?.city
          const country = address?.country || address?.countryCode
          
          if (city && country) {
            const countryName = typeof country === 'string' && country.length === 2
              ? getCountryNameFromCode(country)
              : country
            
            if (countryName) {
              const key = `${city}|${countryName}`
              const existing = cityMap.get(key) || { city, country: countryName, visitors: 0, orders: 0, revenue: 0 }
              existing.orders += 1
              existing.revenue += order.total
              cityMap.set(key, existing)
            }
          }
        } catch (e) {
          // Skip invalid address JSON
        }
      }
    })

    // Calculate total visitors for percentage calculation
    const totalVisitors = Array.from(countryMap.values()).reduce((sum, c) => sum + c.visitors, 0)

    // Convert to arrays and calculate percentages (format to 1 decimal place)
    const countries = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        visitors: data.visitors,
        orders: data.orders,
        revenue: data.revenue,
        percentage: totalVisitors > 0 ? parseFloat(((data.visitors / totalVisitors) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.visitors - a.visitors)

    const cities = Array.from(cityMap.values())
      .map(data => ({
        city: data.city,
        country: data.country,
        visitors: data.visitors,
        orders: data.orders,
        revenue: data.revenue,
        percentage: totalVisitors > 0 ? parseFloat(((data.visitors / totalVisitors) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.visitors - a.visitors)

    return NextResponse.json({
      data: {
        countries,
        cities,
        totalCountries: countries.length,
        totalCities: cities.length
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching geographic analytics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert country codes to names
function getCountryNameFromCode(code: string): string {
  const countryMap: Record<string, string> = {
    'AL': 'Albania',
    'GR': 'Greece',
    'IT': 'Italy',
    'ES': 'Spain',
    'US': 'United States',
    'XK': 'Kosovo',
    'MK': 'North Macedonia',
    'GB': 'United Kingdom',
    'FR': 'France',
    'DE': 'Germany',
    'NL': 'Netherlands',
    'CA': 'Canada'
  }
  return countryMap[code.toUpperCase()] || code
}
