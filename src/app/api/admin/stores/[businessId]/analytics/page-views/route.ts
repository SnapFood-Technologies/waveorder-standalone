// src/app/api/admin/stores/[businessId]/analytics/page-views/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get time-series data for page views (combining old Analytics + new VisitorSession)
    const oldAnalyticsData = await prisma.analytics.findMany({
      where: {
        businessId,
        date: { gte: startDate, lte: now }
      },
      select: {
        date: true,
        visitors: true
      },
      orderBy: { date: 'asc' }
    })

    const newVisitorSessions = await prisma.visitorSession.findMany({
      where: {
        businessId,
        visitedAt: { gte: startDate, lte: now }
      },
      select: {
        visitedAt: true
      },
      orderBy: { visitedAt: 'asc' }
    })

    // Merge and group time-series data by date
    const pageViewsTimeSeries = new Map<string, number>()

    // Add old analytics data
    oldAnalyticsData.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0]
      pageViewsTimeSeries.set(dateKey, (pageViewsTimeSeries.get(dateKey) || 0) + (item.visitors || 0))
    })

    // Add new visitor sessions data (group by date)
    newVisitorSessions.forEach(session => {
      const dateKey = session.visitedAt.toISOString().split('T')[0]
      pageViewsTimeSeries.set(dateKey, (pageViewsTimeSeries.get(dateKey) || 0) + 1)
    })

    // Convert to sorted array
    const pageViewsData = Array.from(pageViewsTimeSeries.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ pageViewsTimeSeries: pageViewsData })

  } catch (error) {
    console.error('Error fetching page views analytics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
