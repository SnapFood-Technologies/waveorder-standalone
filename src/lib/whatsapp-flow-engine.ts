/**
 * WaveOrder Flows - Flow engine
 * Matches triggers and executes steps (send_text, send_image, send_url, notify_team)
 */

import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, sendWhatsAppMessageWithMedia } from '@/lib/twilio'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Step types from PRD
export type StepType = 'send_text' | 'send_image' | 'send_url' | 'send_buttons' | 'send_location' | 'notify_team'

export interface FlowStep {
  type: StepType
  body?: string
  mediaUrl?: string
  caption?: string
  url?: string
  buttons?: Array<{ id: string; label: string }>
  delayMs?: number
  message?: string
  email?: string
  latitude?: number
  longitude?: number
  name?: string
  address?: string
}

export interface FlowTrigger {
  type: 'first_message' | 'keyword' | 'button_click' | 'any_message'
  keywords?: string[]
  buttonPayload?: string
  businessHoursOnly?: boolean
  outsideHoursOnly?: boolean
}

export interface FlowContext {
  businessId: string
  conversationId: string
  customerPhone: string
  customerName?: string | null
  isFirstMessage: boolean
  messageBody?: string | null
  buttonPayload?: string | null
  settings: {
    businessHoursStart: string | null
    businessHoursEnd: string | null
    businessHoursTimezone: string | null
    businessDays: number[]
    welcomeFlowEnabled?: boolean
    awayFlowEnabled?: boolean
  }
}

/**
 * Check if current time is within business hours (in business timezone)
 */
export function isWithinBusinessHours(settings: {
  businessHoursStart: string | null
  businessHoursEnd: string | null
  businessHoursTimezone: string | null
  businessDays: number[]
}): boolean {
  if (!settings.businessHoursStart || !settings.businessHoursEnd) return true

  const tz = settings.businessHoursTimezone || 'UTC'
  const now = new Date()

  const dayPart = new Intl.DateTimeFormat('en-CA', { timeZone: tz, weekday: 'short' }).format(now)
  const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  const currentDay = dayMap[dayPart] ?? 1
  if (!settings.businessDays?.includes(currentDay)) return false

  const currentTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now)
  return currentTime >= settings.businessHoursStart && currentTime <= settings.businessHoursEnd
}

/**
 * Check if a flow trigger matches the current context
 */
function triggerMatches(trigger: FlowTrigger, context: FlowContext): boolean {
  if (trigger.type === 'first_message' && context.isFirstMessage) {
    if (trigger.outsideHoursOnly) {
      return !isWithinBusinessHours(context.settings)
    }
    if (trigger.businessHoursOnly) {
      return isWithinBusinessHours(context.settings)
    }
    return true
  }

  if (trigger.type === 'any_message') {
    if (trigger.outsideHoursOnly) {
      return !isWithinBusinessHours(context.settings)
    }
    if (trigger.businessHoursOnly) {
      return isWithinBusinessHours(context.settings)
    }
    return true
  }

  if (trigger.type === 'keyword' && trigger.keywords?.length && context.messageBody) {
    const bodyLower = context.messageBody.toLowerCase()
    const matches = trigger.keywords.some((kw) => bodyLower.includes(kw.toLowerCase()))
    if (!matches) return false
    if (trigger.outsideHoursOnly) return !isWithinBusinessHours(context.settings)
    if (trigger.businessHoursOnly) return isWithinBusinessHours(context.settings)
    return true
  }

  if (trigger.type === 'button_click' && trigger.buttonPayload && context.buttonPayload) {
    return context.buttonPayload === trigger.buttonPayload
  }

  return false
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute a single flow step
 */
async function executeStep(
  step: FlowStep,
  customerPhone: string,
  flowId: string,
  conversationId: string,
  business: { name: string; email: string | null; slug: string }
): Promise<{ success: boolean; messageId?: string }> {
  if (step.delayMs && step.delayMs > 0) {
    await sleep(Math.min(step.delayMs, 5000))
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'

  switch (step.type) {
    case 'send_text': {
      const body = step.body || ''
      const result = await sendWhatsAppMessage(customerPhone, body)
      if (result.success && result.messageId) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId,
            direction: 'outbound',
            sender: 'flow',
            messageType: 'text',
            body,
            twilioMessageId: result.messageId,
            flowId
          }
        })
      }
      return { success: result.success, messageId: result.messageId }
    }

    case 'send_image': {
      const caption = step.caption || step.body || ' '
      const mediaUrl = step.mediaUrl
      const result = await sendWhatsAppMessageWithMedia(customerPhone, caption, mediaUrl)
      if (result.success && result.messageId) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId,
            direction: 'outbound',
            sender: 'flow',
            messageType: 'image',
            body: caption,
            mediaUrl: mediaUrl || null,
            twilioMessageId: result.messageId,
            flowId
          }
        })
      }
      return { success: result.success, messageId: result.messageId }
    }

    case 'send_url': {
      const url = step.url || `${baseUrl}/${business.slug}`
      const body = step.body ? `${step.body}\n${url}` : url
      const result = await sendWhatsAppMessage(customerPhone, body)
      if (result.success && result.messageId) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId,
            direction: 'outbound',
            sender: 'flow',
            messageType: 'text',
            body,
            twilioMessageId: result.messageId,
            flowId
          }
        })
      }
      return { success: result.success, messageId: result.messageId }
    }

    case 'notify_team': {
      const message = step.message || step.body || 'Customer needs help'
      const email = step.email || business.email
      if (email && resend && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'WaveOrder <notifications@waveorder.app>',
            to: email,
            subject: `[WaveOrder Flows] ${business.name} - ${message}`,
            html: `<p>${message}</p><p>View in <a href="${baseUrl}/admin/stores">WaveOrder Admin</a></p>`
          })
        } catch (err) {
          console.error('[flow-engine] notify_team email failed:', err)
        }
      }
      return { success: true }
    }

    case 'send_location': {
      const name = step.name || business.name
      const address = step.address || ''
      const lat = step.latitude
      const lng = step.longitude
      let body = step.body || ''
      if (lat != null && lng != null) {
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
        body = body ? `${body}\n\n📍 ${name}\n${address}\n\n${mapsUrl}` : `📍 ${name}\n${address}\n\nOpen in Maps: ${mapsUrl}`
      } else if (address) {
        body = body || `📍 ${name}\n${address}`
      }
      const result = await sendWhatsAppMessage(customerPhone, body)
      if (result.success && result.messageId) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId,
            direction: 'outbound',
            sender: 'flow',
            messageType: 'text',
            body,
            twilioMessageId: result.messageId,
            flowId
          }
        })
      }
      return { success: result.success, messageId: result.messageId }
    }

    case 'send_buttons':
      // Requires approved template - fallback to text
      if (step.body) {
        const result = await sendWhatsAppMessage(customerPhone, step.body)
        if (result.success && result.messageId) {
          await prisma.whatsAppMessage.create({
            data: {
              conversationId,
              direction: 'outbound',
              sender: 'flow',
              messageType: 'text',
              body: step.body,
              twilioMessageId: result.messageId,
              flowId
            }
          })
        }
        return { success: result.success, messageId: result.messageId }
      }
      return { success: true }

    default:
      return { success: true }
  }
}

/**
 * Run the flow engine for an incoming message.
 * Returns the flow that was executed, or null if none matched.
 */
export async function runFlowEngine(context: FlowContext): Promise<string | null> {
  const { businessId, conversationId, customerPhone } = context

  const [flows, business] = await Promise.all([
    prisma.whatsAppFlow.findMany({
      where: { businessId, isActive: true },
      orderBy: { priority: 'desc' }
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, email: true, slug: true }
    })
  ])

  if (!business) return null

  const settings = context.settings

  for (const flow of flows) {
    if (flow.type === 'welcome' && settings.welcomeFlowEnabled === false) continue
    if (flow.type === 'away' && settings.awayFlowEnabled === false) continue

    const trigger = flow.trigger as FlowTrigger
    const steps = flow.steps as FlowStep[]

    if (!trigger || !steps?.length) continue

    if (!triggerMatches(trigger, context)) continue

    for (const step of steps) {
      await executeStep(step, customerPhone, flow.id, conversationId, business)
    }

    await prisma.whatsAppFlow.update({
      where: { id: flow.id },
      data: {
        triggerCount: { increment: 1 },
        lastTriggeredAt: new Date()
      }
    })

    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { lastMessageBy: 'flow', lastMessageAt: new Date() }
    })

    return flow.id
  }

  return null
}
