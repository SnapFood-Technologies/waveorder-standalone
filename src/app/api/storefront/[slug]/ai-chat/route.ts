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
const MAX_RESPONSE_TOKENS = 400 // Enough for nuanced answers; avoids truncation that could cause confusion

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
  phone?: string | null
  email?: string | null
  website?: string | null
  whatsappNumber?: string
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
  freeDeliveryText?: string | null
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  deliveryTimeText?: string | null
  deliveryRadius?: number
  shippingCountries?: string[]
  paymentMethods?: string[]
  paymentInstructions?: string | null
  allowOnlineBooking?: boolean
  serviceAllowAppointmentBooking?: boolean
  serviceAllowRequestByEmail?: boolean
  serviceAllowRequestByWhatsApp?: boolean
  orderNotificationsEnabled?: boolean
  orderNotificationEmail?: string | null
  whatsappDirectNotifications?: boolean
  slotDuration?: number | null
  appointmentBufferMinutes?: number | null
  showStaffSelection?: boolean
  showServiceDuration?: boolean
  products: ProductContext[]
  productCountNote?: string
  postalPricing?: Array<{ cityName: string; price: number; deliveryTime?: string | null; deliveryTimeEl?: string | null }>
  deliveryZones?: Array<{ name: string; maxDistance: number; fee: number }>
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

  const isSalon = storeData.businessType === 'SALON'
  const isServices = storeData.businessType === 'SERVICES'
  const isSalonOrServices = isSalon || isServices
  const isRetail = storeData.businessType === 'RETAIL'
  const isRestaurantGroceryCafe = ['RESTAURANT', 'CAFE', 'GROCERY'].includes(storeData.businessType)

  // For RETAIL: use deliveryTimeText if set; otherwise estimatedDeliveryTime. For city-specific: use postalPricing.
  const deliveryTimeStr =
    storeData.deliveryTimeText || storeData.estimatedDeliveryTime
      ? `Estimated delivery: ${storeData.deliveryTimeText || storeData.estimatedDeliveryTime}`
      : ''

  const freeDeliveryStr = storeData.freeDeliveryThreshold
    ? storeData.freeDeliveryText || `Free delivery above: ${storeData.currency} ${storeData.freeDeliveryThreshold}`
    : ''

  const deliveryFeeLine = !storeData.deliveryEnabled
    ? 'Delivery: No'
    : storeData.postalPricing?.length
      ? 'Delivery: Yes, Fee varies by city (see city-specific below)'
      : storeData.deliveryZones?.length
        ? 'Delivery: Yes, Fee varies by zone (see zones below)'
        : `Delivery: Yes, Fee: ${storeData.currency} ${storeData.deliveryFee ?? 0}`

  const deliveryInfo = [
    deliveryFeeLine,
    storeData.pickupEnabled ? `Pickup: Yes` : 'Pickup: No',
    storeData.dineInEnabled ? 'Dine-in: Yes' : '',
    storeData.minimumOrder ? `Minimum order: ${storeData.currency} ${storeData.minimumOrder}` : '',
    freeDeliveryStr,
    deliveryTimeStr,
    storeData.estimatedPickupTime ? `Estimated pickup: ${storeData.estimatedPickupTime}` : '',
    storeData.deliveryRadius != null && storeData.deliveryRadius > 0 ? `Delivery radius: ${storeData.deliveryRadius} km` : '',
    storeData.shippingCountries?.length ? `Ships to: ${storeData.shippingCountries.join(', ')}` : '',
    storeData.deliveryZones?.length
      ? `Delivery zones (address autocomplete detects zone by distance - ONLY these zones; if outside, say to contact store): ${storeData.deliveryZones?.map((z) => `${z.name}: up to ${z.maxDistance}km, ${storeData.currency} ${z.fee}`).join('; ')}`
      : '',
    storeData.postalPricing?.length
      ? `City-specific delivery (RETAIL - ONLY these cities have pricing; if asked about another city, say to contact store): ${storeData.postalPricing
          .map(
            (p) =>
              `${p.cityName}: ${storeData.currency} ${p.price}${p.deliveryTimeEl || p.deliveryTime ? `, ${p.deliveryTimeEl || p.deliveryTime}` : ''}`
          )
          .join('; ')}`
      : storeData.businessType === 'RETAIL' && storeData.deliveryEnabled
        ? 'RETAIL with delivery but no city pricing in data - recommend customer contact store for quote.'
        : ''
  ]
    .filter(Boolean)
    .join('\n')

  // Contact info
  const contactInfo = [
    storeData.phone ? `Phone: ${storeData.phone}` : '',
    storeData.email ? `Email: ${storeData.email}` : '',
    storeData.whatsappNumber ? `WhatsApp: ${storeData.whatsappNumber}` : '',
    storeData.website ? `Website: ${storeData.website}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  // How user receives updates (order/booking confirmation)
  const notificationInfo: string[] = []
  if (storeData.whatsappDirectNotifications) {
    notificationInfo.push('Updates via WhatsApp: The business receives your order/booking directly on WhatsApp.')
  } else {
    notificationInfo.push('Updates via WhatsApp: After submitting, you get a link to send your order/booking to the business on WhatsApp.')
  }
  if (storeData.orderNotificationsEnabled && storeData.orderNotificationEmail) {
    notificationInfo.push('The business also receives email notifications.')
  }
  const notificationStr = notificationInfo.length ? notificationInfo.join(' ') : 'Order/booking sent to business via WhatsApp.'

  const paymentMethodsStr = storeData.paymentMethods?.length ? storeData.paymentMethods.join(', ') : 'Cash, Card'
  const paymentInfo = storeData.paymentInstructions
    ? `${paymentMethodsStr}. ${storeData.paymentInstructions}`
    : paymentMethodsStr

  // Ordering/booking instructions - business-type-specific
  let orderingInstructions: string
  if (isSalon) {
    orderingInstructions =
      '1) Browse services. 2) Tap a service to open the detail modal. 3) Add to booking. 4) Choose date, time' +
      (storeData.showStaffSelection ? ', and optionally staff' : '') +
      '. 5) Fill in contact info. 6) Submit - your booking is sent to the business. 7) ' +
      notificationStr
  } else if (isServices) {
    const hasAppointment = storeData.serviceAllowAppointmentBooking !== false
    const hasRequestForm = storeData.serviceAllowRequestByEmail || storeData.serviceAllowRequestByWhatsApp
    if (hasAppointment && hasRequestForm) {
      orderingInstructions =
        'Two options: A) Book appointment online (like a salon) - pick service, date, time, contact. B) Request a quote via the form - fill in service interest, message, preferred contact (Email or WhatsApp). Submit - ' +
        notificationStr
    } else if (hasAppointment) {
      orderingInstructions =
        '1) Browse services. 2) Add to booking. 3) Choose date, time, contact. 4) Submit - ' + notificationStr
    } else if (hasRequestForm) {
      orderingInstructions =
        'Request form: Fill in your details, service(s) of interest, message, and preferred contact (Email or WhatsApp). Submit - the business will respond via your chosen channel.'
    } else {
      orderingInstructions = 'Book or request services via the storefront. ' + notificationStr
    }
  } else if (isRetail) {
    orderingInstructions =
      '1) Browse products. 2) Tap to open detail modal. 3) Add to cart. 4) Fill in delivery: country, city, postal code (postal/shipping service - city-specific fee). 5) Submit - ' +
      notificationStr
  } else if (isRestaurantGroceryCafe) {
    orderingInstructions =
      '1) Browse products. 2) Tap to open detail modal. 3) Add to cart. 4) Choose delivery/pickup/dine-in. For delivery: enter address (autocomplete detects your zone for fee). 5) Submit - ' +
      notificationStr
  } else {
    orderingInstructions =
      '1) Browse products. 2) Tap to open detail modal. 3) Add to cart. 4) Fill in delivery/pickup info. 5) Submit - ' +
      notificationStr
  }

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
  const productCountNote = storeData.productCountNote ? `\n${storeData.productCountNote}\n` : ''

  const salonSection =
    isSalon && (storeData.slotDuration || storeData.appointmentBufferMinutes || storeData.showStaffSelection)
      ? `
SALON BOOKING:
- Slot duration: ${storeData.slotDuration ?? 30} minutes
- Buffer between appointments: ${storeData.appointmentBufferMinutes ?? 15} minutes
- Staff selection: ${storeData.showStaffSelection ? 'Yes' : 'No'}
- Service duration shown: ${storeData.showServiceDuration ? 'Yes' : 'No'}
`
      : ''

  const servicesSection =
    isServices && (storeData.serviceAllowRequestByEmail || storeData.serviceAllowRequestByWhatsApp)
      ? `
SERVICES REQUEST OPTIONS:
- Request by email: ${storeData.serviceAllowRequestByEmail ? 'Yes' : 'No'}
- Request by WhatsApp: ${storeData.serviceAllowRequestByWhatsApp ? 'Yes' : 'No'}
- User chooses preferred contact (Email or WhatsApp) for response
`
      : ''

  const bizTypeNote =
    storeData.businessType === 'RETAIL'
      ? 'RETAIL: Delivery uses POSTAL SERVICE + city-specific pricing. Customer enters country, city, postal code. Do NOT use restaurant logic (zones, address autocomplete).'
      : ['RESTAURANT', 'CAFE', 'GROCERY'].includes(storeData.businessType)
        ? 'RESTAURANT/CAFE/GROCERY: Delivery uses ADDRESS AUTOCOMPLETE + distance zones. Fee depends on zone. Do NOT use retail/postal logic.'
        : storeData.businessType === 'SALON'
          ? 'SALON: No delivery. BOOKING ONLY. Services with time slots.'
          : storeData.businessType === 'SERVICES'
            ? 'SERVICES: Can have appointment booking AND/OR request form (email/WhatsApp). Check which options are enabled.'
            : ''

  return `You are a helpful assistant for ${storeData.name}, a ${storeData.businessType} business on WaveOrder.
You answer customer questions about the store's products, services, hours, delivery options, ordering process, and how to receive updates.

=== BUSINESS TYPE: ${storeData.businessType} ===
${bizTypeNote}

STORE INFORMATION:
- Name: ${storeData.name}
- Description: ${storeData.description || 'N/A'}
- Address: ${storeData.address || 'Not specified'}
- Type: ${storeData.businessType}
- Currency: ${storeData.currency}
- Language: ${lang}

CONTACT:
${contactInfo || 'Contact info not specified'}

BUSINESS HOURS:
${hoursStr}
Status: ${openStatus}

DELIVERY & ORDERING:
${deliveryInfo}
Payment methods: ${paymentInfo}

HOW YOU RECEIVE UPDATES:
${notificationStr}

HOW TO ORDER: ${orderingInstructions}
${salonSection}
${servicesSection}

${sectionTitle}:${productCountNote}
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
- FORMATTING: When listing products or services, use clear bullet points. Format each item on its own line with a dash, e.g. "- Product Name: EUR 10" or "- Service Name: EUR 20 (30 min)". Put a blank line before the list if it follows introductory text. Do not run multiple items together on one line.
- If asked how to order or book, explain: ${orderingInstructions}
- Keep answers concise (2-3 sentences unless more detail is requested).
- Never make up information not provided in the store data.
- Do not discuss competitor stores or other businesses.
- CRITICAL for delivery: Use ONLY the delivery fee and time from the data above. If city-specific or zone data exists, use it. Do NOT assume values (e.g. "30-45 min" or "free delivery" unless in data).
- If asked about delivery to a city/location NOT in the data: say "I don't have pricing for that area. Please contact the store directly for a quote."
- If data is missing or unclear: say "For the most accurate information, I recommend confirming with the store via WhatsApp or phone."
- Do NOT echo or confirm incorrect information from the user. If they state something wrong (e.g. "I heard delivery is 30 min"), correct it using the data.
- When asked how to contact or receive updates, use the CONTACT and HOW YOU RECEIVE UPDATES sections.

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
        phone: true,
        email: true,
        website: true,
        whatsappNumber: true,
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
        freeDeliveryText: true,
        estimatedDeliveryTime: true,
        estimatedPickupTime: true,
        deliveryTimeText: true,
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
        serviceAllowRequestByWhatsApp: true,
        orderNotificationsEnabled: true,
        orderNotificationEmail: true,
        whatsappDirectNotifications: true,
        slotDuration: true,
        appointmentBufferMinutes: true,
        showStaffSelection: true,
        showServiceDuration: true
      }
    })

    if (!business || !business.aiAssistantEnabled) {
      return NextResponse.json({ error: 'Store not found or AI assistant not enabled' }, { status: 404 })
    }

    // Plan gating: Pro, Business, or SuperAdmin override (aiAssistantEnabled already implies access)
    // No additional plan check - SuperAdmin can enable for any plan

    const businessIds = [business.id]

    // For RETAIL: fetch city-specific postal pricing (fee + delivery time per city)
    let postalPricing: Array<{ cityName: string; price: number; deliveryTime?: string | null; deliveryTimeEl?: string | null }> = []
    if (business.businessType === 'RETAIL') {
      const postal = await prisma.postalPricing.findMany({
        where: { businessId: business.id, deletedAt: null, type: 'normal' },
        select: { cityName: true, price: true, deliveryTime: true, deliveryTimeEl: true },
        take: 100
      })
      postalPricing = postal.map((p) => ({
        cityName: p.cityName,
        price: p.price,
        deliveryTime: p.deliveryTime,
        deliveryTimeEl: p.deliveryTimeEl
      }))
    }

    // For RESTAURANT/CAFE/GROCERY: fetch delivery zones (distance-based fee)
    let deliveryZones: Array<{ name: string; maxDistance: number; fee: number }> = []
    if (['RESTAURANT', 'CAFE', 'GROCERY'].includes(business.businessType)) {
      const zones = await prisma.deliveryZone.findMany({
        where: { businessId: business.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { name: true, maxDistance: true, fee: true }
      })
      deliveryZones = zones.map((z) => ({ name: z.name, maxDistance: z.maxDistance, fee: z.fee }))
    }

    const productWhere = {
      businessId: { in: businessIds },
      isActive: true,
      price: { gt: 0 }
    }
    const productSelect = {
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
    } as const

    const totalProductCount = await prisma.product.count({ where: productWhere })

    let products
    let productCountNote: string | undefined

    if (totalProductCount <= 200) {
      products = await prisma.product.findMany({
        where: productWhere,
        select: productSelect,
        take: totalProductCount
      })
    } else {
      const categories = await prisma.category.findMany({
        where: { businessId: business.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true }
      })
      const SAMPLES_PER_CATEGORY = 15
      const MAX_SAMPLED_PRODUCTS = 300
      const productPromises = categories.map((cat) =>
        prisma.product.findMany({
          where: { ...productWhere, categoryId: cat.id },
          select: productSelect,
          take: SAMPLES_PER_CATEGORY,
          orderBy: { name: 'asc' }
        })
      )
      const categoryProductArrays = await Promise.all(productPromises)
      products = categoryProductArrays.flat().slice(0, MAX_SAMPLED_PRODUCTS)
      productCountNote = `This store has ${totalProductCount} products. Below is a representative sample by category. For specific product requests, suggest browsing by category on the storefront.`
    }

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
      phone: business.phone ?? null,
      email: business.email ?? null,
      website: business.website ?? null,
      whatsappNumber: business.whatsappNumber ?? undefined,
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
      freeDeliveryText: business.freeDeliveryText ?? null,
      estimatedDeliveryTime: business.estimatedDeliveryTime ?? undefined,
      estimatedPickupTime: business.estimatedPickupTime ?? undefined,
      deliveryTimeText: business.deliveryTimeText ?? undefined,
      deliveryRadius: business.deliveryRadius ?? undefined,
      shippingCountries: business.shippingCountries ?? undefined,
      paymentMethods: business.paymentMethods as string[] | undefined,
      paymentInstructions: business.paymentInstructions ?? null,
      allowOnlineBooking: business.allowOnlineBooking ?? true,
      serviceAllowAppointmentBooking: business.serviceAllowAppointmentBooking ?? true,
      serviceAllowRequestByEmail: business.serviceAllowRequestByEmail ?? false,
      serviceAllowRequestByWhatsApp: business.serviceAllowRequestByWhatsApp ?? false,
      orderNotificationsEnabled: business.orderNotificationsEnabled ?? false,
      orderNotificationEmail: business.orderNotificationEmail ?? null,
      whatsappDirectNotifications: business.whatsappDirectNotifications ?? false,
      slotDuration: business.slotDuration ?? null,
      appointmentBufferMinutes: business.appointmentBufferMinutes ?? null,
      showStaffSelection: business.showStaffSelection ?? false,
      showServiceDuration: business.showServiceDuration ?? true,
      products: productList,
      productCountNote,
      postalPricing: postalPricing.length > 0 ? postalPricing : undefined,
      deliveryZones: deliveryZones.length > 0 ? deliveryZones : undefined
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
    const [, assistantMsg] = await prisma.$transaction([
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
      tokensUsed,
      messageId: assistantMsg.id
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    )
  }
}
