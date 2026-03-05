// WaveOrder Flows - Twilio WhatsApp incoming webhook
// Receives incoming WhatsApp messages and stores them for the Conversations inbox
// Configure this URL in Twilio Console: Messaging > Settings > Webhooks

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Normalize phone number for matching (strip whatsapp: prefix and non-digits except +)
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/^whatsapp:/i, '').replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  return cleaned
}

export async function POST(request: NextRequest) {
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
      conversation = await prisma.whatsAppConversation.create({
        data: {
          businessId: resolvedBusiness.id,
          customerPhone,
          customerName: (profileName as string) || null,
          lastMessageAt: new Date(),
          lastMessageBy: 'customer',
          isRead: false,
          status: 'open'
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

    // Store inbound message
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

    // TODO Phase 2: Run flow engine (welcome, away, keyword, button triggers)
    // For now, messages are stored and visible in inbox for manual reply

    return new NextResponse('', { status: 200 })
  } catch (error) {
    console.error('[Twilio webhook] Error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
