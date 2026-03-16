// WaveOrder Flows - Send manual reply to conversation
// Business plan only. Uses Twilio to send message.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { sendWhatsAppMessage } from '@/lib/twilio'

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

    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : null
    if (!message) {
      return NextResponse.json({ message: 'Message body is required' }, { status: 400 })
    }

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, businessId },
      include: { business: { select: { whatsappNumber: true, name: true } } }
    })
    const isFirstResponse = !conversation?.firstResponseAt

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
    }

    // Send via Twilio (use business's WhatsApp as "from" is platform - Twilio uses single number)
    // For now we use the platform Twilio number; business's customer receives reply to their thread
    const result = await sendWhatsAppMessage(conversation.customerPhone, message)

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Failed to send message. Check 24-hour window and Twilio config.' },
        { status: 502 }
      )
    }

    // Store outbound message
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'outbound',
        sender: 'business',
        messageType: 'text',
        body: message,
        twilioMessageId: result.messageId || undefined
      }
    })

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageBy: 'business',
        isRead: true,
        ...(isFirstResponse ? { firstResponseAt: new Date() } : {})
      }
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('[whatsapp-flows] reply POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
