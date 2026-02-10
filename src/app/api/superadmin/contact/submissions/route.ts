// src/app/api/superadmin/contact/submissions/route.ts
/**
 * SuperAdmin API: Contact Form Submissions
 * GET - List all contact submissions with filters, pagination, and analytics
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Auth check - SuperAdmin only
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const subject = searchParams.get('subject') || 'all'
    const spamFilter = searchParams.get('spam') || 'all'
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (subject !== 'all') {
      where.subject = subject.toUpperCase()
    }

    if (spamFilter === 'spam') {
      where.isSpam = true
    } else if (spamFilter === 'not_spam') {
      where.isSpam = false
    }

    // Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.contactMessage.count({ where })
    ])

    // Fetch analytics data
    const [
      totalAll,
      totalPending,
      totalInProgress,
      totalResolved,
      totalSpam,
      totalClosed,
      subjectCounts,
      recentByDay
    ] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.contactMessage.count({ where: { status: 'RESOLVED' } }),
      prisma.contactMessage.count({ where: { isSpam: true } }),
      prisma.contactMessage.count({ where: { status: 'CLOSED' } }),
      prisma.contactMessage.groupBy({
        by: ['subject'],
        _count: { id: true }
      }),
      // Get submissions by day for last 7 days
      (async () => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recent = await prisma.contactMessage.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' }
        })
        // Group by day
        const byDay: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toISOString().split('T')[0]
          byDay[key] = 0
        }
        recent.forEach(s => {
          const key = new Date(s.createdAt).toISOString().split('T')[0]
          if (byDay[key] !== undefined) byDay[key]++
        })
        return Object.entries(byDay).map(([date, count]) => ({ date, count }))
      })()
    ])

    // Extract unique countries/cities from IP data for analytics
    // Parse IP geolocation from submissions that have it
    const allSubmissions = await prisma.contactMessage.findMany({
      select: { ipAddress: true, country: true, city: true }
    })

    const countryCounts: Record<string, number> = {}
    const cityCounts: Record<string, number> = {}

    allSubmissions.forEach((s: any) => {
      if (s.country) {
        countryCounts[s.country] = (countryCounts[s.country] || 0) + 1
      }
      if (s.city) {
        cityCounts[s.city] = (cityCounts[s.city] || 0) + 1
      }
    })

    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))

    // Format subject counts
    const subjectStats = subjectCounts.map((s: any) => ({
      subject: s.subject,
      count: s._count.id
    }))

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      analytics: {
        total: totalAll,
        byStatus: {
          pending: totalPending,
          inProgress: totalInProgress,
          resolved: totalResolved,
          spam: totalSpam,
          closed: totalClosed
        },
        bySubject: subjectStats,
        byDay: recentByDay,
        topCountries,
        topCities
      }
    })
  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact submissions' },
      { status: 500 }
    )
  }
}
