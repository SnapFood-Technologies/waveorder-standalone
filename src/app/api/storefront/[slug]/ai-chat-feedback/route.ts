// AI Chat feedback - thumbs up/down on assistant responses
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const body = await request.json()
    const { messageId, feedback } = body as { messageId?: string; feedback?: string }

    if (!messageId || !feedback || !['thumbs_up', 'thumbs_down'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid messageId or feedback' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { slug, isActive: true, setupWizardCompleted: true },
      select: { id: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const updated = await prisma.aiChatMessage.updateMany({
      where: {
        id: messageId,
        businessId: business.id,
        role: 'assistant'
      },
      data: { feedback }
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI chat feedback error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
