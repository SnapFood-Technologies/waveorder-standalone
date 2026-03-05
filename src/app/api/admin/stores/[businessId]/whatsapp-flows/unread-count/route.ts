// WaveOrder Flows - Unread conversation count (for sidebar badge)
// Business plan only

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

    const count = await prisma.whatsAppConversation.count({
      where: { businessId, isRead: false }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[whatsapp-flows] unread-count GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
