// WaveOrder Flows - Get conversation with messages
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
  { params }: { params: Promise<{ businessId: string; conversationId: string }> }
) {
  try {
    const { businessId, conversationId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, businessId },
      include: {
        assignedToUser: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { createdAt: 'asc' }, select: { id: true, body: true, authorId: true, createdAt: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('[whatsapp-flows] conversation GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; conversationId: string }> }
) {
  try {
    const { businessId, conversationId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const { isRead, status: newStatus, assignedTo, priority } = body

    const updateData: Record<string, unknown> = {}
    if (typeof isRead === 'boolean') updateData.isRead = isRead
    const validStatuses = ['open', 'assigned', 'waiting', 'resolved', 'closed']
    if (validStatuses.includes(newStatus)) updateData.status = newStatus
    if (assignedTo === null || (typeof assignedTo === 'string' && assignedTo.trim())) {
      updateData.assignedTo = assignedTo === null || assignedTo === '' ? null : assignedTo.trim()
    }
    if (['low', 'normal', 'high', 'urgent'].includes(priority)) updateData.priority = priority
    if (newStatus === 'resolved') (updateData as Record<string, unknown>).resolvedAt = new Date()

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid updates' }, { status: 400 })
    }

    const conversation = await prisma.whatsAppConversation.updateMany({
      where: { id: conversationId, businessId },
      data: updateData
    })

    if (conversation.count === 0) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[whatsapp-flows] conversation PATCH:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
