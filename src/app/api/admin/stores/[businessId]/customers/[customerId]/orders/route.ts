// src/app/api/admin/stores/[businessId]/customers/[customerId]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const { businessId, customerId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: customerId,
          businessId: businessId
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          type: true,
          total: true,
          subtotal: true,
          deliveryFee: true,
          tax: true,
          discount: true,
          deliveryAddress: true,
          notes: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          customerName: true, // Include stored customer name
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