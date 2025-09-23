// src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params

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

    // Get order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId: businessId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            addressJson: true,
            tier: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                images: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        business: {
          select: {
            name: true,
            currency: true,
            whatsappNumber: true,
            businessType: true,
            language: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        tax: order.tax,
        discount: order.discount,
        customer: order.customer,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers,
          product: item.product,
          variant: item.variant
        })),
        deliveryAddress: order.deliveryAddress,
        deliveryTime: order.deliveryTime,
        notes: order.notes,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerLatitude: order.customerLatitude,
        customerLongitude: order.customerLongitude,
        whatsappMessageId: order.whatsappMessageId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      },
      business: order.business
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params

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


    const validateStatusTransition = (currentStatus: string, newStatus: string): boolean => {
        const validTransitions: Record<string, string[]> = {
          PENDING: ['CONFIRMED', 'CANCELLED'],
          CONFIRMED: ['PREPARING', 'CANCELLED'],
          PREPARING: ['READY', 'CANCELLED'],
          READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
          OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'], // Allow cancellation during delivery
          DELIVERED: ['REFUNDED'], // Allow refund after delivery
          CANCELLED: ['REFUNDED'], // Only refund allowed after cancellation
          REFUNDED: [] // Final state - no changes allowed
        }
      
        return validTransitions[currentStatus]?.includes(newStatus) || currentStatus === newStatus
      }

    const body = await request.json()

    // Verify order exists and belongs to business
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId: businessId
      },
      include: {
        customer: true,
        business: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Status update with validation
    if (body.status && body.status !== existingOrder.status) {
        if (!validateStatusTransition(existingOrder.status, body.status)) {
          return NextResponse.json({ 
            message: `Cannot change status from ${existingOrder.status} to ${body.status}` 
          }, { status: 400 })
        }
        updateData.status = body.status
    }

    // Payment status update
    if (body.paymentStatus && body.paymentStatus !== existingOrder.paymentStatus) {
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
      
      if (!validPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json({ message: 'Invalid payment status' }, { status: 400 })
      }

      updateData.paymentStatus = body.paymentStatus
    }

    // Notes update
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    // Delivery time update
    if (body.deliveryTime !== undefined) {
      updateData.deliveryTime = body.deliveryTime ? new Date(body.deliveryTime) : null
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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

    // Create order notification record for status changes
    // TODO: maybe in the future we support self - notifications for admins that change their business order status
    // if (updateData.status && updateData.status !== existingOrder.status) {
    //   await prisma.orderNotification.create({
    //     data: {
    //       businessId: businessId,
    //       orderId: orderId,
    //       orderNumber: existingOrder.orderNumber,
    //       orderStatus: updateData.status,
    //       customerName: existingOrder.customer.name,
    //       total: existingOrder.total,
    //       notifiedAt: new Date(),
    //       emailSent: false // Will be updated when notification service sends email
    //     }
    //   })
    // }

    return NextResponse.json({
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        notes: updatedOrder.notes,
        deliveryTime: updatedOrder.deliveryTime,
        updatedAt: updatedOrder.updatedAt
      },
      message: 'Order updated successfully'
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params

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

    // Verify order exists and belongs to business
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId: businessId
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Check if order can be deleted (business logic)
    if (['DELIVERED', 'PAID'].includes(order.status) || ['PAID'].includes(order.paymentStatus)) {
      return NextResponse.json({ 
        message: 'Cannot delete completed or paid orders. Consider marking as cancelled or refunded instead.' 
      }, { status: 400 })
    }

    // Delete order (this will cascade delete order items due to schema constraints)
    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ 
      message: 'Order deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}