/**
 * WaveOrder Flows - Auto-create default welcome and away flows
 * Uses business storefrontLanguage for localized messages (en, sq, es, el).
 */

import { prisma } from '@/lib/prisma'
import { getDefaultFlowTranslations } from './whatsapp-default-flow-translations'
import type { FlowStep, FlowTrigger } from './whatsapp-flow-engine'

export async function ensureDefaultFlows(businessId: string): Promise<void> {
  const [business, settings, existingFlows] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, slug: true, storefrontLanguage: true, language: true }
    }),
    prisma.whatsAppSettings.findUnique({
      where: { businessId }
    }),
    prisma.whatsAppFlow.findMany({
      where: { businessId },
      select: { type: true }
    })
  ])

  if (!business || !settings) return

  const lang = business.storefrontLanguage || business.language || 'en'
  const t = getDefaultFlowTranslations(lang)

  const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'
  const storeUrl = `${baseUrl}/${business.slug}`

  const hasWelcome = existingFlows.some((f: { type: string }) => f.type === 'welcome')
  const hasAway = existingFlows.some((f: { type: string }) => f.type === 'away')

  if (settings.welcomeFlowEnabled && !hasWelcome) {
    const welcomeTrigger: FlowTrigger = {
      type: 'first_message',
      businessHoursOnly: true
    }
    const welcomeSteps: FlowStep[] = [
      {
        type: 'send_text',
        body: t.welcomeMessage(business.name)
      },
      {
        type: 'send_url',
        body: t.orderNow,
        url: storeUrl
      }
    ]
    await prisma.whatsAppFlow.create({
      data: {
        businessId,
        name: 'Welcome',
        type: 'welcome',
        isActive: true,
        priority: 100,
        trigger: welcomeTrigger as object,
        steps: welcomeSteps as object
      }
    })
  }

  if (settings.awayFlowEnabled && !hasAway && settings.businessHoursStart && settings.businessHoursEnd) {
    const tz = settings.businessHoursTimezone || t.localTime
    const awayBody = t.awayMessage(
      settings.businessHoursStart,
      settings.businessHoursEnd,
      tz
    )
    const awayTrigger: FlowTrigger = {
      type: 'any_message',
      outsideHoursOnly: true
    }
    const awaySteps: FlowStep[] = [
      {
        type: 'send_text',
        body: awayBody
      }
    ]
    await prisma.whatsAppFlow.create({
      data: {
        businessId,
        name: 'Away',
        type: 'away',
        isActive: true,
        priority: 90,
        trigger: awayTrigger as object,
        steps: awaySteps as object
      }
    })
  }
}
