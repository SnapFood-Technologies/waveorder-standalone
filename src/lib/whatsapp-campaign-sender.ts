/**
 * WaveOrder Flows - Campaign sender (Phase 7)
 * Sends broadcast messages via Twilio WhatsApp templates with rate limiting
 */

import { prisma } from '@/lib/prisma'
import { sendWhatsAppTemplateMessage } from '@/lib/twilio'

const MESSAGES_PER_SECOND = 5
const COST_PER_MESSAGE = 0.05 // Approximate Twilio WhatsApp cost

function interpolateVariables(
  values: Record<string, string>,
  contact: { name: string | null; phone: string }
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(values)) {
    let s = String(val)
    s = s.replace(/\{\{contact\.name\}\}/g, contact.name || 'Customer')
    s = s.replace(/\{\{contact\.phone\}\}/g, contact.phone)
    result[key] = s
  }
  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function runCampaignSend(campaignId: string): Promise<{ success: boolean; delivered: number; failed: number }> {
  const campaign = await prisma.whatsAppCampaign.findUnique({
    where: { id: campaignId },
    include: { template: true, business: { select: { name: true } } }
  })

  if (!campaign || campaign.status !== 'scheduled' && campaign.status !== 'draft') {
    return { success: false, delivered: 0, failed: 0 }
  }

  await prisma.whatsAppCampaign.update({
    where: { id: campaignId },
    data: { status: 'sending' }
  })

  const segment = campaign.segmentFilter as { tags?: string[]; lastOrderDays?: number } | null
  const where: Record<string, unknown> = {
    businessId: campaign.businessId,
    optedOut: false
  }
  if (segment?.tags?.length) {
    where.tags = { hasSome: segment.tags }
  }
  if (segment?.lastOrderDays != null && segment.lastOrderDays > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - segment.lastOrderDays)
    where.lastOrderAt = { gte: cutoff }
  }

  const contacts = await prisma.whatsAppContact.findMany({
    where,
    select: { id: true, phone: true, name: true }
  })

  const variableValues = (campaign.variableValues as Record<string, string>) || {}

  let delivered = 0
  let failed = 0

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]!
    const vars = interpolateVariables(
      { ...variableValues, '1': variableValues['1'] ?? contact.name ?? 'Customer' },
      contact
    )

    const result = await sendWhatsAppTemplateMessage(
      contact.phone,
      campaign.template.contentSid,
      vars
    )

    if (result.success) {
      delivered++
    } else {
      failed++
    }

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        delivered: { increment: result.success ? 1 : 0 },
        failed: { increment: result.success ? 0 : 1 }
      }
    })

    if (i < contacts.length - 1) {
      await sleep(1000 / MESSAGES_PER_SECOND)
    }
  }

  await prisma.whatsAppCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      totalRecipients: contacts.length
    }
  })

  return { success: true, delivered, failed }
}

export function estimateCampaignCost(recipientCount: number): number {
  return recipientCount * COST_PER_MESSAGE
}
