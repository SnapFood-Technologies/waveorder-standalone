// app/api/storefront/[slug]/ai-chat/route.ts
// AI Store Assistant - answers customer questions using store context
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { extractIPAddress } from '@/lib/systemLog'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const RATE_LIMIT = 20 // requests per minute per IP
const MAX_MESSAGES = 10
const MAX_USER_MESSAGE_LENGTH = 500
const MAX_RESPONSE_TOKENS = 300

// Simple in-memory rate limit (use Redis in production for multi-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function formatBusinessHours(businessHours: any): string {
  if (!businessHours) return 'Not specified'
  if (typeof businessHours === 'object' && !Array.isArray(businessHours)) {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return dayNames
      .map((day) => {
        const h = businessHours[day]
        if (!h || h.closed) return `${day}: Closed`
        return `${day}: ${h.open || '09:00'}-${h.close || '17:00'}`
      })
      .join('\n')
  }
  return Array.isArray(businessHours)
    ? businessHours.map((d: any) => `${d.day}: ${d.closed ? 'Closed' : `${d.open}-${d.close}`}`).join('\n')
    : 'Not specified'
}

type ProductContext = {
  name: string
  price: number
  category?: string
  description?: string
  isService?: boolean
  serviceDuration?: number
  variants?: Array<{ name: string; price: number }>
  modifiers?: Array<{ name: string; price: number }>
}

function buildSystemPrompt(storeData: {
  name: string
  description?: string
  address?: string
  businessType: string
  currency: string
  storefrontLanguage: string
  businessHours: any
  isOpen: boolean
  nextOpenTime: string | null
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled?: boolean
  deliveryFee?: number
  minimumOrder?: number
  freeDeliveryThreshold?: number
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  paymentMethods?: string[]
  allowOnlineBooking?: boolean
  serviceAllowAppointmentBooking?: boolean
  serviceAllowRequestByEmail?: boolean
  serviceAllowRequestByWhatsApp?: boolean
  products: ProductContext[]
}): string {
  const lang = storeData.storefrontLanguage || 'en'
  const hoursStr = formatBusinessHours(storeData.businessHours)
  const openStatus = storeData.isOpen
    ? `Currently OPEN`
    : `Currently CLOSED. Next open: ${storeData.nextOpenTime || 'Unknown'}`

  const isSalonOrServices = storeData.businessType === 'SALON' || storeData.businessType === 'SERVICES'

  const deliveryInfo = [
    storeData.deliveryEnabled ? `Delivery: Yes, Fee: ${storeData.currency} ${storeData.deliveryFee ?? 0}` : 'Delivery: No',
    storeData.pickupEnabled ? `Pickup: Yes` : 'Pickup: No',
    storeData.dineInEnabled ? 'Dine-in: Yes' : '',
    storeData.minimumOrder ? `Minimum order: ${storeData.currency} ${storeData.minimumOrder}` : '',
    storeData.freeDeliveryThreshold ? `Free delivery above: ${storeData.currency} ${storeData.freeDeliveryThreshold}` : '',
    storeData.estimatedDeliveryTime ? `Estimated delivery: ${storeData.estimatedDeliveryTime}` : '',
    storeData.estimatedPickupTime ? `Estimated pickup: ${storeData.estimatedPickupTime}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  const paymentInfo = storeData.paymentMethods?.length
    ? storeData.paymentMethods.join(', ')
    : 'Cash, Card'

  // Ordering instructions per business type
  let orderingInstructions = 'Order via WhatsApp: message the business on WhatsApp to place an order.'
  if (isSalonOrServices) {
    const parts: string[] = []
    if (storeData.allowOnlineBooking !== false && storeData.serviceAllowAppointmentBooking !== false) {
      parts.push('Book appointments via WhatsApp or the storefront.')
    }
    if (storeData.serviceAllowRequestByEmail || storeData.serviceAllowRequestByWhatsApp) {
      parts.push('Request a quote by email or WhatsApp via the storefront form.')
    }
    orderingInstructions = parts.length > 0 ? parts.join(' ') : 'Book or request services via WhatsApp or the storefront.'
  }

  // Format product/service for prompt
  const formatItem = (p: ProductContext): string => {
    const base = `${p.name}: ${storeData.currency} ${p.price}`
    const extras: string[] = []
    if (p.category) extras.push(`(${p.category})`)
    if (p.isService && p.serviceDuration) extras.push(`${p.serviceDuration} min`)
    if (p.variants && p.variants.length > 0) {
      const variantStr = p.variants.map((v) => `${v.name} ${storeData.currency} ${v.price}`).join(', ')
      extras.push(`Sizes/options: ${variantStr}`)
    }
    if (p.modifiers && p.modifiers.length > 0) {
      const modStr = p.modifiers.map((m) => `${m.name} ${storeData.currency} ${m.price}`).join(', ')
      extras.push(`Add-ons: ${modStr}`)
    }
    if (p.description) extras.push(p.description.slice(0, 60) + (p.description.length > 60 ? '...' : ''))
    return `- ${base}${extras.length ? ' ' + extras.join(' | ') : ''}`
  }

  let productList: string
  if (storeData.products.length > 100) {
    const byCategory = storeData.products.reduce((acc: Record<string, number>, p) => {
      const cat = p.category || 'Other'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    productList = Object.entries(byCategory)
      .map(([cat, count]) => `- ${cat}: ${count} items`)
      .join('\n')
  } else {
    productList = storeData.products
      .slice(0, 80)
      .map(formatItem)
      .join('\n')
  }

  const sectionTitle = isSalonOrServices ? 'PRODUCTS & SERVICES' : 'PRODUCTS'

  return `You are a helpful assistant for ${storeData.name}, a ${storeData.businessType} business on WaveOrder.
You answer customer questions about the store's products, services, hours, delivery options, and ordering process.

STORE INFORMATION:
- Name: ${storeData.name}
- Description: ${storeData.description || 'N/A'}
- Address: ${storeData.address || 'Not specified'}
- Type: ${storeData.businessType}
- Currency: ${storeData.currency}
- Language: ${lang}

BUSINESS HOURS:
${hoursStr}
Status: ${openStatus}

DELIVERY & ORDERING:
${deliveryInfo}
Payment methods: ${paymentInfo}

HOW TO ORDER: ${orderingInstructions}

${sectionTitle}:
${productList || 'No items listed yet.'}

RULES:
- Only answer questions about this store. Politely decline unrelated questions.
- If asked about a product/service that doesn't exist, say so honestly.
- When mentioning products or services, include the price and duration (for services).
- If asked how to order or book, explain: ${orderingInstructions}
- Keep answers concise (2-3 sentences unless more detail is requested).
- Respond in ${lang === 'el' ? 'Greek' : lang === 'sq' || lang === 'al' ? 'Albanian' : lang === 'es' ? 'Spanish' : 'English'}.
- Never make up information not provided in the store data.
- Do not discuss competitor stores or other businesses.`
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const ipAddress = extractIPAddress(request) ?? 'unknown'

    if (!checkRateLimit(ipAddress)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI assistant is temporarily unavailable.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { messages, sessionId } = body as { messages?: Array<{ role: string; content: string }>; sessionId?: string }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: 'Too many messages in conversation' }, { status: 400 })
    }

    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg?.content || typeof lastUserMsg.content !== 'string') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }

    if (lastUserMsg.content.length > MAX_USER_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { slug, isActive: true, setupWizardCompleted: true },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        businessType: true,
        currency: true,
        storefrontLanguage: true,
        language: true,
        businessHours: true,
        timezone: true,
        aiAssistantEnabled: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        deliveryFee: true,
        minimumOrder: true,
        freeDeliveryThreshold: true,
        estimatedDeliveryTime: true,
        estimatedPickupTime: true,
        paymentMethods: true,
        subscriptionPlan: true,
        isTemporarilyClosed: true,
        allowOnlineBooking: true,
        serviceAllowAppointmentBooking: true,
        serviceAllowRequestByEmail: true,
        serviceAllowRequestByWhatsApp: true
      }
    })

    if (!business || !business.aiAssistantEnabled) {
      return NextResponse.json({ error: 'Store not found or AI assistant not enabled' }, { status: 404 })
    }

    // Plan gating: Pro, Business, or SuperAdmin override (aiAssistantEnabled already implies access)
    // No additional plan check - SuperAdmin can enable for any plan

    const businessIds = [business.id]
    const products = await prisma.product.findMany({
      where: {
        businessId: { in: businessIds },
        isActive: true,
        price: { gt: 0 }
      },
      select: {
        name: true,
        nameAl: true,
        nameEl: true,
        price: true,
        description: true,
        descriptionAl: true,
        descriptionEl: true,
        categoryId: true,
        isService: true,
        serviceDuration: true,
        category: { select: { name: true } },
        variants: { select: { name: true, price: true } },
        modifiers: { select: { name: true, price: true } }
      },
      take: 200
    })

    const storefrontLang = business.storefrontLanguage || business.language || 'en'
    const useAlbanian = storefrontLang === 'sq' || storefrontLang === 'al'
    const useGreek = storefrontLang === 'el'

    const productList: ProductContext[] = products.map((p) => ({
      name: useAlbanian && p.nameAl ? p.nameAl : useGreek && p.nameEl ? p.nameEl : p.name,
      price: p.price,
      category: (p.category as { name?: string })?.name,
      description: useAlbanian && p.descriptionAl ? p.descriptionAl : useGreek && p.descriptionEl ? p.descriptionEl : p.description,
      isService: p.isService,
      serviceDuration: p.serviceDuration ?? undefined,
      variants: p.variants?.length ? p.variants.map((v) => ({ name: v.name, price: v.price })) : undefined,
      modifiers: p.modifiers?.length ? p.modifiers.map((m) => ({ name: m.name, price: m.price })) : undefined
    }))

    const now = new Date()
    const businessTime = new Date(now.toLocaleString('en-US', { timeZone: business.timezone || 'UTC' }))
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[businessTime.getDay()]
    const bh = business.businessHours as Record<string, { open?: string; close?: string; closed?: boolean }> | null
    const todaysHours = bh?.[currentDay]
    let isWithinHours = false
    let nextOpenTime: string | null = 'Next business day'
    if (todaysHours && !todaysHours.closed && todaysHours.open && todaysHours.close) {
      const currentTime = `${businessTime.getHours().toString().padStart(2, '0')}:${businessTime.getMinutes().toString().padStart(2, '0')}`
      const isOvernight = todaysHours.close < todaysHours.open
      isWithinHours = isOvernight
        ? currentTime >= todaysHours.open || currentTime < todaysHours.close
        : currentTime >= todaysHours.open && currentTime <= todaysHours.close
      if (isWithinHours) nextOpenTime = null
    }
    const isOpen = isWithinHours && !business.isTemporarilyClosed

    const systemPrompt = buildSystemPrompt({
      name: business.name,
      description: business.description || undefined,
      address: business.address || undefined,
      businessType: business.businessType,
      currency: business.currency,
      storefrontLanguage: storefrontLang,
      businessHours: business.businessHours,
      isOpen: isWithinHours && !business.isTemporarilyClosed,
      nextOpenTime,
      deliveryEnabled: business.deliveryEnabled ?? false,
      pickupEnabled: business.pickupEnabled ?? false,
      dineInEnabled: business.dineInEnabled ?? false,
      deliveryFee: business.deliveryFee ?? undefined,
      minimumOrder: business.minimumOrder ?? undefined,
      freeDeliveryThreshold: business.freeDeliveryThreshold ?? undefined,
      estimatedDeliveryTime: business.estimatedDeliveryTime ?? undefined,
      estimatedPickupTime: business.estimatedPickupTime ?? undefined,
      paymentMethods: business.paymentMethods as string[] | undefined,
      allowOnlineBooking: business.allowOnlineBooking ?? true,
      serviceAllowAppointmentBooking: business.serviceAllowAppointmentBooking ?? true,
      serviceAllowRequestByEmail: business.serviceAllowRequestByEmail ?? false,
      serviceAllowRequestByWhatsApp: business.serviceAllowRequestByWhatsApp ?? false,
      products: productList
    })

    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    ]

    const completion = await openai.chat.completions.create({
      model: process.env.AI_CHAT_MODEL || 'gpt-4o-mini',
      messages: apiMessages,
      max_tokens: MAX_RESPONSE_TOKENS,
      temperature: 0.5
    })

    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.'
    const tokensUsed = completion.usage?.total_tokens ?? 0

    // Store messages for admin analytics
    const userAgent = request.headers.get('user-agent') || undefined
    await prisma.$transaction([
      prisma.aiChatMessage.create({
        data: {
          businessId: business.id,
          role: 'user',
          content: lastUserMsg.content,
          sessionId: sessionId || undefined,
          ipAddress: ipAddress || undefined,
          userAgent
        }
      }),
      prisma.aiChatMessage.create({
        data: {
          businessId: business.id,
          role: 'assistant',
          content: reply,
          sessionId: sessionId || undefined,
          ipAddress: ipAddress || undefined,
          userAgent
        }
      })
    ])

    return NextResponse.json({
      reply,
      tokensUsed
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    )
  }
}
