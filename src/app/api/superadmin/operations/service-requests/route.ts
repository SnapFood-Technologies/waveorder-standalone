// app/api/superadmin/operations/service-requests/route.ts
// SuperAdmin Operations Analytics - Service requests (SERVICES businesses only)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'this_month'

    const now = new Date()
    let startDate: Date
    let prevStartDate: Date
    let prevEndDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        prevStartDate = new Date(startDate)
        prevStartDate.setDate(prevStartDate.getDate() - 1)
        prevEndDate = new Date(startDate)
        break
      case 'this_week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        prevStartDate = new Date(startDate)
        prevStartDate.setDate(prevStartDate.getDate() - 7)
        prevEndDate = new Date(startDate)
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        prevEndDate = new Date(startDate)
        break
      case 'last_30_days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        prevStartDate = new Date(startDate)
        prevStartDate.setDate(prevStartDate.getDate() - 30)
        prevEndDate = new Date(startDate)
        break
      case 'last_90_days':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 90)
        startDate.setHours(0, 0, 0, 0)
        prevStartDate = new Date(startDate)
        prevStartDate.setDate(prevStartDate.getDate() - 90)
        prevEndDate = new Date(startDate)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        prevEndDate = new Date(startDate)
    }

    const excludeTest = { NOT: { testMode: true } }

    const matchingBusinesses = await prisma.business.findMany({
      where: {
        ...excludeTest,
        businessType: 'SERVICES',
        isActive: true,
        setupWizardCompleted: true
      },
      select: { id: true }
    })
    const businessIds = matchingBusinesses.map((b) => b.id)

    const requestWhere = {
      businessId: { in: businessIds },
      createdAt: { gte: startDate }
    }

    const prevRequestWhere = {
      businessId: { in: businessIds },
      createdAt: { gte: prevStartDate, lt: prevEndDate }
    }

    const [
      totalRequests,
      prevTotalRequests,
      completedRequests,
      cancelledRequests,
      requestsByStatus,
      recentRequests,
      allPeriodRequests,
      businessesWithRequests
    ] = await Promise.all([
      prisma.serviceRequest.count({ where: requestWhere }),
      prisma.serviceRequest.count({ where: prevRequestWhere }),
      prisma.serviceRequest.count({
        where: { ...requestWhere, status: 'COMPLETED' }
      }),
      prisma.serviceRequest.count({
        where: { ...requestWhere, status: 'CANCELLED' }
      }),
      prisma.serviceRequest.groupBy({
        by: ['status'],
        where: requestWhere,
        _count: { id: true }
      }),
      prisma.serviceRequest.findMany({
        where: requestWhere,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.serviceRequest.findMany({
        where: requestWhere,
        select: {
          businessId: true,
          status: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              businessType: true
            }
          }
        }
      }),
      prisma.serviceRequest.groupBy({
        by: ['businessId'],
        where: requestWhere,
        _count: { id: true }
      })
    ])

    const activeCount = businessesWithRequests.length
    const totalBusinessCount = businessIds.length
    const avgPerBusiness =
      activeCount > 0 ? (totalRequests / activeCount).toFixed(1) : '0.0'
    const periodChange =
      prevTotalRequests > 0
        ? (((totalRequests - prevTotalRequests) / prevTotalRequests) * 100).toFixed(1)
        : totalRequests > 0
          ? '100.0'
          : '0.0'

    const requestsByDayMap = new Map<string, number>()
    recentRequests.forEach((r) => {
      const dateKey = r.createdAt.toISOString().split('T')[0]
      requestsByDayMap.set(dateKey, (requestsByDayMap.get(dateKey) || 0) + 1)
    })
    const requestsByDay = Array.from(requestsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const businessCounts = new Map<string, { count: number; business: any }>()
    allPeriodRequests.forEach((r) => {
      const bid = r.businessId
      const existing = businessCounts.get(bid) || { count: 0, business: r.business }
      existing.count++
      businessCounts.set(bid, existing)
    })
    const topBusinesses = Array.from(businessCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        id: item.business.id,
        name: item.business.name,
        slug: item.business.slug,
        businessType: item.business.businessType,
        requestCount: item.count
      }))

    const withRequestIds = new Set(businessesWithRequests.map((b) => b.businessId))
    const noRequestBusinessIds = businessIds.filter((id) => !withRequestIds.has(id))
    const businessesWithNoRequests = await Promise.all(
      noRequestBusinessIds.slice(0, 10).map(async (id) => {
        const b = await prisma.business.findUnique({
          where: { id },
          select: { id: true, name: true, slug: true, businessType: true, createdAt: true }
        })
        return b
          ? {
              id: b.id,
              name: b.name,
              slug: b.slug,
              businessType: b.businessType,
              createdAt: b.createdAt.toISOString()
            }
          : null
      })
    ).then((arr) => arr.filter(Boolean))

    return NextResponse.json({
      overview: {
        totalRequests,
        prevTotalRequests,
        periodChange: parseFloat(periodChange),
        completedRequests,
        cancelledRequests,
        activeBusinesses: activeCount,
        totalBusinesses: totalBusinessCount,
        avgRequestsPerBusiness: parseFloat(avgPerBusiness)
      },
      requestsByStatus: requestsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id
      })),
      requestsByDay,
      topBusinesses,
      businessesWithNoRequests
    })
  } catch (error) {
    console.error('Error fetching operations service-requests analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
