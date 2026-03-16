// WaveOrder Flows - Canned response DELETE (Phase 8)
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
  if (!business || !['PRO', 'BUSINESS'].includes(business.subscriptionPlan)) {
    return { ok: false as const, response: NextResponse.json({ message: 'WaveOrder Flows requires Pro or Business plan' }, { status: 403 }) }
  }
  return { ok: true as const }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; responseId: string }> }
) {
  try {
    const { businessId, responseId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    await prisma.whatsAppCannedResponse.deleteMany({
      where: { id: responseId, businessId }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[whatsapp-flows] canned-response DELETE:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
