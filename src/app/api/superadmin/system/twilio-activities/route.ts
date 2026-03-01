// Twilio Activities - Twilio message logs in activity format
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const businessId = searchParams.get('businessId') || ''
    const status = searchParams.get('status') || '' // sent | error | all
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const where: any = {
      logType: { in: ['twilio_message_sent', 'twilio_message_error'] }
    }

    if (businessId) where.businessId = businessId
    if (status === 'sent') where.logType = 'twilio_message_sent'
    if (status === 'error') where.logType = 'twilio_message_error'
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: {
          business: {
            select: { id: true, name: true, slug: true, businessType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.systemLog.count({ where })
    ])

    const activities = logs.map((log) => {
      const meta = (log.metadata as { orderId?: string; orderNumber?: string; phone?: string; messageType?: string; serviceRequestId?: string }) || {}
      const messageType = meta.messageType || 'order_notification'
      return {
        id: log.id,
        logType: log.logType,
        status: log.logType === 'twilio_message_sent' ? 'sent' : 'error',
        orderNumber: meta.orderNumber || '-',
        orderId: meta.orderId || null,
        businessId: log.businessId,
        businessName: log.business?.name || '-',
        businessSlug: log.business?.slug || null,
        businessType: log.business?.businessType || null,
        messageType,
        template: messageType,
        phone: meta.phone || null,
        errorMessage: log.errorMessage || null,
        createdAt: log.createdAt.toISOString()
      }
    })

    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    })

    return NextResponse.json({
      activities,
      businesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching Twilio activities:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
