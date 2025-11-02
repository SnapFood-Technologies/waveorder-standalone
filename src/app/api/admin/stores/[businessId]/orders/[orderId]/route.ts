// src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'
import { sendCustomerOrderStatusEmail } from '@/lib/customer-email-notification'
import * as Sentry from '@sentry/nextjs'

const prisma = new PrismaClient()

/**
 * Check if customer should be notified for this status based on business settings
 * Takes into account order type (DELIVERY, PICKUP, DINE_IN)
 */
function shouldNotifyCustomer(business: any, status: string, orderType: string): boolean {
  // Customer notifications must be enabled globally
  if (!business.customerNotificationEnabled) {
    return false
  }

  // Use order-type-specific setting if available, otherwise fall back to global setting
  switch (status) {
    case 'CONFIRMED':
      if (orderType === 'DELIVERY') {
        return business.notifyDeliveryOnConfirmed ?? business.notifyCustomerOnConfirmed ?? false
      }
      if (orderType === 'PICKUP') {
        return business.notifyPickupOnConfirmed ?? business.notifyCustomerOnConfirmed ?? false
      }
      if (orderType === 'DINE_IN') {
        return business.notifyDineInOnConfirmed ?? business.notifyCustomerOnConfirmed ?? false
      }
      return business.notifyCustomerOnConfirmed ?? false

    case 'PREPARING':
      if (orderType === 'DELIVERY') {
        return business.notifyDeliveryOnPreparing ?? business.notifyCustomerOnPreparing ?? false
      }
      if (orderType === 'PICKUP') {
        return business.notifyPickupOnPreparing ?? business.notifyCustomerOnPreparing ?? false
      }
      if (orderType === 'DINE_IN') {
        return business.notifyDineInOnPreparing ?? business.notifyCustomerOnPreparing ?? false
      }
      return business.notifyCustomerOnPreparing ?? false

    case 'READY':
      // READY doesn't apply to DELIVERY (they use OUT_FOR_DELIVERY instead)
      if (orderType === 'DELIVERY') {
        return false
      }
      if (orderType === 'PICKUP') {
        return business.notifyPickupOnReady ?? business.notifyCustomerOnReady ?? true
      }
      if (orderType === 'DINE_IN') {
        return business.notifyDineInOnReady ?? business.notifyCustomerOnReady ?? true
      }
      return business.notifyCustomerOnReady ?? true

    case 'OUT_FOR_DELIVERY':
      // OUT_FOR_DELIVERY only applies to DELIVERY orders
      if (orderType !== 'DELIVERY') {
        return false
      }
      return business.notifyDeliveryOnOutForDelivery ?? business.notifyCustomerOnOutForDelivery ?? true

    case 'DELIVERED':
      if (orderType === 'DELIVERY') {
        return business.notifyDeliveryOnDelivered ?? business.notifyCustomerOnDelivered ?? true
      }
      if (orderType === 'PICKUP') {
        return business.notifyPickupOnDelivered ?? business.notifyCustomerOnDelivered ?? true
      }
      if (orderType === 'DINE_IN') {
        return business.notifyDineInOnDelivered ?? business.notifyCustomerOnDelivered ?? true
      }
      return business.notifyCustomerOnDelivered ?? true

    case 'CANCELLED':
      // Cancellation applies to all order types globally
      return business.notifyCustomerOnCancelled ?? true

    default:
      return false
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const { businessId, orderId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

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
        createdByAdmin: order.createdByAdmin,
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
    const { businessId, orderId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Set Sentry context for impersonation tracking
    if (access.isImpersonating) {
      Sentry.setTag('impersonating', 'true')
      Sentry.setTag('impersonated_business_id', businessId)
    }

    const validateStatusTransition = (currentStatus: string, newStatus: string): boolean => {
      const validTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['READY', 'CANCELLED'],
        READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
        OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
        DELIVERED: ['REFUNDED'],
        CANCELLED: ['REFUNDED'],
        REFUNDED: []
      }
    
      return validTransitions[currentStatus]?.includes(newStatus) || currentStatus === newStatus
    }

    const body = await request.json()

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

    const updateData: any = {}

    if (body.status && body.status !== existingOrder.status) {
      if (!validateStatusTransition(existingOrder.status, body.status)) {
        return NextResponse.json({ 
          message: `Cannot change status from ${existingOrder.status} to ${body.status}` 
        }, { status: 400 })
      }
      updateData.status = body.status
    }

    if (body.paymentStatus && body.paymentStatus !== existingOrder.paymentStatus) {
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
      
      if (!validPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json({ message: 'Invalid payment status' }, { status: 400 })
      }

      updateData.paymentStatus = body.paymentStatus
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.deliveryTime !== undefined) {
      updateData.deliveryTime = body.deliveryTime ? new Date(body.deliveryTime) : null
    }

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
        },
        business: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            currency: true,
            customerNotificationEnabled: true,
            notifyCustomerOnConfirmed: true,
            notifyCustomerOnPreparing: true,
            notifyCustomerOnReady: true,
            notifyCustomerOnOutForDelivery: true,
            notifyCustomerOnDelivered: true,
            notifyCustomerOnCancelled: true,
            // Order-type specific settings
            notifyDeliveryOnConfirmed: true,
            notifyDeliveryOnPreparing: true,
            notifyDeliveryOnOutForDelivery: true,
            notifyDeliveryOnDelivered: true,
            notifyPickupOnConfirmed: true,
            notifyPickupOnPreparing: true,
            notifyPickupOnReady: true,
            notifyPickupOnDelivered: true,
            notifyDineInOnConfirmed: true,
            notifyDineInOnPreparing: true,
            notifyDineInOnReady: true,
            notifyDineInOnDelivered: true
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
        }
      }
    })

    // Send customer email notification if status changed and settings allow it
    if (body.status && body.status !== existingOrder.status && updatedOrder.customer.email) {
      try {
        // Get notification setting for this status and order type
        const shouldNotify = shouldNotifyCustomer(updatedOrder.business, body.status, updatedOrder.type)
        
        if (shouldNotify) {
          // Send email notification (don't await to avoid blocking response)
          sendCustomerOrderStatusEmail(
            {
              name: updatedOrder.customer.name,
              email: updatedOrder.customer.email
            },
            {
              orderNumber: updatedOrder.orderNumber,
              status: body.status,
              type: updatedOrder.type,
              total: updatedOrder.total,
              deliveryAddress: updatedOrder.deliveryAddress,
              deliveryTime: updatedOrder.deliveryTime || undefined,
              businessName: updatedOrder.business.name,
              businessAddress: updatedOrder.business.address || undefined,
              businessPhone: updatedOrder.business.phone || undefined,
              currency: updatedOrder.business.currency,
              items: updatedOrder.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant?.name || null
              }))
            }
          ).catch((error) => {
            // Log error but don't fail the request
            Sentry.captureException(error, {
              tags: {
                operation: 'send_customer_email_notification',
                orderId: orderId,
                status: body.status,
              },
              extra: {
                businessId,
                customerId: updatedOrder.customer.id,
                orderNumber: updatedOrder.orderNumber,
              },
            })
            console.error('Failed to send customer email notification:', error)
          })
        }
      } catch (error) {
        // Log error but don't fail the request
        Sentry.captureException(error, {
          tags: {
            operation: 'customer_notification_check',
            orderId: orderId,
          },
          extra: {
            businessId,
            status: body.status,
          },
        })
        console.error('Error checking customer notification settings:', error)
      }
    }

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
  { params }: { params: Promise<{ businessId: string, orderId: string }> }
) {
  try {
    const { businessId, orderId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: { items: { include: { product: true, variant: true } } }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    for (const item of order.items) {
      if (item.variantId && item.variant) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } }
        })

        await prisma.inventoryActivity.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            businessId,
            type: 'RETURN',
            quantity: item.quantity,
            oldStock: item.variant.stock,
            newStock: item.variant.stock + item.quantity,
            reason: `Order deleted - ${order.orderNumber}`,
            changedBy: access.session.user.id
          }
        })
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        })

        await prisma.inventoryActivity.create({
          data: {
            productId: item.productId,
            businessId,
            type: 'RETURN',
            quantity: item.quantity,
            oldStock: item.product.stock,
            newStock: item.product.stock + item.quantity,
            reason: `Order deleted - ${order.orderNumber}`,
            changedBy: access.session.user.id
          }
        })
      }
    }

    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}