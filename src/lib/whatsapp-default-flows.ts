/**
 * WaveOrder Flows - Auto-create default welcome and away flows
 */

import { prisma } from '@/lib/prisma'
import type { FlowStep, FlowTrigger } from './whatsapp-flow-engine'

export async function ensureDefaultFlows(businessId: string): Promise<void> {
  const [business, settings, existingFlows] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, slug: true }
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

  const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'
  const storeUrl = `${baseUrl}/${business.slug}`

  const hasWelcome = existingFlows.some((f) => f.type === 'welcome')
  const hasAway = existingFlows.some((f) => f.type === 'away')

  if (settings.welcomeFlowEnabled && !hasWelcome) {
    const welcomeTrigger: FlowTrigger = {
      type: 'first_message',
      businessHoursOnly: true
    }
    const welcomeSteps: FlowStep[] = [
      {
        type: 'send_text',
        body: `👋 Welcome to ${business.name}!\n\nBrowse our catalog and place your order easily.`
      },
      {
        type: 'send_url',
        body: 'Order now:',
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
    const hoursText = `We're currently closed. Our hours are ${settings.businessHoursStart}–${settings.businessHoursEnd} (${settings.businessHoursTimezone || 'local time'}). We'll reply as soon as we're back!`
    const awayTrigger: FlowTrigger = {
      type: 'any_message',
      outsideHoursOnly: true
    }
    const awaySteps: FlowStep[] = [
      {
        type: 'send_text',
        body: `Hi! Thanks for your message. ${hoursText}`
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
