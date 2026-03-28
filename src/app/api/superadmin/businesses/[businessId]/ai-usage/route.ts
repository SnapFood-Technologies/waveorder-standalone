// AI Chat usage and analytics for SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mergeSessionsAndOrphansForPagination } from '@/lib/superadmin-ai-chat-history-pagination'

const msgSelect = {
  id: true,
  role: true,
  content: true,
  sessionId: true,
  feedback: true,
  tokensUsed: true,
  createdAt: true,
} as const

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
        aiChatPosition: true,
      },
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const sessionPage = Math.max(1, parseInt(searchParams.get('sessionPage') || '1', 10) || 1)
    const sessionsPerPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('sessionsPerPage') || '15', 10) || 15)
    )

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
      totalCount,
      tokenAgg,
      sessionGroupRows,
      orphanMeta,
      totalUserMessages,
      thumbsUpCount,
      thumbsDownCount,
      userMessagesForTopQuestions,
    ] = await Promise.all([
      prisma.aiChatMessage.count({ where: wherePeriod }),
      prisma.aiChatMessage.aggregate({
        where: { ...wherePeriod, role: 'assistant', tokensUsed: { not: null } },
        _sum: { tokensUsed: true },
      }),
      prisma.aiChatMessage.groupBy({
        by: ['sessionId'],
        where: { ...wherePeriod, sessionId: { not: null } },
        _max: { createdAt: true },
      }),
      prisma.aiChatMessage.findMany({
        where: { ...wherePeriod, sessionId: null },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aiChatMessage.count({ where: { ...wherePeriod, role: 'user' } }),
      prisma.aiChatMessage.count({ where: { ...wherePeriod, feedback: 'thumbs_up' } }),
      prisma.aiChatMessage.count({ where: { ...wherePeriod, feedback: 'thumbs_down' } }),
      prisma.aiChatMessage.findMany({
        where: { ...wherePeriod, role: 'user' },
        select: { content: true },
        take: 5000,
      }),
    ])

    const sessionRows = sessionGroupRows.map((s) => ({
      sessionId: s.sessionId!,
      lastAt: s._max.createdAt ?? new Date(0),
    }))

    const merged = mergeSessionsAndOrphansForPagination(sessionRows, orphanMeta)
    const totalConversations = merged.length
    const totalSessionPages = Math.max(1, Math.ceil(merged.length / sessionsPerPage) || 1)
    const safeSessionPage = Math.min(sessionPage, totalSessionPages)
    const startIdx = (safeSessionPage - 1) * sessionsPerPage
    const pageSlice = merged.slice(startIdx, startIdx + sessionsPerPage)

    const pageSessionIds = pageSlice
      .filter((x): x is { kind: 'session'; sessionId: string; lastAt: Date } => x.kind === 'session')
      .map((x) => x.sessionId)
    const pageOrphanIds = pageSlice
      .filter((x): x is { kind: 'orphan'; messageId: string; lastAt: Date } => x.kind === 'orphan')
      .map((x) => x.messageId)

    const [sessionMessages, orphanMessages] = await Promise.all([
      pageSessionIds.length > 0
        ? prisma.aiChatMessage.findMany({
            where: {
              businessId,
              createdAt: { gte: startDate, lte: endDate },
              sessionId: { in: pageSessionIds },
            },
            orderBy: { createdAt: 'asc' },
            select: msgSelect,
          })
        : Promise.resolve([]),
      pageOrphanIds.length > 0
        ? prisma.aiChatMessage.findMany({
            where: { id: { in: pageOrphanIds } },
            orderBy: { createdAt: 'asc' },
            select: msgSelect,
          })
        : Promise.resolve([]),
    ])

    const messages = [...sessionMessages, ...orphanMessages]

    const topQuestions = new Map<string, number>()
    for (const m of userMessagesForTopQuestions) {
      const q = m.content.trim().toLowerCase().slice(0, 100)
      topQuestions.set(q, (topQuestions.get(q) || 0) + 1)
    }
    const topQuestionsList = Array.from(topQuestions.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

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
          aiChatPosition: business.aiChatPosition || 'left',
        },
      },
      data: {
        messages,
        totalCount,
        period,
        sessionPagination: {
          page: safeSessionPage,
          perPage: sessionsPerPage,
          totalSessions: totalConversations,
          totalPages: totalSessionPages,
        },
        summary: {
          totalMessages: totalCount,
          totalUserMessages,
          totalConversations,
          topQuestions: topQuestionsList,
          thumbsUp,
          thumbsDown,
          totalTokensUsed,
        },
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching AI usage:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
