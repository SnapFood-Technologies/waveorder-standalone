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
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    images: true,
                    price: true,
                    serviceDuration: true
                  }
                },
                modifiers: {
                  select: {
                    id: true,
                    name: true,
                    price: true
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

    const body = await request.json()

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
            }
          }
        }
      }
    })

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
