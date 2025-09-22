// src/app/api/admin/stores/[businessId]/customers/[customerId]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, customerId } = await params

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

    // Verify customer belongs to this business
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId
      }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get customer orders with item count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: customerId,
          businessId: businessId
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
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
      prisma.order.count({
        where: {
          customerId: customerId,
          businessId: businessId
        }
      })
    ])

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      discount: order.discount,
      itemCount: order._count.items,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        productName: item.product.name,
        variantName: item.variant?.name
      }))
    }))

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}