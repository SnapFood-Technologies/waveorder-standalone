// app/api/superadmin/operations/bookings/route.ts
// SuperAdmin Operations Analytics - Bookings/Appointments overview across all businesses
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

    // Build business type filter - only SALON businesses have appointments
    const businessFilter: any = {
      businessType: 'SALON'
    }
    if (businessType !== 'all' && businessType !== 'SALON') {
      // If filtering for non-salon, return empty results
      return NextResponse.json({
        overview: {
          totalBookings: 0,
          prevTotalBookings: 0,
          periodChange: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          noShowBookings: 0,
          activeBusinesses: 0,
          totalBusinesses: 0,
          avgBookingsPerBusiness: 0
        },
        bookingsByStatus: [],
        bookingsByDay: [],
        topBusinesses: [],
        businessesWithNoBookings: []
      })
    }

    // Exclude test businesses
    const excludeTest = { NOT: { testMode: true } }

    // Get active salon businesses matching filter
    const matchingBusinessIds = await prisma.business.findMany({
      where: { 
        ...excludeTest, 
        ...businessFilter,
        isActive: true,
        setupWizardCompleted: true
      },
      select: { id: true }
    })
    const businessIds = matchingBusinessIds.map(b => b.id)

    // Filter appointments by createdAt (when the booking was made)
    const appointmentWhere = {
      businessId: { in: businessIds },
      createdAt: { gte: startDate }
    }

    const prevAppointmentWhere = {
      businessId: { in: businessIds },
      createdAt: { gte: prevStartDate, lt: prevEndDate }
    }

    // Fetch all stats in parallel
    const [
      totalBookings,
      prevTotalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      bookingsByStatus,
      recentBookings,
      allPeriodBookings,
      prevPeriodBookings,
      businessesWithBookings
    ] = await Promise.all([
      // Total bookings in current period
      prisma.appointment.count({ where: appointmentWhere }),

      // Total bookings in previous period (for comparison)
      prisma.appointment.count({ where: prevAppointmentWhere }),

      // Completed bookings
      prisma.appointment.count({
        where: {
          ...appointmentWhere,
          status: 'COMPLETED'
        }
      }),

      // Cancelled bookings
      prisma.appointment.count({
        where: { ...appointmentWhere, status: 'CANCELLED' }
      }),

      // No-show bookings
      prisma.appointment.count({
        where: { ...appointmentWhere, status: 'NO_SHOW' }
      }),

      // Bookings grouped by status
      prisma.appointment.groupBy({
        by: ['status'],
        where: appointmentWhere,
        _count: { id: true }
      }),

      // Recent bookings for trend chart (fetch createdAt for day aggregation)
      prisma.appointment.findMany({
        where: appointmentWhere,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),

      // All bookings in period with business info for top businesses
      prisma.appointment.findMany({
        where: appointmentWhere,
        select: {
          businessId: true,
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

      // Previous period bookings for comparison
      prisma.appointment.findMany({
        where: prevAppointmentWhere,
        select: { businessId: true }
      }),

      // Count unique businesses with bookings in this period
      prisma.appointment.groupBy({
        by: ['businessId'],
        where: appointmentWhere,
        _count: { id: true }
      })
    ])

    // Calculate active businesses count
    const activeBusinessCount = businessesWithBookings.length
    const totalBusinessCount = businessIds.length

    // Average bookings per business (only businesses that have bookings)
    const avgBookingsPerBusiness = activeBusinessCount > 0
      ? (totalBookings / activeBusinessCount).toFixed(1)
      : '0.0'

    // Calculate period change percentage
    const periodChange = prevTotalBookings > 0
      ? (((totalBookings - prevTotalBookings) / prevTotalBookings) * 100).toFixed(1)
      : totalBookings > 0 ? '100.0' : '0.0'

    // Aggregate bookings by day for trend chart
    const bookingsByDayMap = new Map<string, number>()
    recentBookings.forEach(booking => {
      const dateKey = booking.createdAt.toISOString().split('T')[0]
      bookingsByDayMap.set(dateKey, (bookingsByDayMap.get(dateKey) || 0) + 1)
    })

    const bookingsByDay = Array.from(bookingsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate top businesses by booking count
    const businessBookingCounts = new Map<string, { count: number; business: any }>()
    allPeriodBookings.forEach(booking => {
      const businessId = booking.businessId
      const existing = businessBookingCounts.get(businessId) || { count: 0, business: booking.business }
      existing.count++
      businessBookingCounts.set(businessId, existing)
    })

    const topBusinesses = Array.from(businessBookingCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        id: item.business.id,
        name: item.business.name,
        slug: item.business.slug,
        businessType: item.business.businessType,
        currency: item.business.currency,
        bookingCount: item.count
      }))

    // Find businesses with no bookings
    const businessesWithBookingsIds = new Set(businessesWithBookings.map(b => b.businessId))
    const businessesWithNoBookings = matchingBusinessIds
      .filter(b => !businessesWithBookingsIds.has(b.id))
      .slice(0, 10)
      .map(async (b) => {
        const business = await prisma.business.findUnique({
          where: { id: b.id },
          select: {
            id: true,
            name: true,
            slug: true,
            businessType: true,
            createdAt: true
          }
        })
        return business ? {
          id: business.id,
          name: business.name,
          slug: business.slug,
          businessType: business.businessType,
          createdAt: business.createdAt.toISOString()
        } : null
      })

    const businessesWithNoBookingsResolved = (await Promise.all(businessesWithNoBookings)).filter(Boolean)

    return NextResponse.json({
      overview: {
        totalBookings,
        prevTotalBookings,
        periodChange: parseFloat(periodChange),
        completedBookings,
        cancelledBookings,
        noShowBookings,
        activeBusinesses: activeBusinessCount,
        totalBusinesses: totalBusinessCount,
        avgBookingsPerBusiness: parseFloat(avgBookingsPerBusiness)
      },
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      bookingsByDay,
      topBusinesses,
      businessesWithNoBookings: businessesWithNoBookingsResolved
    })
  } catch (error) {
    console.error('Error fetching operations bookings analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
