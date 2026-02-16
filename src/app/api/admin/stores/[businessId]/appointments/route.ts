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
      select: { 
        businessType: true,
        orderNumberFormat: true
      }
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

    // Validate required fields
    if (!body.services || body.services.length === 0) {
      return NextResponse.json({ message: 'At least one service is required' }, { status: 400 })
    }

    if (!body.appointmentDate || !body.startTime) {
      return NextResponse.json({ message: 'Appointment date and time are required' }, { status: 400 })
    }

    // Handle customer creation/retrieval
    let customerId: string
    let customerName: string = ''

    if (body.customerId) {
      customerId = body.customerId
      
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId: businessId
        },
        select: {
          id: true,
          name: true
        }
      })

      if (!customer) {
        return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
      }
      
      customerName = customer.name || ''
    } else if (body.newCustomer) {
      const newCustomerData = body.newCustomer

      if (!newCustomerData.name?.trim() || !newCustomerData.phone?.trim()) {
        return NextResponse.json({ message: 'Customer name and phone are required' }, { status: 400 })
      }

      // Check if customer already exists by phone
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          businessId: businessId,
          phone: newCustomerData.phone.trim()
        }
      })

      if (existingCustomer) {
        customerId = existingCustomer.id
        customerName = newCustomerData.name.trim()
        
        // Update customer info if different
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: newCustomerData.name.trim(),
            email: newCustomerData.email?.trim() || existingCustomer.email
          }
        })
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            name: newCustomerData.name.trim(),
            phone: newCustomerData.phone.trim(),
            email: newCustomerData.email?.trim() || null,
            businessId: businessId,
            tier: newCustomerData.tier || 'REGULAR',
            addedByAdmin: true
          }
        })

        customerId = newCustomer.id
        customerName = newCustomerData.name.trim()
      }
    } else {
      return NextResponse.json({ message: 'Customer information is required' }, { status: 400 })
    }

    // Create order items from services
    const orderItems = []
    let subtotal = 0

    for (const serviceItem of body.services) {
      const product = await prisma.product.findFirst({
        where: {
          id: serviceItem.serviceId,
          businessId: businessId,
          isActive: true,
          isService: true
        }
      })

      if (!product) {
        return NextResponse.json({ message: `Service not found: ${serviceItem.serviceId}` }, { status: 404 })
      }

      const totalItemPrice = serviceItem.price
      subtotal += totalItemPrice

      orderItems.push({
        productId: serviceItem.serviceId,
        variantId: null,
        quantity: serviceItem.quantity,
        price: product.price,
        originalPrice: product.originalPrice,
        modifiers: []
      })
    }

    const total = subtotal
    const deliveryFee = 0 // Appointments don't have delivery fees

    // Generate order number
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const orderNumberFormat = business.orderNumberFormat || 'ORD-{number}'
    const orderNumber = orderNumberFormat.replace('{number}', `${timestamp}${random}`)

    // Create order first
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        type: 'DINE_IN', // Appointments are always dine-in
        customerId,
        businessId,
        customerName: customerName || 'Unknown',
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: null,
        deliveryTime: null,
        notes: body.notes || null,
        paymentMethod: body.paymentMethod || null,
        paymentStatus: 'PENDING',
        createdByAdmin: true,
        createdBy: access.session.user.id,
        items: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Create appointment linked to the order
    const appointmentDate = new Date(body.appointmentDate)
    const [hours, minutes] = body.startTime.split(':').map(Number)
    appointmentDate.setHours(hours, minutes, 0, 0)

    const appointment = await prisma.appointment.create({
      data: {
        orderId: order.id,
        businessId,
        customerId: customerId || null,
        staffId: body.staffId || null,
        appointmentDate: appointmentDate,
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

    return NextResponse.json({ 
      appointment: {
        id: appointment.id,
        orderId: appointment.orderId,
        orderNumber: appointment.order.orderNumber,
        customerId: appointment.customerId,
        staffId: appointment.staffId,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes
      }
    })

  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
