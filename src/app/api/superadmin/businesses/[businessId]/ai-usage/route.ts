// AI Chat usage and analytics for SuperAdmin
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
        aiAssistantEnabled: true,
        aiChatIcon: true,
        aiChatIconSize: true,
        aiChatName: true,
        aiChatPosition: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')

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

    const wherePeriod = { businessId, createdAt: { gte: startDate, lte: endDate } }

    const [
      messages,
      totalCount,
      tokenAgg,
      sessionGroups,
      totalUserMessages,
      thumbsUpCount,
      thumbsDownCount
    ] = await Promise.all([
      prisma.aiChatMessage.findMany({
        where: wherePeriod,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          role: true,
          content: true,
          sessionId: true,
          feedback: true,
          tokensUsed: true,
          createdAt: true
        }
      }),
      prisma.aiChatMessage.count({ where: wherePeriod }),
      prisma.aiChatMessage.aggregate({
        where: { ...wherePeriod, role: 'assistant', tokensUsed: { not: null } },
        _sum: { tokensUsed: true }
      }),
      // Distinct sessions in period (must not use only the paginated `messages` slice — that under-counted)
      prisma.aiChatMessage.groupBy({
        by: ['sessionId'],
        where: {
          businessId,
          createdAt: { gte: startDate, lte: endDate },
          sessionId: { not: null }
        }
      }),
      prisma.aiChatMessage.count({ where: { ...wherePeriod, role: 'user' } }),
      prisma.aiChatMessage.count({ where: { ...wherePeriod, feedback: 'thumbs_up' } }),
      prisma.aiChatMessage.count({ where: { ...wherePeriod, feedback: 'thumbs_down' } })
    ])

    const userMessages = messages.filter((m) => m.role === 'user')
    const topQuestions = new Map<string, number>()
    for (const m of userMessages) {
      const q = m.content.trim().toLowerCase().slice(0, 100)
      topQuestions.set(q, (topQuestions.get(q) || 0) + 1)
    }
    const topQuestionsList = Array.from(topQuestions.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const totalConversations = sessionGroups.length
    const thumbsUp = thumbsUpCount
    const thumbsDown = thumbsDownCount
    const totalTokensUsed = tokenAgg._sum.tokensUsed ?? 0

    return NextResponse.json({
      enabled: business.aiAssistantEnabled,
      business: {
        id: business.id,
        name: business.name,
        chatConfig: {
          aiChatIcon: business.aiChatIcon || 'message',
          aiChatIconSize: business.aiChatIconSize || 'medium',
          aiChatName: business.aiChatName || 'AI Assistant',
          aiChatPosition: business.aiChatPosition || 'left'
        }
      },
      data: {
        messages,
        totalCount,
        page,
        limit,
        period,
        summary: {
          totalMessages: totalCount,
          totalUserMessages,
          totalConversations,
          topQuestions: topQuestionsList,
          thumbsUp,
          thumbsDown,
          totalTokensUsed
        },
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Error fetching AI usage:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
