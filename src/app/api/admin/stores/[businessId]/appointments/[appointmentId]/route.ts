// app/api/admin/stores/[businessId]/appointments/[appointmentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

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

    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Error updating appointment:', error)
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
