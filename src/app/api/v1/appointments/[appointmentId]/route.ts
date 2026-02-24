// src/app/api/v1/appointments/[appointmentId]/route.ts
/**
 * Public API v1: Individual appointment endpoint (for SALON businesses)
 * GET - Get single appointment
 * PUT - Update appointment (requires appointments:write scope)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest, addRateLimitHeaders } from '@/lib/api-auth'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

// ===========================================
// GET - Get Single Appointment
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
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

    const { appointmentId } = await params

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId: auth.businessId
      },
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
                    price: true,
                    serviceDuration: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const response = NextResponse.json({ appointment })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Appointment GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

// ===========================================
// PUT - Update Appointment
// ===========================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiRequest(request, 'appointments:write')
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

    const { appointmentId } = await params
    const body = await request.json()

    // Verify appointment exists and belongs to this business
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId: auth.businessId
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Fetch existing appointment details for calculations
    const existingAppointmentDetails = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { startTime: true, duration: true, appointmentDate: true }
    })

    // Update appointment
    const updateData: any = {}
    let newAppointmentDate = existingAppointment.appointmentDate
    let newStartTime = existingAppointmentDetails?.startTime || '09:00'
    let newDuration = existingAppointmentDetails?.duration || 30

    if (body.appointmentDate !== undefined) {
      newAppointmentDate = new Date(body.appointmentDate)
      updateData.appointmentDate = newAppointmentDate
    }
    if (body.startTime !== undefined) {
      newStartTime = body.startTime
      updateData.startTime = newStartTime
    }
    if (body.duration !== undefined) {
      newDuration = body.duration
      updateData.duration = newDuration
    }

    // Recalculate endTime based on startTime and duration
    const [hours, minutes] = newStartTime.split(':').map(Number)
    const startDateTime = new Date(newAppointmentDate)
    startDateTime.setHours(hours, minutes, 0, 0)
    const endDateTime = new Date(startDateTime.getTime() + newDuration * 60000)
    updateData.endTime = endDateTime.toTimeString().slice(0, 5)
    updateData.appointmentDate = startDateTime // Update appointmentDate with time

    if (body.status !== undefined) updateData.status = body.status
    if (body.staffId !== undefined) updateData.staffId = body.staffId

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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

    // If status changed, also update linked order status
    if (body.status && body.status !== existingAppointment.status) {
      if (existingAppointment.orderId) {
        await prisma.order.update({
          where: { id: existingAppointment.orderId },
          data: { status: body.status }
        })
      }
    }

    // Log appointment status change if status was updated
    if (body.status && body.status !== existingAppointment.status) {
      const ipAddress = extractIPAddress(request)
      const userAgent = request.headers.get('user-agent') || undefined
      const referrer = request.headers.get('referer') || undefined
      
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
      const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
      
      logSystemEvent({
        logType: 'appointment_created', // Use same log type for status changes
        severity: 'info',
        businessId: auth.businessId,
        endpoint: '/api/v1/appointments/[appointmentId]',
        method: 'PUT',
        statusCode: 200,
        ipAddress,
        userAgent,
        referrer,
        url: actualUrl,
        metadata: {
          appointmentId: appointment.id,
          orderId: appointment.orderId,
          previousStatus: existingAppointment.status,
          newStatus: body.status,
          statusChanged: true,
          updatedViaApi: true,
          apiKeyId: auth.id,
          staffId: appointment.staffId || null,
          appointmentDate: appointment.appointmentDate.toISOString()
        }
      })
    }

    const response = NextResponse.json({ appointment })
    return addRateLimitHeaders(response, auth.id)

  } catch (error) {
    console.error('API v1 Appointment PUT error:', error)
    
    // Log appointment update error
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
    
    // Try to get auth info for error logging
    let businessId: string | undefined
    let apiKeyId: string | undefined
    try {
      const authResult = await authenticateApiRequest(request, 'appointments:write')
      if (!(authResult instanceof NextResponse)) {
        businessId = authResult.auth.businessId
        apiKeyId = authResult.auth.id
      }
    } catch {
      // Ignore auth errors in error logging
    }
    
    logSystemEvent({
      logType: 'appointment_error',
      severity: 'error',
      businessId: businessId,
      endpoint: '/api/v1/appointments/[appointmentId]',
      method: 'PUT',
      statusCode: 500,
      ipAddress,
      userAgent,
      referrer,
      url: actualUrl,
      errorMessage: error instanceof Error ? error.message : 'Failed to update appointment',
      errorStack: error instanceof Error ? error.stack : undefined,
      metadata: {
        appointmentId: (await params).appointmentId,
        updatedViaApi: true,
        apiKeyId: apiKeyId || null
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
