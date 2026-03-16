// WaveOrder Flows - Internal notes on conversations (Phase 8)
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
  { params }: { params: Promise<{ businessId: string; conversationId: string }> }
) {
  try {
    const { businessId, conversationId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response!

    const conv = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, businessId },
      select: { id: true }
    })
    if (!conv) return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })

    const notes = await prisma.whatsAppNote.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json({ notes })
  } catch (error) {
    console.error('[whatsapp-flows] notes GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; conversationId: string }> }
) {
  try {
    const { businessId, conversationId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response!
    if (!access.session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const conv = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, businessId },
      select: { id: true }
    })
    if (!conv) return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const { body: noteBody } = body
    if (!noteBody || typeof noteBody !== 'string' || !noteBody.trim()) {
      return NextResponse.json({ message: 'Note body is required' }, { status: 400 })
    }

    const note = await prisma.whatsAppNote.create({
      data: {
        conversationId,
        authorId: access.session.user.id,
        body: noteBody.trim(),
        isInternal: true
      }
    })
    return NextResponse.json({ note })
  } catch (error) {
    console.error('[whatsapp-flows] notes POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
