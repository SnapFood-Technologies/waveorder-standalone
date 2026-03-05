// WaveOrder Flows - Twilio WhatsApp incoming webhook
// Receives incoming WhatsApp messages, stores them, and runs flow engine
// Configure this URL in Twilio Console: Messaging > Settings > Webhooks

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runFlowEngine } from '@/lib/whatsapp-flow-engine'
import { runWhatsAppAi } from '@/lib/whatsapp-ai-service'
import { normalizePhone } from '@/lib/whatsapp-utils'
import { roundRobinAssign } from '@/lib/whatsapp-auto-assign'
import { logSystemEvent, extractIPAddress, getActualRequestUrl } from '@/lib/systemLog'

const CONTEXT_MESSAGES = 10

export async function POST(request: NextRequest) {
  const ipAddress = extractIPAddress(request)
  const userAgent = request.headers.get('user-agent') || undefined
  const actualUrl = getActualRequestUrl(request, '/api/webhooks/twilio/incoming')

  try {
    // Twilio sends form-urlencoded data
    const formData = await request.formData()
    const from = formData.get('From') as string | null
    const to = formData.get('To') as string | null
    const body = formData.get('Body') as string | null
    const messageSid = formData.get('MessageSid') as string | null
    const numMedia = parseInt((formData.get('NumMedia') as string) || '0', 10)
    // Button reply payload (when customer taps interactive button)
    const buttonPayload = (formData.get('ButtonPayload') || formData.get('buttonPayload')) as string | null
    const profileName = formData.get('ProfileName') as string | null

    if (!from || !to) {
      console.error('[Twilio webhook] Missing From or To')
      return new NextResponse('Missing From or To', { status: 400 })
    }

    const customerPhone = normalizePhone(from)
    const businessPhone = normalizePhone(to)

    // Find business by WhatsApp number (To = our number that received the message)
    // Match Business.whatsappNumber or WhatsAppSettings.phoneNumber (normalized digits)
    const toDigits = businessPhone.replace(/\D/g, '')
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      include: { whatsappSettings: true }
    })
    const resolvedBusiness = businesses.find((b) => {
      const bizDigits = (b.whatsappNumber || '').replace(/\D/g, '')
      const settingsDigits = (b.whatsappSettings?.phoneNumber || '').replace(/\D/g, '')
      return (bizDigits && (bizDigits === toDigits || bizDigits.endsWith(toDigits.slice(-10)))) ||
        (settingsDigits && (settingsDigits === toDigits || settingsDigits.endsWith(toDigits.slice(-10))))
    })

    if (!resolvedBusiness) {
      console.warn('[Twilio webhook] No business found for phone:', businessPhone)
      // Return 200 so Twilio doesn't retry - we just can't route this message
      return new NextResponse('', { status: 200 })
    }

    if (!resolvedBusiness.whatsappSettings?.isEnabled) {
      console.warn('[Twilio webhook] Flows not enabled for business:', resolvedBusiness.id)
      return new NextResponse('', { status: 200 })
    }

    // Determine message type and body
    const messageType = buttonPayload ? 'button_reply' : numMedia > 0 ? 'image' : 'text'
    let messageBody = body || (buttonPayload ? `[Button: ${buttonPayload}]` : null)
    if (numMedia > 0 && !messageBody) {
      messageBody = `[${numMedia} media attachment${numMedia > 1 ? 's' : ''}]`
    }

    // Find or create conversation
    let conversation = await prisma.whatsAppConversation.findUnique({
      where: {
        businessId_customerPhone: {
          businessId: resolvedBusiness.id,
          customerPhone
        }
      }
    })

    if (!conversation) {
      let assignedTo: string | null = null
      if (resolvedBusiness.whatsappSettings?.autoAssignEnabled) {
        assignedTo = await roundRobinAssign(resolvedBusiness.id)
      }
      conversation = await prisma.whatsAppConversation.create({
        data: {
          businessId: resolvedBusiness.id,
          customerPhone,
          customerName: (profileName as string) || null,
          lastMessageAt: new Date(),
          lastMessageBy: 'customer',
          isRead: false,
          status: assignedTo ? 'assigned' : 'open',
          assignedTo
        }
      })
    } else {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          customerName: (profileName as string) || conversation.customerName,
          lastMessageAt: new Date(),
          lastMessageBy: 'customer',
          isRead: false
        }
      })
    }

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        sender: 'customer',
        messageType,
        body: messageBody,
        buttonPayload: buttonPayload || null,
        twilioMessageId: messageSid || null
      }
    })

    // Log incoming message for superadmin visibility
    logSystemEvent({
      logType: 'whatsapp_flow_message_in',
      severity: 'info',
      businessId: resolvedBusiness.id,
      endpoint: '/api/webhooks/twilio/incoming',
      method: 'POST',
      statusCode: 200,
      ipAddress,
      userAgent,
      url: actualUrl,
      metadata: { conversationId: conversation.id, customerPhone, messageType }
    })

    // Upsert contact for broadcast list (unless opting out)
    const optOutPattern = /^(stop|unsubscribe|cancel|end|quit|opt.?out)\s*$/i
    const isOptOut = messageBody && optOutPattern.test(messageBody.trim())
    if (!isOptOut) {
      await prisma.whatsAppContact.upsert({
        where: { businessId_phone: { businessId: resolvedBusiness.id, phone: customerPhone } },
        create: {
          businessId: resolvedBusiness.id,
          phone: customerPhone,
          name: (profileName as string) || null,
          source: 'conversation'
        },
        update: { name: (profileName as string) || conversation.customerName || undefined }
      })
    }

    // Opt-out: customer replies STOP, stop, unsubscribe, etc.
    if (isOptOut) {
      await prisma.whatsAppContact.upsert({
        where: {
          businessId_phone: { businessId: resolvedBusiness.id, phone: customerPhone }
        },
        create: {
          businessId: resolvedBusiness.id,
          phone: customerPhone,
          name: (profileName as string) || null,
          optedOut: true,
          optedOutAt: new Date(),
          source: 'conversation'
        },
        update: { optedOut: true, optedOutAt: new Date() }
      })
    }

    const messageCount = await prisma.whatsAppMessage.count({
      where: { conversationId: conversation.id }
    })
    const isFirstMessage = messageCount === 1

    const settings = resolvedBusiness.whatsappSettings
    if (settings) {
      const flowContext = {
        businessId: resolvedBusiness.id,
        conversationId: conversation.id,
        customerPhone,
        customerName: conversation.customerName,
        isFirstMessage,
        messageBody,
        buttonPayload: buttonPayload || null,
        settings: {
          businessHoursStart: settings.businessHoursStart,
          businessHoursEnd: settings.businessHoursEnd,
          businessHoursTimezone: settings.businessHoursTimezone,
          businessDays: settings.businessDays || [1, 2, 3, 4, 5],
          welcomeFlowEnabled: settings.welcomeFlowEnabled,
          awayFlowEnabled: settings.awayFlowEnabled
        }
      }
      try {
        const flowMatched = await runFlowEngine(flowContext)
        if (flowMatched) {
          logSystemEvent({
            logType: 'whatsapp_flow_message_out',
            severity: 'info',
            businessId: resolvedBusiness.id,
            endpoint: '/api/webhooks/twilio/incoming',
            method: 'POST',
            statusCode: 200,
            ipAddress,
            userAgent,
            url: actualUrl,
            metadata: { conversationId: conversation.id, flowId: flowMatched, customerPhone }
          })
        }
        if (!flowMatched && settings.aiEnabled) {
          const recentMessages = await prisma.whatsAppMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
            take: CONTEXT_MESSAGES,
            select: { direction: true, sender: true, body: true }
          })
          const aiContext = {
            businessId: resolvedBusiness.id,
            conversationId: conversation.id,
            customerPhone,
            customerName: conversation.customerName,
            messageBody: messageBody || '',
            recentMessages: recentMessages.reverse().map((m) => ({
              role: m.direction === 'inbound' ? ('customer' as const) : (m.sender as 'business' | 'flow' | 'ai'),
              body: m.body || ''
            }))
          }
          try {
            const aiResult = await runWhatsAppAi(aiContext)
            if (aiResult.success && aiResult.messageId) {
              logSystemEvent({
                logType: 'whatsapp_ai_reply',
                severity: 'info',
                businessId: resolvedBusiness.id,
                endpoint: '/api/webhooks/twilio/incoming',
                method: 'POST',
                statusCode: 200,
                ipAddress,
                userAgent,
                url: actualUrl,
                metadata: { conversationId: conversation.id, customerPhone, intent: aiResult.intent, confidence: aiResult.confidence }
              })
            }
          } catch (aiErr) {
            console.error('[Twilio webhook] AI error:', aiErr)
            logSystemEvent({
              logType: 'whatsapp_ai_error',
              severity: 'error',
              businessId: resolvedBusiness.id,
              endpoint: '/api/webhooks/twilio/incoming',
              method: 'POST',
              statusCode: 500,
              errorMessage: aiErr instanceof Error ? aiErr.message : 'AI error',
              ipAddress,
              userAgent,
              url: actualUrl,
              metadata: { conversationId: conversation.id, customerPhone }
            })
          }
        }
      } catch (err) {
        console.error('[Twilio webhook] Flow engine error:', err)
        logSystemEvent({
          logType: 'whatsapp_flow_error',
          severity: 'error',
          businessId: resolvedBusiness.id,
          endpoint: '/api/webhooks/twilio/incoming',
          method: 'POST',
          statusCode: 500,
          errorMessage: err instanceof Error ? err.message : 'Flow engine error',
          ipAddress,
          userAgent,
          url: actualUrl,
          metadata: { conversationId: conversation.id, customerPhone }
        })
      }
    }

    return new NextResponse('', { status: 200 })
  } catch (error) {
    console.error('[Twilio webhook] Error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
