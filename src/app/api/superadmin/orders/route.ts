// All orders across all businesses - SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const businessId = searchParams.get('businessId') || ''
    const period = searchParams.get('period') || 'last_30_days'

    // Date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Same conditions as operations/orders: exclude SALON and SERVICES (bookings/service requests have separate pages)
    const matchingBusinessIds = await prisma.business.findMany({
      where: {
        isActive: true,
        testMode: { not: true },
        businessType: { notIn: ['SALON', 'SERVICES'] }
      },
      select: { id: true }
    })
    const allowedBusinessIds = matchingBusinessIds.map((b) => b.id)

    const whereClause: any = {
      businessId: { in: allowedBusinessIds },
      createdAt: { gte: startDate }
    }

    if (businessId) {
      if (!allowedBusinessIds.includes(businessId)) {
        // Requested business is excluded (salon/services)
        return NextResponse.json({
          orders: [],
          businesses: [],
          pagination: { page: 1, limit, total: 0, pages: 0 }
        })
      }
      whereClause.businessId = businessId
    }
    if (status && status !== 'all') {
      whereClause.status = status
    }
    if (type && type !== 'all') {
      whereClause.type = type
    }
    if (search.trim()) {
      whereClause.OR = [
        { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
        { customerName: { contains: search.trim(), mode: 'insensitive' } },
        { customer: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { customer: { phone: { contains: search.trim() } } }
      ]
    }

    const [orders, total, businesses] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              currency: true,
              whatsappDirectNotifications: true
            }
          },
          items: {
            include: {
              product: { select: { id: true, name: true } },
              variant: { select: { id: true, name: true } }
            }
          },
          customer: {
            select: { id: true, name: true, phone: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where: whereClause }),
      prisma.business.findMany({
        where: {
          id: { in: allowedBusinessIds },
          isActive: true
        },
        select: { id: true, name: true, slug: true, currency: true }
      })
    ])

    const orderIds = orders.map((o) => o.id)
    const twilioLogs = await prisma.systemLog.findMany({
      where: {
        logType: { in: ['twilio_message_sent', 'twilio_message_error'] },
        createdAt: { gte: startDate }
      },
      select: {
        logType: true,
        errorMessage: true,
        metadata: true,
        businessId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const twilioStatusByOrder = new Map<string, { status: 'sent' | 'error'; error?: string }>()
    for (const log of twilioLogs) {
      const meta = log.metadata as { orderId?: string } | null
      const orderId = meta?.orderId
      if (!orderId || !orderIds.includes(orderId)) continue
      if (twilioStatusByOrder.has(orderId)) continue
      twilioStatusByOrder.set(orderId, {
        status: log.logType === 'twilio_message_sent' ? 'sent' : 'error',
        error: log.logType === 'twilio_message_error' ? (log.errorMessage || 'Failed to send') : undefined
      })
    }

    const formattedOrders = orders.map((order) => {
      const business = order.business
      const whatsappEnabled = business?.whatsappDirectNotifications ?? false
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        customerName: order.customerName || order.customer.name,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
        business: business
          ? {
              id: business.id,
              name: business.name,
              slug: business.slug,
              currency: business.currency
            }
          : null,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email
        },
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: { name: item.product.name },
          variant: item.variant ? { name: item.variant.name } : null
        })),
        twilioStatus: whatsappEnabled ? twilioStatusByOrder.get(order.id) ?? null : null
      }
    })

    return NextResponse.json({
      orders: formattedOrders,
      businesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching all orders:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
