// Trigger campaign send (for scheduled or draft campaigns)
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { runCampaignSend } from '@/lib/whatsapp-campaign-sender'
import { prisma } from '@/lib/prisma'

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
  { params }: { params: Promise<{ businessId: string; campaignId: string }> }
) {
  try {
    const { businessId, campaignId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const campaign = await prisma.whatsAppCampaign.findFirst({
      where: { id: campaignId, businessId }
    })
    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 }) }
    if (campaign.status === 'sending') {
      return NextResponse.json({ message: 'Campaign is already sending' }, { status: 400 })
    }
    if (campaign.status === 'sent') {
      return NextResponse.json({ message: 'Campaign already sent' }, { status: 400 })
    }

    runCampaignSend(campaignId).catch((err) => console.error('[campaign] send error:', err))

    return NextResponse.json({ message: 'Campaign send started' })
  } catch (error) {
    console.error('[whatsapp-flows] campaign send:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
