// WaveOrder Flows - Manual auto-assign (Phase 8)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { roundRobinAssign } from '@/lib/whatsapp-auto-assign'

async function requireFlowsAccess(businessId: string) {
  const access = await checkBusinessAccess(businessId)
  if (!access.authorized) {
    return { ok: false as const, response: NextResponse.json({ message: access.error }, { status: access.status }) }
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionPlan: true }
  })
  if (!business || !['PRO', 'BUSINESS'].includes(business.subscriptionPlan)) {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Pro or Business plan' }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; conversationId: string }> }
) {
  try {
    const { businessId, conversationId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const assignTo = await roundRobinAssign(businessId)
    if (!assignTo) {
      return NextResponse.json({ message: 'No team members to assign' }, { status: 400 })
    }

    await prisma.whatsAppConversation.updateMany({
      where: { id: conversationId, businessId },
      data: { assignedTo: assignTo, status: 'assigned' }
    })

    const updated = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, businessId },
      include: { assignedToUser: { select: { id: true, name: true, email: true } } }
    })
    return NextResponse.json({ assignedTo: assignTo, conversation: updated })
  } catch (error) {
    console.error('[whatsapp-flows] auto-assign:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
