// app/api/storefront/[slug]/track/route.ts
// Product event tracking API - tracks views and add-to-cart events
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Valid event types
const VALID_EVENT_TYPES = ['view', 'add_to_cart'] as const
type EventType = typeof VALID_EVENT_TYPES[number]

// Valid sources
const VALID_SOURCES = ['product_card', 'product_modal', 'search', 'featured', 'category', 'related'] as const
type EventSource = typeof VALID_SOURCES[number]

interface TrackEventRequest {
  productId: string
  eventType: EventType
  sessionId?: string
  source?: EventSource
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Parse request body
    let body: TrackEventRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { productId, eventType, sessionId, source } = body

    // Validate required fields
    if (!productId || !eventType) {
      return NextResponse.json(
        { error: 'productId and eventType are required' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(eventType as EventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate source if provided
    if (source && !VALID_SOURCES.includes(source as EventSource)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
        { status: 400 }
      )
    }

    // Find business by slug (lightweight query)
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, isActive: true }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    if (!business.isActive) {
      return NextResponse.json(
        { error: 'Business is not active' },
        { status: 403 }
      )
    }

    // Verify product exists and belongs to this business
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId: business.id,
        isActive: true
      },
      select: { id: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Create the event (fire-and-forget style - don't block on this)
    await prisma.productEvent.create({
      data: {
        businessId: business.id,
        productId: product.id,
        eventType,
        sessionId: sessionId || null,
        source: source || null
      }
    })

    // Return success immediately
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error tracking product event:', error)
    // Don't expose internal errors to client
    // Return success anyway to not affect user experience
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  }
}

// Support batch tracking for multiple events at once
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Parse request body
    let body: { events: TrackEventRequest[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { events } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400 }
      )
    }

    // Limit batch size to prevent abuse
    if (events.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 events per batch' },
        { status: 400 }
      )
    }

    // Find business by slug
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, isActive: true }
    })

    if (!business || !business.isActive) {
      return NextResponse.json(
        { success: true }, // Silent fail for batch
        { status: 200 }
      )
    }

    // Filter and validate events
    const validEvents = events.filter(event => 
      event.productId && 
      event.eventType && 
      VALID_EVENT_TYPES.includes(event.eventType as EventType)
    )

    if (validEvents.length === 0) {
      return NextResponse.json(
        { success: true, tracked: 0 },
        { status: 200 }
      )
    }

    // Get all product IDs to verify they exist
    const productIds = [...new Set(validEvents.map(e => e.productId))]
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        businessId: business.id,
        isActive: true
      },
      select: { id: true }
    })
    const existingProductIds = new Set(existingProducts.map(p => p.id))

    // Create events for valid products only
    const eventsToCreate = validEvents
      .filter(event => existingProductIds.has(event.productId))
      .map(event => ({
        businessId: business.id,
        productId: event.productId,
        eventType: event.eventType,
        sessionId: event.sessionId || null,
        source: event.source || null
      }))

    if (eventsToCreate.length > 0) {
      await prisma.productEvent.createMany({
        data: eventsToCreate
      })
    }

    return NextResponse.json(
      { success: true, tracked: eventsToCreate.length },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error batch tracking product events:', error)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  }
}
