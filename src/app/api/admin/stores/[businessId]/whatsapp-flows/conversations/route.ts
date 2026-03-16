// WaveOrder Flows - List conversations
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

async function requireFlowsAccess(businessId: string) {
  const access = await checkBusinessAccess(businessId)
  if (!access.authorized) {
    return { ok: false as const, response: NextResponse.json({ message: access.error }, { status: access.status }), session: null }
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionPlan: true }
  })
  if (!business || !['PRO', 'BUSINESS'].includes(business.subscriptionPlan)) {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Pro or Business plan' }, { status: 403 }), session: null }
  }
  return { ok: true as const, response: null, session: access.session }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response!

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status') || 'all'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const view = searchParams.get('view') || 'all' // all | mine | unassigned (supervisor view)

    const where: Record<string, unknown> = { businessId }
    if (status !== 'all') where.status = status
    if (unreadOnly) where.isRead = false
    if (view === 'mine' && access.session?.user?.id) where.assignedTo = access.session.user.id
    if (view === 'unassigned') where.assignedTo = null
    if (search.trim()) {
      const term = search.trim()
      where.OR = [
        { customerPhone: { contains: term } },
        { customerName: { contains: term } }
      ]
    }

    const [conversations, total, settings] = await Promise.all([
      prisma.whatsAppConversation.findMany({
        where,
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { body: true, messageType: true, sender: true, createdAt: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.whatsAppConversation.count({ where }),
      prisma.whatsAppSettings.findUnique({
        where: { businessId },
        select: { slaWarningMinutes: true }
      })
    ])

    const now = Date.now()
    const slaThreshold = settings?.slaWarningMinutes ?? 15
    const enriched = conversations.map((c) => {
      let slaWaitingMinutes: number | null = null
      if (c.lastMessageBy === 'customer') {
        slaWaitingMinutes = Math.floor((now - new Date(c.lastMessageAt).getTime()) / 60000)
      }
      return {
        ...c,
        slaWaitingMinutes,
        slaBreached: slaWaitingMinutes != null && slaWaitingMinutes >= slaThreshold
      }
    })

    return NextResponse.json({
      conversations: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      slaWarningMinutes: slaThreshold
    })
  } catch (error) {
    console.error('[whatsapp-flows] conversations GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
