// Get estimated recipient count for a segment
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { estimateCampaignCost } from '@/lib/whatsapp-campaign-sender'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const segment = body.segmentFilter && typeof body.segmentFilter === 'object' ? body.segmentFilter : {}

    const where: Record<string, unknown> = { businessId, optedOut: false }
    if (Array.isArray(segment.tags) && segment.tags.length) {
      where.tags = { hasSome: segment.tags }
    }
    if (typeof segment.lastOrderDays === 'number' && segment.lastOrderDays > 0) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - segment.lastOrderDays)
      where.lastOrderAt = { gte: cutoff }
    }

    const count = await prisma.whatsAppContact.count({ where })
    const optedOutCount = await prisma.whatsAppContact.count({
      where: { businessId, optedOut: true }
    })

    return NextResponse.json({
      count,
      optedOutCount,
      estimatedCost: estimateCampaignCost(count)
    })
  } catch (error) {
    console.error('[whatsapp-flows] segment-count:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
