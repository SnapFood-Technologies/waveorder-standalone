// WaveOrder Flows - Toggle flow active/inactive
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; flowId: string }> }
) {
  try {
    const { businessId, flowId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionPlan: true }
    })
    if (!business || !['PRO', 'BUSINESS'].includes(business.subscriptionPlan)) {
      return NextResponse.json({ message: 'WaveOrder Flows requires Pro or Business plan' }, { status: 403 })
    }

    const flow = await prisma.whatsAppFlow.findFirst({
      where: { id: flowId, businessId }
    })

    if (!flow) {
      return NextResponse.json({ message: 'Flow not found' }, { status: 404 })
    }

    const updated = await prisma.whatsAppFlow.update({
      where: { id: flowId },
      data: { isActive: !flow.isActive }
    })

    return NextResponse.json({ flow: updated })
  } catch (error) {
    console.error('[whatsapp-flows] flow toggle PATCH:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
