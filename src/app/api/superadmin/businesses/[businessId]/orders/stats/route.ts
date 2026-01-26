// src/app/api/superadmin/businesses/[businessId]/orders/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { format, startOfDay, startOfWeek, startOfMonth, parseISO } from 'date-fns'

const prisma = new PrismaClient()

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
    const type = searchParams.get('type') || ''
    const period = searchParams.get('period') || 'last_30_days'

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, currency: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
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
        grouping = 'month'
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        grouping = 'day'
    }

    // Build where clause for orders
    const whereClause: any = {
      businessId: businessId,
      createdAt: { gte: startDate }
    }

    if (status && status !== 'all') {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']
      if (validStatuses.includes(status)) {
        whereClause.status = status
      }
    }

    if (type && type !== 'all') {
      const validTypes = ['DELIVERY', 'PICKUP', 'DINE_IN']
      if (validTypes.includes(type)) {
        whereClause.type = type
      }
    }

    if (search.trim()) {
      whereClause.OR = [
        { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
        { customerName: { contains: search.trim(), mode: 'insensitive' } },
        { customer: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { customer: { phone: { contains: search.trim() } } }
      ]
    }

    // Get all orders for the business
    const allOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary statistics
    const totalOrders = allOrders.length
    
    // Revenue calculation: Paid orders that are completed/fulfilled
    // - DELIVERY orders: DELIVERED + PAID (final status)
    // - PICKUP orders: PICKED_UP + PAID (final status - only when actually picked up)
    // - DINE_IN orders: PICKED_UP + PAID (final status - only when actually picked up)
    // Excludes CANCELLED and REFUNDED orders
    const revenueOrders = allOrders.filter(order => {
      if (order.paymentStatus !== 'PAID') return false
      if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return false
      
      // Order-type specific revenue calculation
      if (order.type === 'DELIVERY') {
        return order.status === 'DELIVERED'
      } else if (order.type === 'PICKUP') {
        return order.status === 'PICKED_UP'
      } else if (order.type === 'DINE_IN') {
        return order.status === 'PICKED_UP'
      }
      
      return false
    })
    
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0
    
    // Status breakdown
    const statusBreakdown = allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Completion rate (DELIVERED + PICKED_UP)
    const completedOrders = allOrders.filter(order => 
      order.status === 'DELIVERED' || order.status === 'PICKED_UP'
    ).length
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    // Chart data - group orders by time period
    const chartDataMap = new Map<string, number>()
    
    allOrders.forEach(order => {
      const orderDate = parseISO(order.createdAt.toISOString())
      let groupKey: string

      switch (grouping) {
        case 'week':
          const weekStart = startOfWeek(orderDate, { weekStartsOn: 1 })
          groupKey = format(weekStart, 'yyyy-MM-dd')
          break
        case 'month':
          const monthStart = startOfMonth(orderDate)
          groupKey = format(monthStart, 'yyyy-MM-dd')
          break
        case 'day':
        default:
          const dayStart = startOfDay(orderDate)
          groupKey = format(dayStart, 'yyyy-MM-dd')
          break
      }

      chartDataMap.set(groupKey, (chartDataMap.get(groupKey) || 0) + 1)
    })

    const chartData = Array.from(chartDataMap.entries())
      .map(([date, count]) => ({ date, orders: count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get customer order counts for first order detection
    const customerIds = [...new Set(allOrders.map(order => order.customer.id))]
    const customerOrderCounts = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        businessId: businessId,
        customerId: { in: customerIds }
      },
      _count: {
        id: true
      }
    })

    const orderCountMap = customerOrderCounts.reduce((acc, item) => {
      acc[item.customerId] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Paginate orders for list
    const skip = (page - 1) * limit
    const paginatedOrders = allOrders.slice(skip, skip + limit)

    // Format orders for response
    const formattedOrders = paginatedOrders.map(order => {
      const customerOrderCount = orderCountMap[order.customer.id] || 1
      const isFirstOrder = customerOrderCount === 1

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        createdByAdmin: order.createdByAdmin,
        customerName: order.customerName || order.customer.name,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email,
          isFirstOrder
        },
        itemCount: order.items.length,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: {
            name: item.product.name
          },
          variant: item.variant ? {
            name: item.variant.name
          } : null
        }))
      }
    })

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency
      },
      stats: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        completionRate,
        statusBreakdown
      },
      chartData,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: allOrders.length,
        pages: Math.ceil(allOrders.length / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching business order stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
