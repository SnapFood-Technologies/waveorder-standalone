// src/app/api/superadmin/integrations/logs/route.ts
/**
 * SuperAdmin API for browsing integration API logs.
 * Supports filtering by integration, status code, date range, and business.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const integrationId = searchParams.get('integrationId') || ''
    const statusCode = searchParams.get('statusCode') || ''
    const businessId = searchParams.get('businessId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const method = searchParams.get('method') || ''

    // Build filter conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (integrationId) {
      where.integrationId = integrationId
    }

    if (statusCode) {
      where.statusCode = parseInt(statusCode)
    }

    if (businessId) {
      where.businessId = businessId
    }

    if (method) {
      where.method = method.toUpperCase()
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    const [logs, total] = await Promise.all([
      prisma.integrationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.integrationLog.count({ where }),
    ])

    // Enrich logs with business names if applicable
    const businessIds = [...new Set(logs.filter((l) => l.businessId).map((l) => l.businessId!))]
    const businesses = businessIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, name: true, slug: true },
        })
      : []

    const businessMap = new Map(businesses.map((b) => [b.id, b]))

    const enrichedLogs = logs.map((log) => ({
      ...log,
      business: log.businessId ? businessMap.get(log.businessId) || null : null,
    }))

    // Summary stats for the current filter
    const statusBreakdown = await prisma.integrationLog.groupBy({
      by: ['statusCode'],
      where,
      _count: { id: true },
    })

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        statusBreakdown: statusBreakdown.map((s) => ({
          statusCode: s.statusCode,
          count: s._count.id,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching integration logs:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
