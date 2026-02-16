// app/api/admin/stores/[businessId]/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true, currency: true }
    })

    if (business?.businessType !== 'SALON') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const date = searchParams.get('date') || ''
    const staffId = searchParams.get('staffId') || ''

    const skip = (page - 1) * limit

    const whereClause: any = {
      businessId: businessId
    }

    if (search.trim()) {
      whereClause.OR = [
        { order: { orderNumber: { contains: search.trim(), mode: 'insensitive' } } },
        { order: { customer: { name: { contains: search.trim(), mode: 'insensitive' } } } },
        { order: { customer: { phone: { contains: search.trim() } } } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      whereClause.appointmentDate = {
        gte: startDate,
        lte: endDate
      }
    }

    if (staffId) {
      whereClause.staffId = staffId
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              customerName: true,
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
        },
        orderBy: {
          appointmentDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.appointment.count({ where: whereClause })
    ])

    return NextResponse.json({
      appointments: appointments.map(apt => ({
        id: apt.id,
        orderId: apt.orderId,
        orderNumber: apt.order.orderNumber,
        customerName: apt.order.customerName || apt.order.customer.name || '',
        customerPhone: apt.order.customer.phone,
        customerEmail: apt.order.customer.email,
        customerId: apt.customerId,
        staffId: apt.staffId,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        duration: apt.duration,
        status: apt.status,
        notes: apt.notes,
        total: apt.order.total,
        serviceName: apt.order.items[0]?.product?.name || 'Service',
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      currency: business?.currency || 'USD'
    })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })

    if (business?.businessType !== 'SALON') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    // Get business owner's plan to check staff assignment restrictions
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'

    const body = await request.json()
    
    // Check if staff assignment is attempted on STARTER plan
    if (body.staffId && userPlan === 'STARTER') {
      return NextResponse.json({ 
        message: 'Staff assignment is only available on Pro or Business plans. Please upgrade to assign team members to appointments.',
        code: 'STAFF_ASSIGNMENT_NOT_AVAILABLE',
        plan: userPlan
      }, { status: 403 })
    }
    
    // Create appointment requires an order first
    // For now, we'll assume the order is created separately
    // This endpoint can be used to create appointments linked to existing orders
    
    const appointment = await prisma.appointment.create({
      data: {
        orderId: body.orderId,
        businessId,
        customerId: body.customerId || null,
        staffId: body.staffId || null,
        appointmentDate: new Date(body.appointmentDate),
        startTime: body.startTime,
        endTime: body.endTime,
        duration: body.duration,
        status: body.status || 'REQUESTED',
        notes: body.notes || null
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
