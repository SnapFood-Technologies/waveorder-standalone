// src/app/api/admin/stores/[businessId]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const customerId = searchParams.get('customer') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      businessId: businessId
    }

    if (search.trim()) {
      whereClause.OR = [
        { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
        { customer: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { customer: { phone: { contains: search.trim() } } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (type) {
      whereClause.type = type
    }

    if (customerId) {
      whereClause.customerId = customerId
    }

    // Get orders with customer info and item counts
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
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
                  name: true
                }
              },
              variant: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ])

    // Get customer order counts for all customers in this result set
    const customerIds = [...new Set(orders.map(order => order.customer.id))]
    const customerOrderCounts = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        businessId: businessId
      },
      _count: {
        id: true
      }
    })

    // Create a map for quick lookup
    const orderCountMap = customerOrderCounts.reduce((acc, item) => {
      acc[item.customerId] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Get business currency for formatting
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { currency: true }
    })

    return NextResponse.json({
      orders: orders.map(order => {
        const customerOrderCount = orderCountMap[order.customer.id] || 1
        const isFirstOrder = customerOrderCount === 1

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          type: order.type,
          total: order.total,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          customer: {
            ...order.customer,
            isFirstOrder,
            orderCount: customerOrderCount
          },
          itemCount: order._count.items,
          items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            productName: item.product.name,
            variantName: item.variant?.name || null
          })),
          deliveryAddress: order.deliveryAddress,
          notes: order.notes,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      currency: business?.currency || 'USD'
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    // Validation
    if (!body.customerId?.trim()) {
      return NextResponse.json({ message: 'Customer is required' }, { status: 400 })
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ message: 'At least one item is required' }, { status: 400 })
    }

    if (!body.type || !['DELIVERY', 'PICKUP', 'DINE_IN'].includes(body.type)) {
      return NextResponse.json({ message: 'Valid order type is required' }, { status: 400 })
    }

    // Verify customer exists and belongs to business
    const customer = await prisma.customer.findFirst({
      where: {
        id: body.customerId,
        businessId: businessId
      }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Get business for order number format
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { orderNumberFormat: true, currency: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Validate items exist and calculate totals
    let calculatedSubtotal = 0
    const validatedItems = []

    for (const item of body.items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          businessId: businessId
        },
        include: {
          variants: true
        }
      })

      if (!product) {
        return NextResponse.json({ 
          message: `Product not found: ${item.productId}` 
        }, { status: 400 })
      }

      let itemPrice = product.price
      let variant = null

      // If variant is specified, validate and get variant price
      if (item.variantId) {
        variant = product.variants.find(v => v.id === item.variantId)
        if (!variant) {
          return NextResponse.json({ 
            message: `Variant not found: ${item.variantId}` 
          }, { status: 400 })
        }
        itemPrice = variant.price
      }

      const itemTotal = itemPrice * item.quantity
      calculatedSubtotal += itemTotal

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: itemPrice,
        modifiers: item.modifiers || []
      })
    }

    // Calculate delivery fee if needed
    let deliveryFee = 0
    if (body.type === 'DELIVERY' && body.deliveryFee !== undefined) {
      deliveryFee = parseFloat(body.deliveryFee) || 0
    }

    const tax = parseFloat(body.tax) || 0
    const discount = parseFloat(body.discount) || 0
    const total = calculatedSubtotal + deliveryFee + tax - discount

    // Generate order number
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const orderNumber = business.orderNumberFormat.replace('{number}', `${timestamp}${random}`)

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: body.status || 'PENDING',
        type: body.type,
        customerId: body.customerId,
        businessId: businessId,
        subtotal: calculatedSubtotal,
        deliveryFee,
        tax,
        discount,
        total,
        deliveryAddress: body.deliveryAddress || null,
        deliveryTime: body.deliveryTime ? new Date(body.deliveryTime) : null,
        notes: body.notes || null,
        paymentMethod: body.paymentMethod || null,
        paymentStatus: body.paymentStatus || 'PENDING',
        customerLatitude: body.customerLatitude || null,
        customerLongitude: body.customerLongitude || null
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    })

    // Create order items
    for (const item of validatedItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ...item
        }
      })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        customer: order.customer,
        createdAt: order.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}