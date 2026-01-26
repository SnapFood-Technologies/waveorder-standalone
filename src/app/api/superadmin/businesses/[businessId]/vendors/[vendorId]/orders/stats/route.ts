// app/api/superadmin/businesses/[businessId]/vendors/[vendorId]/orders/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { format, startOfDay, startOfWeek, startOfMonth, parseISO } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; vendorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, vendorId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const period = searchParams.get('period') || 'last_30_days'

    // Verify originator business exists
    const originatorBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, currency: true, connectedBusinesses: true }
    })

    if (!originatorBusiness) {
      return NextResponse.json({ message: 'Originator business not found' }, { status: 404 })
    }

    // Verify vendor is connected
    if (!originatorBusiness.connectedBusinesses.includes(vendorId)) {
      return NextResponse.json({ message: 'Vendor is not connected to this business' }, { status: 404 })
    }

    // Get vendor business info
    const vendorBusiness = await prisma.business.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, currency: true }
    })

    if (!vendorBusiness) {
      return NextResponse.json({ message: 'Vendor business not found' }, { status: 404 })
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

    // Get all orders for the originator business that contain products from the vendor
    // We need to fetch orders and filter by checking if any item's product belongs to vendor
    const allOrders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: { gte: startDate },
        ...(status && status !== 'all' ? { status } : {}),
        ...(type && type !== 'all' ? { type } : {}),
        ...(search.trim() ? {
          OR: [
            { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
            { customerName: { contains: search.trim(), mode: 'insensitive' } },
            { customer: { name: { contains: search.trim(), mode: 'insensitive' } } },
            { customer: { phone: { contains: search.trim() } } }
          ]
        } : {})
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                businessId: true,
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

    // Filter orders that contain at least one product from the vendor
    const vendorOrders = allOrders.filter(order => 
      order.items.some(item => item.product.businessId === vendorId)
    )

    // Calculate summary statistics
    const totalOrders = vendorOrders.length
    const totalRevenue = vendorOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Status breakdown
    const statusBreakdown = vendorOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Completion rate (DELIVERED + PICKED_UP)
    const completedOrders = vendorOrders.filter(order => 
      order.status === 'DELIVERED' || order.status === 'PICKED_UP'
    ).length
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    // Chart data - group orders by time period
    const chartDataMap = new Map<string, number>()
    
    vendorOrders.forEach(order => {
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

    // Paginate orders for list
    const skip = (page - 1) * limit
    const paginatedOrders = vendorOrders.slice(skip, skip + limit)

    // Format orders for response
    const formattedOrders = paginatedOrders.map(order => ({
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
        email: order.customer.email
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
    }))

    return NextResponse.json({
      vendor: {
        id: vendorBusiness.id,
        name: vendorBusiness.name,
        currency: vendorBusiness.currency
      },
      originator: {
        id: originatorBusiness.id,
        name: originatorBusiness.name,
        currency: originatorBusiness.currency
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
        total: vendorOrders.length,
        pages: Math.ceil(vendorOrders.length / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching vendor order stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
