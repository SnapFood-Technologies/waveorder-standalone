// Twilio Activities - Twilio & WaveOrder Flows message logs in activity format
import { NextRequest, NextResponse } from 'next/server'

function mapLogTypeToMessageType(logType: string): string {
  switch (logType) {
    case 'whatsapp_flow_message_in': return 'flows_inbound'
    case 'whatsapp_flow_message_out': return 'flows_reply'
    case 'whatsapp_flow_error': return 'flows_error'
    case 'whatsapp_broadcast_sent': return 'broadcast'
    case 'whatsapp_broadcast_error': return 'broadcast_error'
    case 'whatsapp_ai_reply': return 'ai_reply'
    case 'whatsapp_ai_error': return 'ai_error'
    default: return 'order_notification'
  }
}
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

    const whatsappFlowTypes = [
      'twilio_message_sent',
      'twilio_message_error',
      'whatsapp_flow_message_in',
      'whatsapp_flow_message_out',
      'whatsapp_flow_error',
      'whatsapp_broadcast_sent',
      'whatsapp_broadcast_error',
      'whatsapp_ai_reply',
      'whatsapp_ai_error'
    ]

    const where: any = {
      logType: { in: whatsappFlowTypes }
    }

    if (businessId) where.businessId = businessId
    if (status === 'sent') {
      where.logType = {
        in: ['twilio_message_sent', 'whatsapp_flow_message_out', 'whatsapp_broadcast_sent', 'whatsapp_ai_reply', 'whatsapp_flow_message_in']
      }
    }
    if (status === 'error') {
      where.logType = {
        in: ['twilio_message_error', 'whatsapp_flow_error', 'whatsapp_broadcast_error', 'whatsapp_ai_error']
      }
    }
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

    const sentTypes = new Set(['twilio_message_sent', 'whatsapp_flow_message_in', 'whatsapp_flow_message_out', 'whatsapp_broadcast_sent', 'whatsapp_ai_reply'])

    const activities = logs.map((log) => {
      const meta = (log.metadata as { orderId?: string; orderNumber?: string; phone?: string; messageType?: string; serviceRequestId?: string; customerPhone?: string; flowId?: string; campaignId?: string; campaignName?: string; delivered?: number; failed?: number }) || {}
      let messageType = meta.messageType || mapLogTypeToMessageType(log.logType)
      const businessType = log.business?.businessType || null

      // Infer template from businessType for historical logs
      if (messageType === 'order_notification' && (businessType === 'SALON' || businessType === 'SERVICES')) {
        messageType = 'appointment_notification'
      }

      return {
        id: log.id,
        logType: log.logType,
        status: sentTypes.has(log.logType) ? 'sent' : 'error',
        orderNumber: meta.orderNumber || '-',
        orderId: meta.orderId || null,
        businessId: log.businessId,
        businessName: log.business?.name || '-',
        businessSlug: log.business?.slug || null,
        businessType,
        messageType,
        template: messageType,
        phone: meta.phone || meta.customerPhone || null,
        errorMessage: log.errorMessage || null,
        createdAt: log.createdAt.toISOString(),
        flowsMeta: log.logType.startsWith('whatsapp_') ? meta : undefined
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
