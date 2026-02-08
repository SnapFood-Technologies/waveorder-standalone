// app/api/superadmin/operations/orders/route.ts
// SuperAdmin Operations Analytics - Orders overview across all businesses
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
    const businessType = searchParams.get('businessType') || 'all'

    // Calculate date range based on period
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
        startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
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

    // Build business type filter
    const businessFilter: any = {}
    if (businessType !== 'all') {
      businessFilter.businessType = businessType
    }

    // Exclude test businesses
    const excludeTest = { NOT: { testMode: true } }

    // Get businesses matching filter (for joins)
    const matchingBusinessIds = await prisma.business.findMany({
      where: { ...excludeTest, ...businessFilter },
      select: { id: true }
    })
    const businessIds = matchingBusinessIds.map(b => b.id)

    const orderWhere = {
      businessId: { in: businessIds },
      createdAt: { gte: startDate }
    }

    const prevOrderWhere = {
      businessId: { in: businessIds },
      createdAt: { gte: prevStartDate, lt: prevEndDate }
    }

    // Fetch all stats in parallel
    const [
      totalOrders,
      prevTotalOrders,
      completedOrders,
      cancelledOrders,
      ordersByStatus,
      ordersByType,
      ordersByPayment,
      recentOrders,
      allPeriodOrders,
      prevPeriodOrders,
      businessesWithOrders
    ] = await Promise.all([
      // Total orders in current period
      prisma.order.count({ where: orderWhere }),

      // Total orders in previous period (for comparison)
      prisma.order.count({ where: prevOrderWhere }),

      // Completed orders (delivered, picked up, or ready)
      prisma.order.count({
        where: {
          ...orderWhere,
          status: { in: ['DELIVERED', 'PICKED_UP', 'READY'] }
        }
      }),

      // Cancelled orders
      prisma.order.count({
        where: { ...orderWhere, status: 'CANCELLED' }
      }),

      // Orders grouped by status
      prisma.order.groupBy({
        by: ['status'],
        where: orderWhere,
        _count: { id: true }
      }),

      // Orders grouped by type (delivery/pickup/dine-in)
      prisma.order.groupBy({
        by: ['type'],
        where: orderWhere,
        _count: { id: true }
      }),

      // Orders grouped by payment status
      prisma.order.groupBy({
        by: ['paymentStatus'],
        where: orderWhere,
        _count: { id: true }
      }),

      // Recent orders for trend chart (fetch createdAt for day aggregation)
      prisma.order.findMany({
        where: orderWhere,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),

      // All orders in period with business info for top businesses
      prisma.order.findMany({
        where: orderWhere,
        select: {
          businessId: true,
          total: true,
          status: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              businessType: true,
              currency: true
            }
          }
        }
      }),

      // Previous period orders for comparison
      prisma.order.findMany({
        where: prevOrderWhere,
        select: { businessId: true }
      }),

      // Count unique businesses with orders in this period
      prisma.order.groupBy({
        by: ['businessId'],
        where: orderWhere,
        _count: { id: true }
      })
    ])

    // Calculate active businesses count
    const activeBusinessCount = businessesWithOrders.length
    const totalBusinessCount = businessIds.length

    // Average orders per business (only businesses that have orders)
    const avgOrdersPerBusiness = activeBusinessCount > 0
      ? (totalOrders / activeBusinessCount).toFixed(1)
      : '0'

    // Period change percentage
    const periodChange = prevTotalOrders > 0
      ? (((totalOrders - prevTotalOrders) / prevTotalOrders) * 100).toFixed(1)
      : totalOrders > 0 ? '100.0' : '0.0'

    // Aggregate orders by day for trend chart
    const ordersByDayMap = new Map<string, number>()
    recentOrders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      ordersByDayMap.set(dateKey, (ordersByDayMap.get(dateKey) || 0) + 1)
    })

    // Fill in missing days with 0
    const ordersByDay: Array<{ date: string; count: number }> = []
    const current = new Date(startDate)
    while (current <= now) {
      const dateKey = current.toISOString().split('T')[0]
      ordersByDay.push({
        date: dateKey,
        count: ordersByDayMap.get(dateKey) || 0
      })
      current.setDate(current.getDate() + 1)
    }

    // Top businesses by order count
    const businessOrderMap = new Map<string, {
      id: string
      name: string
      slug: string
      businessType: string
      currency: string
      orderCount: number
      totalValue: number
    }>()

    allPeriodOrders.forEach(order => {
      const existing = businessOrderMap.get(order.businessId)
      if (existing) {
        existing.orderCount++
        existing.totalValue += order.total
      } else {
        businessOrderMap.set(order.businessId, {
          id: order.business.id,
          name: order.business.name,
          slug: order.business.slug,
          businessType: order.business.businessType,
          currency: order.business.currency,
          orderCount: 1,
          totalValue: order.total
        })
      }
    })

    const topBusinesses = Array.from(businessOrderMap.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 15)

    // Businesses with no orders in this period
    const businessesWithOrderIds = new Set(allPeriodOrders.map(o => o.businessId))
    const businessesWithNoOrders = await prisma.business.findMany({
      where: {
        id: { in: businessIds.filter(id => !businessesWithOrderIds.has(id)) },
        isActive: true,
        setupWizardCompleted: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Orders by business type
    const ordersByBusinessType = new Map<string, number>()
    allPeriodOrders.forEach(order => {
      const type = order.business.businessType
      ordersByBusinessType.set(type, (ordersByBusinessType.get(type) || 0) + 1)
    })

    const ordersByBusinessTypeArr = Array.from(ordersByBusinessType.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      overview: {
        totalOrders,
        prevTotalOrders,
        periodChange: parseFloat(periodChange),
        completedOrders,
        cancelledOrders,
        activeBusinesses: activeBusinessCount,
        totalBusinesses: totalBusinessCount,
        avgOrdersPerBusiness: parseFloat(avgOrdersPerBusiness)
      },
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      ordersByType: ordersByType.map(item => ({
        type: item.type,
        count: item._count.id
      })),
      ordersByPayment: ordersByPayment.map(item => ({
        status: item.paymentStatus,
        count: item._count.id
      })),
      ordersByBusinessType: ordersByBusinessTypeArr,
      ordersByDay,
      topBusinesses,
      businessesWithNoOrders: businessesWithNoOrders.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching operations orders analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
