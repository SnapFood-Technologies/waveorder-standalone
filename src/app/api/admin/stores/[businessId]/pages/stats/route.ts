import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get page view statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    })

    if (!businessUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { legalPagesEnabled: true },
    })

    if (!business?.legalPagesEnabled) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 })
    }

    // Get all pages with view counts
    const pages = await prisma.storePage.findMany({
      where: { businessId },
      select: {
        id: true,
        slug: true,
        title: true,
        views: true,
        isEnabled: true,
      },
      orderBy: { views: 'desc' },
    })

    // Get detailed view data with geolocation
    const pageViews = await prisma.storePageView.findMany({
      where: { businessId },
      select: {
        pageId: true,
        country: true,
        city: true,
        viewedAt: true,
      },
    })

    // Calculate totals
    const totalViews = pages.reduce((sum, page) => sum + page.views, 0)
    const enabledPages = pages.filter(p => p.isEnabled)
    const totalEnabledViews = enabledPages.reduce((sum, page) => sum + page.views, 0)
    const mostViewed = pages.length > 0 ? pages[0] : null

    // Aggregate by country
    const countryMap = new Map<string, number>()
    pageViews.forEach(view => {
      if (view.country) {
        countryMap.set(view.country, (countryMap.get(view.country) || 0) + 1)
      }
    })
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Aggregate by city
    const cityMap = new Map<string, { city: string; country: string; views: number }>()
    pageViews.forEach(view => {
      if (view.city && view.country) {
        const key = `${view.city}|${view.country}`
        const existing = cityMap.get(key) || { city: view.city, country: view.country, views: 0 }
        existing.views++
        cityMap.set(key, existing)
      }
    })
    const topCities = Array.from(cityMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    return NextResponse.json({
      totalViews,
      totalEnabledViews,
      totalPages: pages.length,
      enabledPages: enabledPages.length,
      mostViewed: mostViewed ? {
        slug: mostViewed.slug,
        title: mostViewed.title,
        views: mostViewed.views,
      } : null,
      pages: pages.map(p => ({
        slug: p.slug,
        title: p.title,
        views: p.views,
        isEnabled: p.isEnabled,
      })),
      topCountries,
      topCities,
    })
  } catch (error) {
    console.error('Error fetching page stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
