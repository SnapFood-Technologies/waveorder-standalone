// SuperAdmin: service request stats for a single SERVICES business
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = (searchParams.get('search') || '').trim()
    const status = searchParams.get('status') || ''
    const period = searchParams.get('period') || 'last_30_days'

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, currency: true, businessType: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (business.businessType !== 'SERVICES') {
      return NextResponse.json(
        { message: 'Service requests are only available for SERVICES businesses' },
        { status: 403 }
      )
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date | undefined
    let grouping: 'day' | 'week' | 'month' = 'day'

    switch (period) {
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        grouping = 'day'
        break
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        grouping = 'day'
        break
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        grouping = 'week'
        break
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        grouping = 'week'
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        grouping = 'month'
        break
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear(), 0, 1)
        grouping = 'month'
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        grouping = 'day'
    }

    const whereClause: Record<string, unknown> = {
      businessId,
      createdAt: {
        gte: startDate,
        ...(endDate && { lt: endDate })
      }
    }

    if (status && status !== 'all') {
      const valid = ['NEW', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
      if (valid.includes(status)) whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { message: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [totalRequests, requests, allInPeriod] = await Promise.all([
      prisma.serviceRequest.count({ where: whereClause }),
      prisma.serviceRequest.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.serviceRequest.findMany({
        where: {
          businessId,
          createdAt: {
            gte: startDate,
            ...(endDate && { lt: endDate })
          }
        },
        select: { status: true, createdAt: true }
      })
    ])

    const completedCount = allInPeriod.filter((r) => r.status === 'COMPLETED').length
    const statusBreakdown: Record<string, number> = {}
    allInPeriod.forEach((r) => {
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1
    })

    const chartDataMap = new Map<string, number>()
    allInPeriod.forEach((r) => {
      const d = new Date(r.createdAt)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      chartDataMap.set(dateKey, (chartDataMap.get(dateKey) || 0) + 1)
    })
    const chartData = Array.from(chartDataMap.entries())
      .map(([date, count]) => ({ date, requests: count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const completionRate = allInPeriod.length > 0 ? (completedCount / allInPeriod.length) * 100 : 0

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
        businessType: business.businessType
      },
      stats: {
        totalRequests: allInPeriod.length,
        completedRequests: completedCount,
        cancelledRequests: statusBreakdown['CANCELLED'] || 0,
        completionRate,
        statusBreakdown
      },
      chartData,
      requests: requests.map((r) => ({
        id: r.id,
        requestType: r.requestType,
        requesterType: r.requesterType,
        contactName: r.contactName,
        companyName: r.companyName,
        email: r.email,
        phone: r.phone,
        message: r.message,
        status: r.status,
        amount: r.amount,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total: totalRequests,
        pages: Math.ceil(totalRequests / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching business service-requests stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch service request stats' },
      { status: 500 }
    )
  }
}
