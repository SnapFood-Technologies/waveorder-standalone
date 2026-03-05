// WaveOrder Flows - Get/Update settings
// Business plan only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { ensureDefaultFlows } from '@/lib/whatsapp-default-flows'

async function requireFlowsAccess(businessId: string): Promise<
  | { ok: true; business: { whatsappNumber: string } | null }
  | { ok: false; response: NextResponse }
> {
  const access = await checkBusinessAccess(businessId)
  if (!access.authorized) {
    return { ok: false, response: NextResponse.json({ message: access.error }, { status: access.status }) }
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionPlan: true, whatsappNumber: true }
  })
  if (!business || business.subscriptionPlan !== 'BUSINESS') {
    return { ok: false, response: NextResponse.json({ message: 'WaveOrder Flows requires Business plan' }, { status: 403 }) }
  }
  return { ok: true, business }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    let settings = await prisma.whatsAppSettings.findUnique({
      where: { businessId }
    })

    if (!settings) {
      settings = await prisma.whatsAppSettings.create({
        data: {
          businessId,
          phoneNumber: access.business?.whatsappNumber || null,
          isEnabled: false,
          welcomeFlowEnabled: true,
          awayFlowEnabled: true,
          businessHoursStart: '09:00',
          businessHoursEnd: '22:00',
          businessHoursTimezone: 'UTC',
          businessDays: [1, 2, 3, 4, 5],
          agentUserIds: []
        }
      })
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'
    const webhookUrl = `${baseUrl}/api/webhooks/twilio/incoming`

    return NextResponse.json({
      settings: {
        ...settings,
        webhookUrl
      }
    })
  } catch (error) {
    console.error('[whatsapp-flows] settings GET:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await requireFlowsAccess(businessId)
    if (!access.ok) return access.response

    const body = await request.json().catch(() => ({}))
    const {
      isEnabled,
      phoneNumber,
      welcomeFlowEnabled,
      awayFlowEnabled,
      businessHoursStart,
      businessHoursEnd,
      businessHoursTimezone,
      businessDays,
      aiEnabled,
      aiPersonality,
      aiPersonalityPrompt,
      aiConfidenceThreshold,
      aiDailyLimit,
      autoAssignEnabled,
      slaWarningMinutes,
      agentUserIds
    } = body

    const updateData: Record<string, unknown> = {}
    if (typeof isEnabled === 'boolean') updateData.isEnabled = isEnabled
    if (typeof phoneNumber === 'string' || phoneNumber === null) updateData.phoneNumber = phoneNumber?.trim() || null
    if (typeof welcomeFlowEnabled === 'boolean') updateData.welcomeFlowEnabled = welcomeFlowEnabled
    if (typeof awayFlowEnabled === 'boolean') updateData.awayFlowEnabled = awayFlowEnabled
    if (typeof businessHoursStart === 'string') updateData.businessHoursStart = businessHoursStart
    if (typeof businessHoursEnd === 'string') updateData.businessHoursEnd = businessHoursEnd
    if (typeof businessHoursTimezone === 'string') updateData.businessHoursTimezone = businessHoursTimezone
    if (Array.isArray(businessDays)) updateData.businessDays = businessDays.filter((d: unknown) => typeof d === 'number' && d >= 1 && d <= 7)
    if (typeof aiEnabled === 'boolean') updateData.aiEnabled = aiEnabled
    if (['formal', 'friendly', 'custom'].includes(aiPersonality)) updateData.aiPersonality = aiPersonality
    if (typeof aiPersonalityPrompt === 'string') updateData.aiPersonalityPrompt = aiPersonalityPrompt.trim() || null
    if (typeof aiConfidenceThreshold === 'number' && aiConfidenceThreshold >= 0 && aiConfidenceThreshold <= 1) updateData.aiConfidenceThreshold = aiConfidenceThreshold
    if (typeof aiDailyLimit === 'number' && aiDailyLimit >= 1 && aiDailyLimit <= 500) updateData.aiDailyLimit = aiDailyLimit
    if (typeof autoAssignEnabled === 'boolean') updateData.autoAssignEnabled = autoAssignEnabled
    if (typeof slaWarningMinutes === 'number' && slaWarningMinutes >= 1 && slaWarningMinutes <= 120) updateData.slaWarningMinutes = slaWarningMinutes
    if (Array.isArray(agentUserIds)) updateData.agentUserIds = agentUserIds.filter((id: unknown) => typeof id === 'string' && id.trim())

    const settings = await prisma.whatsAppSettings.upsert({
      where: { businessId },
      create: {
        businessId,
        ...(updateData as object),
        phoneNumber: (updateData.phoneNumber as string) ?? access.business?.whatsappNumber ?? null
      },
      update: updateData
    })

    if (settings.isEnabled) {
      try {
        await ensureDefaultFlows(businessId)
      } catch (err) {
        console.error('[whatsapp-flows] ensureDefaultFlows:', err)
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[whatsapp-flows] settings PUT:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
