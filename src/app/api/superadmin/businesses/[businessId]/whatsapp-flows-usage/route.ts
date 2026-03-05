// WaveOrder Flows usage for SuperAdmin - per-business metrics
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        whatsappSettings: { select: { isEnabled: true, phoneNumber: true } }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    let startDate: Date
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const now = new Date()

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all':
      default:
        startDate = new Date(0)
        break
    }

    const dateFilter = { gte: startDate, lte: endDate }

    const [
      conversationCount,
      messageStats,
      flowStats,
      campaignStats,
      aiUsageStats,
      unreadCount,
      flowLogsInPeriod,
      aiLogsInPeriod
    ] = await Promise.all([
      prisma.whatsAppConversation.count({
        where: {
          businessId,
          lastMessageAt: dateFilter
        }
      }),
      prisma.whatsAppMessage.groupBy({
        by: ['direction', 'sender'],
        where: {
          conversation: { businessId },
          createdAt: dateFilter
        },
        _count: true
      }),
      prisma.whatsAppFlow.aggregate({
        where: { businessId },
        _sum: { triggerCount: true }
      }),
      prisma.whatsAppCampaign.aggregate({
        where: {
          businessId,
          sentAt: dateFilter
        },
        _sum: {
          totalRecipients: true,
          delivered: true,
          read: true,
          replied: true,
          failed: true
        },
        _count: true
      }),
      prisma.whatsAppAiUsage.aggregate({
        where: {
          businessId,
          dateStr: {
            gte: startDate.toISOString().slice(0, 10),
            lte: endDate.toISOString().slice(0, 10)
          }
        },
        _sum: { replyCount: true }
      }),
      prisma.whatsAppConversation.count({
        where: { businessId, isRead: false }
      }),
      prisma.systemLog.count({
        where: {
          businessId,
          logType: 'whatsapp_flow_message_out',
          createdAt: dateFilter
        }
      }),
      prisma.systemLog.count({
        where: {
          businessId,
          logType: 'whatsapp_ai_reply',
          createdAt: dateFilter
        }
      })
    ])

    const inboundCount = messageStats
      .filter((s) => s.direction === 'inbound')
      .reduce((sum, s) => sum + s._count, 0)
    const outboundCount = messageStats
      .filter((s) => s.direction === 'outbound')
      .reduce((sum, s) => sum + s._count, 0)
    const flowReplies = messageStats
      .filter((s) => s.sender === 'flow')
      .reduce((sum, s) => sum + s._count, 0)
    const aiReplies = messageStats
      .filter((s) => s.sender === 'ai')
      .reduce((sum, s) => sum + s._count, 0)

    const totalConversationsAllTime = await prisma.whatsAppConversation.count({
      where: { businessId }
    })

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        subscriptionPlan: business.subscriptionPlan,
        flowsEnabled: business.whatsappSettings?.isEnabled ?? false,
        phoneNumber: business.whatsappSettings?.phoneNumber ?? null
      },
      period,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        conversationsInPeriod: conversationCount,
        totalConversationsAllTime: totalConversationsAllTime,
        messagesInbound: inboundCount,
        messagesOutbound: outboundCount,
        flowReplies,
        aiReplies,
        flowTriggersTotal: flowStats._sum.triggerCount ?? 0,
        flowRepliesInPeriod: flowLogsInPeriod,
        aiRepliesInPeriod: aiLogsInPeriod,
        campaignsSent: campaignStats._count,
        broadcastsDelivered: campaignStats._sum.delivered ?? 0,
        broadcastsFailed: campaignStats._sum.failed ?? 0,
        aiRepliesFromUsage: aiUsageStats._sum.replyCount ?? 0,
        unreadConversations: unreadCount
      }
    })
  } catch (error) {
    console.error('[superadmin] whatsapp-flows-usage:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
