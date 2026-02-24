// src/app/api/v1/appointments/route.ts
/**
 * Public API v1: Appointments endpoint (for SALON businesses)
 * GET - List appointments
 * POST - Create appointment (requires appointments:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

// ===========================================
// GET - List Appointments
// ===========================================
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'appointments:read')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true }
    })

    if (business?.businessType !== 'SALON' && business?.businessType !== 'SERVICES') {
      return NextResponse.json(
        { error: 'Appointments endpoint is only available for SALON businesses. Use /orders endpoint for other business types.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      businessId: auth.businessId
    }

    if (status) {
      where.status = status
    }

    if (from || to) {
      where.appointmentDate = {}
      if (from) {
        where.appointmentDate.gte = new Date(from)
      }
      if (to) {
        where.appointmentDate.lte = new Date(to)
      }
    }

    // Fetch appointments
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true
                }
              },
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true
                    }
                  }
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { appointmentDate: 'desc' }
      }),
      prisma.appointment.count({ where })
    ])

    const response = NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Appointments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// ===========================================
// POST - Create Appointment
// ===========================================
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'appointments:write')
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { auth } = authResult

  try {
    // Check if business is a salon
    const businessCheck = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { businessType: true, orderNumberFormat: true }
    })

    if (businessCheck?.businessType !== 'SALON' && businessCheck?.businessType !== 'SERVICES') {
      return NextResponse.json(
        { error: 'Appointments endpoint is only available for SALON businesses. Use /orders endpoint for other business types.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const { customerId, appointmentDate, items, startTime, duration } = body
    if (!customerId || !appointmentDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'customerId, appointmentDate, and items array are required' },
        { status: 400 }
      )
    }
    
    // startTime and duration are required, endTime will be calculated
    if (!startTime || !duration) {
      return NextResponse.json(
        { error: 'startTime and duration are required' },
        { status: 400 }
      )
    }

    // Verify customer belongs to this business
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId: auth.businessId }
    })
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      )
    }

    // Verify all services exist and belong to this business
    const serviceIds = items.map((item: any) => item.serviceId || item.productId).filter(Boolean)
    const services = await prisma.product.findMany({
      where: {
        id: { in: serviceIds },
        businessId: auth.businessId,
        isService: true
      }
    })

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'One or more services not found' },
        { status: 400 }
      )
    }

    // Calculate total
    let total = 0
    for (const item of items) {
      const serviceId = item.serviceId || item.productId
      const service = services.find(s => s.id === serviceId)
      if (service) {
        total += (item.price || service.price) * (item.quantity || 1)
      }
    }

    // Generate order number
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const orderNumberFormat = businessCheck?.orderNumberFormat || 'ORD-{number}'
    const orderNumber = orderNumberFormat.replace('{number}', `${timestamp}${random}`)

    // Calculate appointment date/time and end time
    const appointmentDateTime = new Date(appointmentDate)
    const [hours, minutes] = startTime.split(':').map(Number)
    appointmentDateTime.setHours(hours, minutes, 0, 0)
    
    // Calculate endTime from startTime + duration
    const appointmentEndDateTime = new Date(appointmentDateTime.getTime() + duration * 60000)
    const appointmentEndTime = appointmentEndDateTime.toTimeString().slice(0, 5) // HH:mm format

    // Create order first (appointments are linked to orders)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        businessId: auth.businessId,
        customerId,
        type: 'DINE_IN', // Appointments are always dine-in
        status: body.status || 'REQUESTED',
        paymentStatus: body.paymentStatus || 'PENDING',
        total,
        subtotal: total,
        deliveryFee: 0,
        notes: body.notes || null,
        customerName: customer.name || 'Unknown'
      }
    })

    // Create order items
    await Promise.all(
      items.map((item: any) => {
        const serviceId = item.serviceId || item.productId
        const service = services.find(s => s.id === serviceId)
        return prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: serviceId,
            quantity: item.quantity || 1,
            price: item.price || service?.price || 0
          }
        })
      })
    )

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId: auth.businessId,
        customerId,
        orderId: order.id,
        appointmentDate: appointmentDateTime,
        startTime: startTime,
        endTime: appointmentEndTime,
        duration: duration,
        status: body.status || 'REQUESTED',
        staffId: body.staffId || null,
        notes: body.notes || null
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    })

    // Log successful appointment creation
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
    
    logSystemEvent({
      logType: 'appointment_created',
      severity: 'info',
      businessId: auth.businessId,
      endpoint: '/api/v1/appointments',
      method: 'POST',
      statusCode: 201,
      ipAddress,
      userAgent,
      referrer,
      url: actualUrl,
      metadata: {
        appointmentId: appointment.id,
        orderId: appointment.orderId,
        customerId: appointment.customerId,
        staffId: appointment.staffId || null,
        appointmentDate: appointment.appointmentDate.toISOString(),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        status: appointment.status,
        createdViaApi: true,
        apiKeyId: auth.id
      }
    })

    const response = NextResponse.json({ appointment }, { status: 201 })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Appointments POST error:', error)
    
    // Log appointment creation error
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
    
    // Try to get businessId from auth if available
    let businessId: string | undefined
    try {
      const authResult = await authenticateApiRequest(request, 'appointments:write')
      if (!(authResult instanceof NextResponse)) {
        businessId = authResult.auth.businessId
      }
    } catch {
      // Ignore auth errors in error logging
    }
    
    logSystemEvent({
      logType: 'appointment_error',
      severity: 'error',
      businessId: businessId,
      endpoint: '/api/v1/appointments',
      method: 'POST',
      statusCode: 500,
      ipAddress,
      userAgent,
      referrer,
      url: actualUrl,
      errorMessage: error instanceof Error ? error.message : 'Failed to create appointment',
      errorStack: error instanceof Error ? error.stack : undefined,
      metadata: {
        createdViaApi: true
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
