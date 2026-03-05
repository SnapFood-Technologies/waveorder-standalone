// WaveOrder Flows - List conversations
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

async function requireFlowsAccess(businessId: string) {
  const access = await checkBusinessAccess(businessId)
  if (!access.authorized) {
    return { ok: false as const, response: NextResponse.json({ message: access.error }, { status: access.status }) }
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionPlan: true }
  })
  if (!business || business.subscriptionPlan !== 'BUSINESS') {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Business plan' }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status') || 'all' // all | open | assigned | waiting | resolved | closed
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: Record<string, unknown> = { businessId }
    if (status !== 'all') where.status = status
    if (unreadOnly) where.isRead = false
    if (search.trim()) {
      const term = search.trim()
      where.OR = [
        { customerPhone: { contains: term } },
        { customerName: { contains: term } }
      ]
    }

    const [conversations, total] = await Promise.all([
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
      prisma.whatsAppConversation.count({ where })
    ])

    return NextResponse.json({
      conversations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('[whatsapp-flows] conversations GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
