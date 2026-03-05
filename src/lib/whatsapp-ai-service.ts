/**
 * WaveOrder Flows - AI Auto-Replies (Phase 6)
 * OpenAI-powered intent classification and response generation for WhatsApp
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/twilio'
import { Resend } from 'resend'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type AiIntent = 'product_inquiry' | 'faq_question' | 'order_status' | 'complaint' | 'unknown'

export interface WhatsAppAiContext {
  businessId: string
  conversationId: string
  customerPhone: string
  customerName?: string | null
  messageBody: string
  recentMessages: Array<{ role: 'customer' | 'business' | 'flow' | 'ai'; body: string }>
}

export interface WhatsAppAiResult {
  success: boolean
  response?: string
  intent?: AiIntent
  confidence?: number
  routeToHuman?: boolean
  messageId?: string
}

const CONTEXT_MESSAGES = 10
const MODEL = process.env.WHATSAPP_AI_MODEL || 'gpt-4o-mini'
const MAX_RESPONSE_TOKENS = 500

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Get today's AI reply count for a business and check against limit */
export async function getAiReplyCountToday(businessId: string): Promise<number> {
  const dateStr = getDateStr()
  const record = await prisma.whatsAppAiUsage.findUnique({
    where: {
      businessId_dateStr: { businessId, dateStr }
    }
  })
  return record?.replyCount ?? 0
}

/** Increment AI reply count for today */
async function incrementAiUsage(businessId: string): Promise<void> {
  const dateStr = getDateStr()
  await prisma.whatsAppAiUsage.upsert({
    where: {
      businessId_dateStr: { businessId, dateStr }
    },
    create: { businessId, dateStr, replyCount: 1 },
    update: { replyCount: { increment: 1 } }
  })
}

/** Build product summary for AI context */
async function getProductContext(businessId: string): Promise<string> {
  const products = await prisma.product.findMany({
    where: { businessId, isActive: true },
    select: { name: true, description: true, price: true, stock: true, isService: true, serviceDuration: true },
    take: 100,
    orderBy: { name: 'asc' }
  })
  if (products.length === 0) return 'No products or services listed.'
  return products
    .slice(0, 50)
    .map((p) => {
      const price = `$${p.price.toFixed(2)}`
      const stock = p.stock != null ? ` (stock: ${p.stock})` : ''
      const dur = p.isService && p.serviceDuration ? ` (${p.serviceDuration} min)` : ''
      const desc = p.description ? ` - ${p.description.slice(0, 80)}` : ''
      return `- ${p.name}: ${price}${dur}${stock}${desc}`
    })
    .join('\n')
}

/** Build FAQ summary for AI context */
async function getFaqContext(businessId: string): Promise<string> {
  const faqs = await prisma.whatsAppFaq.findMany({
    where: { businessId },
    orderBy: { order: 'asc' },
    take: 50
  })
  if (faqs.length === 0) return 'No FAQ entries.'
  return faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
}

/** Check order status for customer (by phone) */
async function getOrderStatusContext(businessId: string, customerPhone: string): Promise<string> {
  const digits = customerPhone.replace(/\D/g, '').slice(-9)
  if (!digits) return 'No orders found for this customer.'
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      OR: [
        { phone: { endsWith: digits } },
        { phone: { contains: digits } }
      ]
    },
    select: { id: true }
  })
  const customerIds = customers.map((c) => c.id)
  if (customerIds.length === 0) return 'No orders found for this customer.'
  const orders = await prisma.order.findMany({
    where: { businessId, customerId: { in: customerIds } },
    select: { orderNumber: true, status: true, subtotal: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  return orders
    .map((o) => `Order ${o.orderNumber}: ${o.status} - $${o.subtotal.toFixed(2)} (${o.createdAt.toLocaleDateString()})`)
    .join('\n')
}

/** Classify intent and generate response in one OpenAI call */
async function classifyAndRespond(
  context: WhatsAppAiContext,
  productContext: string,
  faqContext: string,
  orderContext: string,
  settings: {
    aiPersonality: string
    aiPersonalityPrompt: string | null
  }
): Promise<{ intent: AiIntent; confidence: number; response: string } | { routeToHuman: true }> {
  if (!openai) throw new Error('OpenAI not configured')

  const recentStr = context.recentMessages
    .slice(-CONTEXT_MESSAGES)
    .map((m) => `${m.role}: ${m.body}`)
    .join('\n')

  const personality =
    settings.aiPersonality === 'custom' && settings.aiPersonalityPrompt
      ? settings.aiPersonalityPrompt
      : settings.aiPersonality === 'formal'
        ? 'Be professional and formal.'
        : 'Be friendly and conversational.'

  const systemPrompt = `You are an AI assistant for a business replying via WhatsApp. ${personality}
Respond in the same language as the customer unless they ask otherwise. Keep replies concise (2-4 sentences max for WhatsApp).

CLASSIFY the customer's latest message into one intent:
- product_inquiry: questions about products, prices, menu, catalog, availability
- faq_question: general FAQs (hours, location, delivery, payment, how to order)
- order_status: "where is my order", "order status", tracking
- complaint: complaints, frustration, negative feedback
- unknown: unclear, off-topic, or you're not confident

Then PROVIDE a response. Use ONLY the business data below. Do not invent information.

BUSINESS DATA:
Products/Services:
${productContext}

FAQs:
${faqContext}

Recent order info (if any) for this customer:
${orderContext}

Reply in JSON only, no other text:
{"intent":"<product_inquiry|faq_question|order_status|complaint|unknown>","confidence":<0-1>,"response":"<your reply text>"}

If intent is complaint OR confidence < 0.5, set response to "ROUTE_TO_HUMAN" and we will not send an auto-reply.`

  const userContent = `Conversation:\n${recentStr}\n\nCustomer's latest message: ${context.messageBody}`

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    max_tokens: MAX_RESPONSE_TOKENS,
    temperature: 0.3
  })

  const raw = completion.choices[0]?.message?.content?.trim()
  if (!raw) return { routeToHuman: true }

  try {
    const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) as {
      intent?: string
      confidence?: number
      response?: string
    }
    const intent = (json.intent || 'unknown') as AiIntent
    const confidence = typeof json.confidence === 'number' ? json.confidence : 0.5
    const response = json.response || ''

    if (intent === 'complaint' || response === 'ROUTE_TO_HUMAN' || confidence < 0.5) {
      return { routeToHuman: true }
    }

    if (!response || response === 'ROUTE_TO_HUMAN') return { routeToHuman: true }

    return { intent, confidence, response }
  } catch {
    return { routeToHuman: true }
  }
}

/**
 * Run AI auto-reply for an incoming WhatsApp message.
 * Called when no manual flow matched. Returns result for webhook to send message and store.
 */
export async function runWhatsAppAi(context: WhatsAppAiContext): Promise<WhatsAppAiResult> {
  const settings = await prisma.whatsAppSettings.findUnique({
    where: { businessId: context.businessId }
  })

  if (!settings?.aiEnabled || !openai) {
    return { success: false }
  }

  const countToday = await getAiReplyCountToday(context.businessId)
  if (countToday >= (settings.aiDailyLimit || 50)) {
    return { success: false }
  }

  const [productContext, faqContext, orderContext] = await Promise.all([
    getProductContext(context.businessId),
    getFaqContext(context.businessId),
    getOrderStatusContext(context.businessId, context.customerPhone)
  ])

  const threshold = settings.aiConfidenceThreshold ?? 0.6

  const result = await classifyAndRespond(context, productContext, faqContext, orderContext, {
    aiPersonality: settings.aiPersonality || 'friendly',
    aiPersonalityPrompt: settings.aiPersonalityPrompt
  })

  if ('routeToHuman' in result) {
    // Optionally notify team for complaint/low confidence
    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { name: true, email: true }
    })
    if (business?.email && resend && process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'WaveOrder <notifications@waveorder.app>',
          to: business.email,
          subject: `[WaveOrder Flows] ${business.name} - Customer may need help`,
          html: `<p>A customer wrote on WhatsApp and the AI routed to human (low confidence or complaint).</p>
<p>Message: ${context.messageBody}</p>
<p><a href="${baseUrl}/admin/stores">View in WaveOrder Admin</a></p>`
        })
      } catch (err) {
        console.error('[whatsapp-ai] notify email failed:', err)
      }
    }
    return { success: true, routeToHuman: true }
  }

  const { response, intent, confidence } = result
  if (!response || confidence < threshold) {
    return { success: true, routeToHuman: true }
  }

  const twilioResult = await sendWhatsAppMessage(context.customerPhone, response)
  if (!twilioResult.success || !twilioResult.messageId) {
    return { success: false }
  }

  await prisma.whatsAppMessage.create({
    data: {
      conversationId: context.conversationId,
      direction: 'outbound',
      sender: 'ai',
      messageType: 'text',
      body: response,
      twilioMessageId: twilioResult.messageId,
      metadata: { intent, confidence }
    }
  })

  await incrementAiUsage(context.businessId)

  await prisma.whatsAppConversation.update({
    where: { id: context.conversationId },
    data: { lastMessageBy: 'ai', lastMessageAt: new Date() }
  })

  return {
    success: true,
    response,
    intent,
    confidence,
    messageId: twilioResult.messageId
  }
}
