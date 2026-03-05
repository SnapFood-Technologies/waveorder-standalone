// WaveOrder Flows - Campaigns (Phase 7 Broadcast)
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { runCampaignSend, estimateCampaignCost } from '@/lib/whatsapp-campaign-sender'

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
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const campaigns = await prisma.whatsAppCampaign.findMany({
      where: { businessId },
      include: { template: { select: { name: true, bodyPreview: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('[whatsapp-flows] campaigns GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
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
    const { name, templateId, segmentFilter, variableValues, sendNow } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Campaign name is required' }, { status: 400 })
    }
    if (!templateId) {
      return NextResponse.json({ message: 'Template is required' }, { status: 400 })
    }

    const template = await prisma.whatsAppTemplate.findFirst({
      where: { id: templateId, businessId }
    })
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 })
    }

    const segment = segmentFilter && typeof segmentFilter === 'object' ? segmentFilter : {}
    const where: Record<string, unknown> = { businessId, optedOut: false }
    if (Array.isArray(segment.tags) && segment.tags.length) {
      where.tags = { hasSome: segment.tags }
    }
    if (typeof segment.lastOrderDays === 'number' && segment.lastOrderDays > 0) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - segment.lastOrderDays)
      where.lastOrderAt = { gte: cutoff }
    }

    const totalRecipients = await prisma.whatsAppContact.count({ where })
    const estimatedCost = estimateCampaignCost(totalRecipients)

    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        businessId,
        name: name.trim(),
        templateId,
        segmentFilter: segment,
        variableValues: (variableValues && typeof variableValues === 'object') ? variableValues : {},
        status: sendNow ? 'scheduled' : 'draft',
        scheduledAt: sendNow ? new Date() : null,
        totalRecipients: 0,
        estimatedCost
      },
      include: { template: { select: { name: true } } }
    })

    if (sendNow && totalRecipients > 0) {
      runCampaignSend(campaign.id).catch((err) => console.error('[campaign] send error:', err))
    }

    return NextResponse.json({ campaign, totalRecipients, estimatedCost })
  } catch (error) {
    console.error('[whatsapp-flows] campaigns POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
