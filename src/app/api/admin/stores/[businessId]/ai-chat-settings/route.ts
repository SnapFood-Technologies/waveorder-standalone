// AI Chat customization settings - icon, size, name, position
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const aiChatSettingsSchema = z.object({
  aiChatIcon: z.enum(['message', 'help', 'robot']).optional(),
  aiChatIconSize: z.enum(['xs', 'sm', 'medium', 'lg', 'xl']).optional(),
  aiChatName: z.string().min(1).max(50).optional(),
  aiChatPosition: z.enum(['left', 'right']).optional()
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        aiAssistantEnabled: true,
        aiChatIcon: true,
        aiChatIconSize: true,
        aiChatName: true,
        aiChatPosition: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      aiAssistantEnabled: business.aiAssistantEnabled,
      aiChatIcon: business.aiChatIcon || 'message',
      aiChatIconSize: business.aiChatIconSize || 'medium',
      aiChatName: business.aiChatName || 'AI Assistant',
      aiChatPosition: business.aiChatPosition || 'left'
    })
  } catch (error) {
    console.error('Error fetching AI chat settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    if (!access.isImpersonating) {
      const businessUser = await prisma.businessUser.findFirst({
        where: {
          userId: access.session!.user.id,
          businessId,
          role: { in: ['OWNER', 'MANAGER'] }
        }
      })
      if (!businessUser) {
        return NextResponse.json(
          { error: 'Insufficient permissions - requires OWNER or MANAGER role' },
          { status: 403 }
        )
      }
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { aiAssistantEnabled: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.aiAssistantEnabled) {
      return NextResponse.json(
        { error: 'AI Assistant must be enabled before customizing. Enable it in Custom Features.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = aiChatSettingsSchema.parse(body)

    const updateData: Record<string, string> = {}
    if (validated.aiChatIcon !== undefined) updateData.aiChatIcon = validated.aiChatIcon
    if (validated.aiChatIconSize !== undefined) updateData.aiChatIconSize = validated.aiChatIconSize
    if (validated.aiChatName !== undefined) updateData.aiChatName = validated.aiChatName
    if (validated.aiChatPosition !== undefined) updateData.aiChatPosition = validated.aiChatPosition

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        aiChatIcon: true,
        aiChatIconSize: true,
        aiChatName: true,
        aiChatPosition: true
      }
    })

    return NextResponse.json({
      aiChatIcon: updated.aiChatIcon || 'message',
      aiChatIconSize: updated.aiChatIconSize || 'medium',
      aiChatName: updated.aiChatName || 'AI Assistant',
      aiChatPosition: updated.aiChatPosition || 'left'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map(e => e.message).join(', ') },
        { status: 400 }
      )
    }
    console.error('Error updating AI chat settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
