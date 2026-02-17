// src/app/api/superadmin/businesses/[businessId]/appointments/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { Prisma, AppointmentStatus } from '@prisma/client'
import { format, startOfDay, startOfWeek, startOfMonth, parseISO } from 'date-fns'


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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const period = searchParams.get('period') || 'last_30_days'

    // Verify business exists and is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, currency: true, businessType: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (business.businessType !== 'SALON') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    // Calculate date range based on period
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
        endDate = new Date(now.getFullYear(), 0, 1) // Jan 1 of current year
        grouping = 'month'
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        grouping = 'day'
    }

    // Build where clause for appointments
    const whereClause: Prisma.AppointmentWhereInput = {
      businessId: businessId,
      appointmentDate: {
        gte: startDate,
        ...(endDate && { lt: endDate })
      }
    }

    if (status && status !== 'all') {
      const validStatuses: AppointmentStatus[] = ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
      if (validStatuses.includes(status as AppointmentStatus)) {
        whereClause.status = status as AppointmentStatus
      }
    }

    if (search.trim()) {
      whereClause.OR = [
        { order: { orderNumber: { contains: search.trim(), mode: 'insensitive' } } },
        { order: { customer: { name: { contains: search.trim(), mode: 'insensitive' } } } },
        { order: { customer: { phone: { contains: search.trim() } } } }
      ]
    }

    // Get total count
    const totalAppointments = await prisma.appointment.count({ where: whereClause })

    // Get paginated appointments
    const skip = (page - 1) * limit
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { appointmentDate: 'desc' },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true
              }
            },
            items: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })

    // Fetch staff names separately (staffId refers to User ID via BusinessUser)
    const staffIds = appointments.map(a => a.staffId).filter((id): id is string => id !== null)
    const staffMap = new Map<string, string>()
    
    if (staffIds.length > 0) {
      const businessUsers = await prisma.businessUser.findMany({
        where: {
          businessId: businessId,
          userId: { in: staffIds }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      businessUsers.forEach(bu => {
        if (bu.userId && bu.user?.name) {
          staffMap.set(bu.userId, bu.user.name)
        }
      })
    }

    // Calculate stats
    const allAppointments = await prisma.appointment.findMany({
      where: {
        businessId: businessId,
        appointmentDate: {
          gte: startDate,
          ...(endDate && { lt: endDate })
        }
      },
      include: {
        order: {
          select: {
            total: true,
            paymentStatus: true
          }
        }
      }
    })

    const completedAppointments = allAppointments.filter(a => a.status === 'COMPLETED')
    const paidAppointments = allAppointments.filter(a => a.order.paymentStatus === 'PAID')
    
    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.order.total, 0)
    const averageAppointmentValue = allAppointments.length > 0 
      ? allAppointments.reduce((sum, a) => sum + a.order.total, 0) / allAppointments.length 
      : 0
    const completionRate = allAppointments.length > 0 
      ? (completedAppointments.length / allAppointments.length) * 100 
      : 0

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    allAppointments.forEach(a => {
      statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1
    })

    // Chart data - group by date
    const chartDataMap = new Map<string, number>()
    allAppointments.forEach(a => {
      const dateKey = format(startOfDay(a.appointmentDate), 'yyyy-MM-dd')
      chartDataMap.set(dateKey, (chartDataMap.get(dateKey) || 0) + 1)
    })

    const chartData = Array.from(chartDataMap.entries())
      .map(([date, count]) => ({ date, appointments: count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Format appointments for response
    const formattedAppointments = appointments.map(a => ({
      id: a.id,
      orderId: a.orderId,
      orderNumber: a.order.orderNumber,
      status: a.status,
      appointmentDate: a.appointmentDate.toISOString(),
      startTime: a.startTime,
      endTime: a.endTime,
      duration: a.duration,
      total: a.order.total,
      customerName: a.order.customer.name,
      customerPhone: a.order.customer.phone,
      customerEmail: a.order.customer.email,
      staffName: a.staffId ? (staffMap.get(a.staffId) || null) : null,
      itemCount: a.order.items.length,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString()
    }))

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
        businessType: business.businessType
      },
      stats: {
        totalAppointments: allAppointments.length, // Use unfiltered count for stats
        totalRevenue,
        averageAppointmentValue,
        completionRate,
        statusBreakdown
      },
      chartData,
      appointments: formattedAppointments,
      pagination: {
        page,
        limit,
        total: totalAppointments,
        pages: Math.ceil(totalAppointments / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching business appointment stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch appointment stats' },
      { status: 500 }
    )
  }
}
