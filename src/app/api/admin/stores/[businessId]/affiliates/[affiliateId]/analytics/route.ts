// Affiliate analytics API - views, conversion, geolocation, source breakdown
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; affiliateId: string }> }
) {
  try {
    const { businessId, affiliateId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: { id: affiliateId, businessId },
      select: { id: true, name: true, trackingCode: true }
    })

    if (!affiliate) {
      return NextResponse.json({ message: 'Affiliate not found' }, { status: 404 })
    }

    const trackingCode = affiliate.trackingCode

    // Fetch VisitorSessions for this affiliate's tracking code (utm_campaign)
    const sessions = await prisma.visitorSession.findMany({
      where: {
        businessId,
        campaign: trackingCode
      },
      select: {
        source: true,
        medium: true,
        country: true,
        city: true,
        region: true,
        deviceType: true,
        browser: true,
        os: true,
        referrer: true,
        referrerHost: true,
        visitedAt: true
      },
      orderBy: { visitedAt: 'desc' }
    })

    // Fetch orders attributed to this affiliate
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        affiliateId
      },
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        customer: {
          select: {
            addressJson: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const views = sessions.length
    const ordersCount = orders.length
    const conversionRate = views > 0 && ordersCount > 0
      ? Math.round((ordersCount / views) * 1000) / 10
      : 0

    // Breakdown by source
    const bySource = sessions.reduce((acc, s) => {
      const key = s.source || 'direct'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Breakdown by medium
    const byMedium = sessions.reduce((acc, s) => {
      const key = s.medium || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Breakdown by country
    const byCountry = sessions.reduce((acc, s) => {
      if (!s.country) return acc
      acc[s.country] = (acc[s.country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Breakdown by city (with country)
    const byCity: Array<{ city: string; country: string; count: number }> = []
    const cityKeyCount = new Map<string, number>()
    sessions.forEach(s => {
      if (s.city && s.country) {
        const key = `${s.city}|${s.country}`
        cityKeyCount.set(key, (cityKeyCount.get(key) || 0) + 1)
      }
    })
    cityKeyCount.forEach((count, key) => {
      const [city, country] = key.split('|')
      byCity.push({ city, country, count })
    })
    byCity.sort((a, b) => b.count - a.count)

    // Breakdown by device
    const byDevice = sessions.reduce((acc, s) => {
      const key = s.deviceType || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Top referrers
    const byReferrer: Array<{ referrer: string; referrerHost: string | null; count: number }> = []
    const referrerCount = new Map<string, number>()
    sessions.forEach(s => {
      const host = s.referrerHost || s.referrer || 'direct'
      referrerCount.set(host, (referrerCount.get(host) || 0) + 1)
    })
    referrerCount.forEach((count, ref) => {
      const session = sessions.find(s => (s.referrerHost || s.referrer || 'direct') === ref)
      byReferrer.push({
        referrer: session?.referrer || ref,
        referrerHost: session?.referrerHost || (ref === 'direct' ? null : ref),
        count
      })
    })
    byReferrer.sort((a, b) => b.count - a.count)

    // Recent sessions (last 20)
    const recentSessions = sessions.slice(0, 20).map(s => ({
      source: s.source,
      medium: s.medium,
      country: s.country,
      city: s.city,
      deviceType: s.deviceType,
      visitedAt: s.visitedAt.toISOString()
    }))

    const completedOrders = orders.filter(o =>
      ['DELIVERED', 'PICKED_UP', 'READY'].includes(o.status) && o.paymentStatus === 'PAID'
    )
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0)

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        trackingCode
      },
      summary: {
        views,
        orders: ordersCount,
        conversionRate,
        revenue
      },
      bySource: Object.entries(bySource).map(([name, count]) => ({ name, count })),
      byMedium: Object.entries(byMedium).map(([name, count]) => ({ name, count })),
      byCountry: Object.entries(byCountry).map(([name, count]) => ({ name, count })),
      byCity: byCity.slice(0, 20),
      byDevice: Object.entries(byDevice).map(([name, count]) => ({ name, count })),
      byReferrer: byReferrer.slice(0, 15),
      recentSessions,
      orders: orders.slice(0, 10).map(o => ({
        id: o.id,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
        customerName: o.customer?.name
      }))
    })
  } catch (error) {
    console.error('Affiliate analytics error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
