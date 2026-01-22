// Test endpoint to check what's in the database
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }
    
    // Get recent VisitorSessions
    const visitorSessions = await prisma.visitorSession.findMany({
      where: { businessId },
      orderBy: { visitedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        ipAddress: true,
        country: true,
        city: true,
        source: true,
        placement: true,
        campaign: true,
        medium: true,
        visitedAt: true
      }
    })
    
    // Get old Analytics records for comparison
    const oldAnalytics = await prisma.analytics.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        date: true,
        country: true,
        city: true,
        source: true,
        visitors: true
      }
    })
    
    return NextResponse.json({
      visitorSessionsCount: visitorSessions.length,
      visitorSessions,
      oldAnalyticsCount: oldAnalytics.length,
      oldAnalytics
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
