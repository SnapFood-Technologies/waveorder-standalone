// app/api/admin/stores/[businessId]/appointments/[appointmentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'
import { sendAppointmentStatusEmail } from '@/lib/customer-email-notification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; appointmentId: string }> }
) {
  try {
    const { businessId, appointmentId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                addressJson: true
              }
            },
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                modifiers: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    images: true,
                    price: true,
                    serviceDuration: true
                  }
                }
              }
            }
          }
        },
        business: {
          select: {
            name: true,
            currency: true,
            phone: true,
            address: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; appointmentId: string }> }
) {
  try {
    const { businessId, appointmentId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Get business owner's plan to check staff assignment restrictions
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'

    const body = await request.json()
    
    // Check if staff assignment is attempted on STARTER plan
    if (body.staffId !== undefined && body.staffId !== null && userPlan === 'STARTER') {
      return NextResponse.json({ 
        message: 'Staff assignment is only available on Pro or Business plans. Please upgrade to assign team members to appointments.',
        code: 'STAFF_ASSIGNMENT_NOT_AVAILABLE',
        plan: userPlan
      }, { status: 403 })
    }

    // Fetch existing appointment to check status change
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { status: true, orderId: true }
    })

    const appointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
        businessId
      },
      data: {
        staffId: body.staffId !== undefined ? body.staffId : undefined,
        appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
        duration: body.duration,
        status: body.status,
        notes: body.notes !== undefined ? body.notes : undefined
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
                    serviceDuration: true
                  }
                }
              }
            },
            business: {
              select: { enableAffiliateSystem: true, currency: true }
            }
          }
        }
      }
    })

    // Handle affiliate commission creation if appointment status changed to COMPLETED
    if (body.status && 
        body.status !== existingAppointment?.status && 
        body.status === 'COMPLETED' &&
        appointment.order?.affiliateId &&
        appointment.order.business.enableAffiliateSystem &&
        appointment.order.paymentStatus === 'PAID') {
      try {
        // Check if commission already exists
        const existingCommission = await prisma.affiliateEarning.findUnique({
          where: { orderId: appointment.order.id }
        })

        if (!existingCommission) {
          // Get affiliate details
          const affiliate = await prisma.affiliate.findUnique({
            where: { id: appointment.order.affiliateId },
            select: {
              id: true,
              commissionType: true,
              commissionValue: true
            }
          })

          if (affiliate) {
            // Calculate commission
            let commissionAmount = 0
            if (affiliate.commissionType === 'PERCENTAGE') {
              commissionAmount = appointment.order.total * (affiliate.commissionValue / 100)
            } else {
              // FIXED
              commissionAmount = affiliate.commissionValue
            }

            // Create affiliate earning
            await prisma.affiliateEarning.create({
              data: {
                businessId,
                orderId: appointment.order.id,
                affiliateId: affiliate.id,
                orderTotal: appointment.order.total,
                commissionType: affiliate.commissionType,
                commissionValue: affiliate.commissionValue,
                amount: commissionAmount,
                currency: appointment.order.business.currency || 'EUR',
                status: 'PENDING',
                orderCompletedAt: new Date()
              }
            })
          }
        }
      } catch (error) {
        // Silently fail - commission creation shouldn't break appointment update
        console.error('Error creating affiliate commission for appointment:', error)
      }
    }

    // Cancel affiliate commission if appointment is cancelled
    if (body.status && 
        body.status !== existingAppointment?.status && 
        body.status === 'CANCELLED' &&
        appointment.order?.affiliateId) {
      try {
        await prisma.affiliateEarning.updateMany({
          where: {
            orderId: appointment.order.id,
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        })
      } catch (error) {
        console.error('Error cancelling affiliate commission:', error)
      }
    }

    // Log appointment status change if status was updated
    if (body.status && body.status !== existingAppointment?.status) {
      const ipAddress = extractIPAddress(request)
      const userAgent = request.headers.get('user-agent') || undefined
      const referrer = request.headers.get('referer') || undefined
      
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
      const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
      
      logSystemEvent({
        logType: 'appointment_status_changed',
        severity: 'info',
        businessId: businessId,
        endpoint: '/api/admin/stores/[businessId]/appointments/[appointmentId]',
        method: 'PUT',
        statusCode: 200,
        ipAddress,
        userAgent,
        referrer,
        url: actualUrl,
        metadata: {
          appointmentId: appointment.id,
          orderId: appointment.orderId,
          previousStatus: existingAppointment?.status || null,
          newStatus: body.status,
          statusChanged: true,
          updatedByAdmin: true,
          updatedBy: access.session.user.id,
          staffId: appointment.staffId || null,
          appointmentDate: appointment.appointmentDate.toISOString()
        }
      })

      // Send email notification for appointment status changes (CONFIRMED, COMPLETED, CANCELLED)
      const notifiableStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED']
      if (notifiableStatuses.includes(body.status) && appointment.order?.customer?.email) {
        try {
          // Fetch business details for email
          const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: {
              name: true,
              address: true,
              phone: true,
              currency: true,
              language: true,
              customerNotificationEnabled: true
            }
          })

          if (business?.customerNotificationEnabled) {
            sendAppointmentStatusEmail(
              {
                name: appointment.order.customer.name || '',
                email: appointment.order.customer.email
              },
              {
                orderNumber: appointment.order.orderNumber || appointment.orderId,
                status: body.status,
                total: appointment.order.total || 0,
                businessName: business.name,
                businessAddress: business.address,
                businessPhone: business.phone,
                currency: business.currency || 'EUR',
                language: business.language || 'en',
                items: appointment.order.items?.map((item: any) => ({
                  name: item.product?.name || 'Service',
                  quantity: item.quantity || 1,
                  price: item.price || 0,
                  variant: null
                })) || [],
                appointmentDate: appointment.appointmentDate?.toISOString() || null,
                startTime: appointment.startTime || null
              }
            ).catch((emailError) => {
              console.error('Failed to send appointment status email:', emailError)
            })
          }
        } catch (emailError) {
          console.error('Error preparing appointment status email:', emailError)
        }
      }
    }

    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Error updating appointment:', error)
    
    // Log appointment update error
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
    
    logSystemEvent({
      logType: 'appointment_error',
      severity: 'error',
      businessId: (await params).businessId,
      endpoint: '/api/admin/stores/[businessId]/appointments/[appointmentId]',
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
        updatedByAdmin: true,
        updatedBy: (await checkBusinessAccess((await params).businessId)).session?.user.id || null
      }
    })
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; appointmentId: string }> }
) {
  try {
    const { businessId, appointmentId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    await prisma.appointment.delete({
      where: {
        id: appointmentId,
        businessId
      }
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })

  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
