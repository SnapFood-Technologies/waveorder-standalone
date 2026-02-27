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
  isTemporarilyClosed?: boolean
  closureReason?: string | null
  closureMessage?: string | null
  closureStartDate?: Date | null
  closureEndDate?: Date | null
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled?: boolean
  deliveryFee?: number
  minimumOrder?: number
  freeDeliveryThreshold?: number
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  deliveryRadius?: number
  shippingCountries?: string[]
  paymentMethods?: string[]
  paymentInstructions?: string | null
  allowOnlineBooking?: boolean
  serviceAllowAppointmentBooking?: boolean
  serviceAllowRequestByEmail?: boolean
  serviceAllowRequestByWhatsApp?: boolean
  products: ProductContext[]
}): string {
  const lang = storeData.storefrontLanguage || 'en'
  const hoursStr = formatBusinessHours(storeData.businessHours)
  let openStatus = storeData.isOpen
    ? `Currently OPEN`
    : `Currently CLOSED. Next open: ${storeData.nextOpenTime || 'Unknown'}`
  if (storeData.isTemporarilyClosed && (storeData.closureReason || storeData.closureMessage || storeData.closureEndDate)) {
    const parts: string[] = []
    if (storeData.closureReason) parts.push(`Reason: ${storeData.closureReason}`)
    if (storeData.closureMessage) parts.push(storeData.closureMessage)
    if (storeData.closureEndDate) {
      const endStr = storeData.closureEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      parts.push(`Reopening: ${endStr}`)
    }
    openStatus += `\nTemporary closure: ${parts.join('. ')}`
  }

  const isSalonOrServices = storeData.businessType === 'SALON' || storeData.businessType === 'SERVICES'

  const deliveryInfo = [
    storeData.deliveryEnabled ? `Delivery: Yes, Fee: ${storeData.currency} ${storeData.deliveryFee ?? 0}` : 'Delivery: No',
    storeData.pickupEnabled ? `Pickup: Yes` : 'Pickup: No',
    storeData.dineInEnabled ? 'Dine-in: Yes' : '',
    storeData.minimumOrder ? `Minimum order: ${storeData.currency} ${storeData.minimumOrder}` : '',
    storeData.freeDeliveryThreshold ? `Free delivery above: ${storeData.currency} ${storeData.freeDeliveryThreshold}` : '',
    storeData.estimatedDeliveryTime ? `Estimated delivery: ${storeData.estimatedDeliveryTime}` : '',
    storeData.estimatedPickupTime ? `Estimated pickup: ${storeData.estimatedPickupTime}` : '',
    storeData.deliveryRadius != null && storeData.deliveryRadius > 0 ? `Delivery radius: ${storeData.deliveryRadius} km` : '',
    storeData.shippingCountries?.length ? `Ships to: ${storeData.shippingCountries.join(', ')}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  const paymentMethodsStr = storeData.paymentMethods?.length ? storeData.paymentMethods.join(', ') : 'Cash, Card'
  const paymentInfo = storeData.paymentInstructions
    ? `${paymentMethodsStr}. ${storeData.paymentInstructions}`
    : paymentMethodsStr

  // Ordering/booking instructions - actual storefront flow
  const orderFlowSteps =
    '1) Browse and pick a product or service. 2) Tap it to open the detail modal. 3) Add to cart (or Add to booking for services). 4) Fill in the required information (delivery address, time, contact, etc.). 5) Submit - your order/booking will be sent to the business via WhatsApp. 6) You can follow up on your order through WhatsApp or by email.'
  const bookingFlowSteps =
    '1) Browse and pick a service. 2) Tap it to open the detail modal. 3) Add to booking. 4) Fill in the required information (date, time, contact, etc.). 5) Submit - your booking or service request will be sent to the business via WhatsApp. 6) You can follow up through WhatsApp or by email.'
  const orderingInstructions = isSalonOrServices ? bookingFlowSteps : orderFlowSteps

  // Format product/service for prompt - full format with variants/modifiers/description
  const formatItemFull = (p: ProductContext): string => {
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

  // Compact format for products 81+ (name, price, category only) to fit all 200 in context
  const formatItemCompact = (p: ProductContext): string => {
    const cat = p.category ? ` (${p.category})` : ''
    const dur = p.isService && p.serviceDuration ? ` ${p.serviceDuration}min` : ''
    return `- ${p.name}: ${storeData.currency} ${p.price}${cat}${dur}`
  }

  const MAX_FULL_PRODUCTS = 80
  const productList: string =
    storeData.products.length <= MAX_FULL_PRODUCTS
      ? storeData.products.map(formatItemFull).join('\n')
      : storeData.products
          .map((p, i) => (i < MAX_FULL_PRODUCTS ? formatItemFull(p) : formatItemCompact(p)))
          .join('\n')

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

CRITICAL - LANGUAGE HANDLING (check this FIRST before answering):
- Store language is ${lang === 'el' ? 'Greek' : lang === 'sq' || lang === 'al' ? 'Albanian' : lang === 'es' ? 'Spanish' : 'English'} (${lang}).
- If this is the FIRST user message in the conversation AND the user wrote in a DIFFERENT language than the store (e.g., English when store is Greek, or Greek when store is English), you MUST respond ONLY with this question in the user's language. Do NOT answer their actual question yet. Example: User asks "Are you open now?" in English, store is Greek → Reply ONLY: "This store's language is Greek. Would you prefer answers in your language (English) or the store language (Greek)?"
- If the user has already chosen a language in a previous message (e.g., "my language", "English", "store language", "Greek"), use that choice for all replies.
- If the user writes in the SAME language as the store, respond directly in that language.
- Only after the user has chosen (or wrote in the same language) should you answer their question.

RULES:
- Only answer questions about this store. Politely decline unrelated questions.
- If asked about a product/service that doesn't exist, say so honestly.
- When mentioning products or services, include the price and duration (for services).
- If asked how to order or book, explain: ${orderingInstructions}
- Keep answers concise (2-3 sentences unless more detail is requested).
- Never make up information not provided in the store data.
- Do not discuss competitor stores or other businesses.

SAFETY - STRICTLY ENFORCED:
- Never use hateful, harassing, discriminatory, or offensive language.
- Never respond to inappropriate requests; politely redirect to store-related questions.
- Stay professional and helpful at all times.`
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

    // Content moderation: reject hateful, harassing, or inappropriate user input
    try {
      const moderation = await openai.moderations.create({
        input: lastUserMsg.content,
        model: 'text-moderation-latest'
      })
      const result = moderation.results?.[0]
      if (result?.flagged) {
        return NextResponse.json(
          { error: "Your message could not be processed. Please ask about the store's products, services, or hours." },
          { status: 400 }
        )
      }
    } catch (modErr) {
      console.error('Moderation check failed:', modErr)
      // Continue without blocking - don't fail the whole request if moderation API errors
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
        aiChatModel: true,
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
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        paymentInstructions: true,
        deliveryRadius: true,
        shippingCountries: true,
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
      description: (useAlbanian && p.descriptionAl ? p.descriptionAl : useGreek && p.descriptionEl ? p.descriptionEl : p.description) ?? undefined,
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
      isTemporarilyClosed: business.isTemporarilyClosed ?? false,
      closureReason: business.closureReason ?? null,
      closureMessage: business.closureMessage ?? null,
      closureStartDate: business.closureStartDate ?? null,
      closureEndDate: business.closureEndDate ?? null,
      deliveryEnabled: business.deliveryEnabled ?? false,
      pickupEnabled: business.pickupEnabled ?? false,
      dineInEnabled: business.dineInEnabled ?? false,
      deliveryFee: business.deliveryFee ?? undefined,
      minimumOrder: business.minimumOrder ?? undefined,
      freeDeliveryThreshold: business.freeDeliveryThreshold ?? undefined,
      estimatedDeliveryTime: business.estimatedDeliveryTime ?? undefined,
      estimatedPickupTime: business.estimatedPickupTime ?? undefined,
      deliveryRadius: business.deliveryRadius ?? undefined,
      shippingCountries: business.shippingCountries ?? undefined,
      paymentMethods: business.paymentMethods as string[] | undefined,
      paymentInstructions: business.paymentInstructions ?? null,
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

    // Model: business override > env AI_CHAT_MODEL > default gpt-4o-mini
    const model = business.aiChatModel || process.env.AI_CHAT_MODEL || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
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
