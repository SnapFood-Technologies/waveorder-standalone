// src/app/api/admin/stores/[businessId]/ai-chat/route.ts
// AI Chat history and analytics for admin
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, aiAssistantEnabled: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (!business.aiAssistantEnabled) {
      return NextResponse.json({
        enabled: false,
        message: 'AI Store Assistant is not enabled for this business.',
        data: null
      })
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

    const [messages, totalCount, tokenAgg] = await Promise.all([
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
      })
    ])

    // Group by session for conversation view
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

    const totalConversations = new Set(messages.map((m) => m.sessionId).filter(Boolean)).size
    const thumbsUp = messages.filter((m) => m.feedback === 'thumbs_up').length
    const thumbsDown = messages.filter((m) => m.feedback === 'thumbs_down').length
    const totalTokensUsed = tokenAgg._sum.tokensUsed ?? 0

    return NextResponse.json({
      enabled: true,
      data: {
        messages,
        totalCount,
        page,
        limit,
        period,
        summary: {
          totalMessages: totalCount,
          totalUserMessages: userMessages.length,
          totalConversations: totalConversations || Math.ceil(userMessages.length / 2),
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
    console.error('Error fetching AI chat analytics:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
