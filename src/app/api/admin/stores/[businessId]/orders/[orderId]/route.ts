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

    case 'PICKED_UP':
      // PICKED_UP only applies to PICKUP and DINE_IN orders
      if (orderType === 'DELIVERY') {
        return false
      }
      if (orderType === 'PICKUP') {
        return business.notifyPickupOnDelivered ?? business.notifyCustomerOnDelivered ?? true
      }
      if (orderType === 'DINE_IN') {
        return business.notifyDineInOnDelivered ?? business.notifyCustomerOnDelivered ?? true
      }
      return business.notifyCustomerOnDelivered ?? true

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
        createdByAdmin: true,
        customerName: true, // Include stored customer name
        deliveryAddress: true,
        deliveryTime: true,
        notes: true,
        paymentStatus: true,
        paymentMethod: true,
        customerLatitude: true,
        customerLongitude: true,
        whatsappMessageId: true,
        postalPricingId: true,
        createdAt: true,
        updatedAt: true,
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
                images: true,
                modifiers: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    required: true
                  }
                }
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
            language: true,
            translateContentToBusinessLanguage: true,
            timeFormat: true,
            // Notification settings for WhatsApp modal control
            customerNotificationEnabled: true,
            notifyPickupOnConfirmed: true,
            notifyPickupOnPreparing: true,
            notifyPickupOnReady: true,
            notifyDeliveryOnConfirmed: true,
            notifyDeliveryOnPreparing: true,
            notifyDeliveryOnOutForDelivery: true,
            notifyDineInOnConfirmed: true,
            notifyDineInOnPreparing: true,
            notifyDineInOnReady: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Fetch modifier details for each item
    const itemsWithModifiers = await Promise.all(
      order.items.map(async (item) => {
        let modifierDetails: Array<{ id: string; name: string; price: number; required: boolean }> = []
        
        if (item.modifiers && item.modifiers.length > 0) {
          // Get all modifier IDs from this item
          const modifierIds = item.modifiers.filter((id): id is string => typeof id === 'string')
          
          if (modifierIds.length > 0) {
            // Fetch modifier details from product's modifiers
            modifierDetails = item.product.modifiers.filter(mod => modifierIds.includes(mod.id))
          }
        }
        
        return {
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          modifiers: modifierDetails,
          product: item.product,
          variant: item.variant
        }
      })
    )

    // Fetch postal pricing details if postalPricingId exists
    let postalPricing = null
    if (order.postalPricingId) {
      try {
        // @ts-ignore - PostalPricing model will be available after Prisma generate
        const allPostalPricing = await (prisma as any).postalPricing.findMany({
          where: {
            id: order.postalPricingId,
            businessId: businessId
          },
          include: {
            postal: {
              select: {
                id: true,
                name: true,
                nameAl: true,
                deliveryTime: true,
                deliveryTimeAl: true
              }
            }
          }
        })

        // Filter out deleted records (deletedAt is null or undefined)
        const foundPostalPricing = allPostalPricing.find((p: any) => !p.deletedAt || p.deletedAt === null)
        
        if (foundPostalPricing) {
          postalPricing = {
            name: foundPostalPricing.postal?.name || 'Postal Service',
            nameAl: foundPostalPricing.postal?.nameAl || null,
            deliveryTime: foundPostalPricing.deliveryTime || foundPostalPricing.postal?.deliveryTime || null,
            deliveryTimeAl: foundPostalPricing.deliveryTimeAl || foundPostalPricing.postal?.deliveryTimeAl || null,
            price: foundPostalPricing.price
          }
        }
      } catch (error) {
        console.error('Error fetching postal pricing:', error)
        // Continue without postal pricing if there's an error
      }
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
        customer: {
          id: order.customer.id,
          name: order.customerName && order.customerName.trim() !== '' 
            ? order.customerName.trim()
            : (order.customer.name || ''),
          phone: order.customer.phone,
          email: order.customer.email,
          addressJson: order.customer.addressJson,
          tier: order.customer.tier
        },
        items: itemsWithModifiers,
        deliveryAddress: order.deliveryAddress,
        deliveryTime: order.deliveryTime,
        notes: order.notes,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerLatitude: order.customerLatitude,
        customerLongitude: order.customerLongitude,
        whatsappMessageId: order.whatsappMessageId,
        postalPricingId: order.postalPricingId,
        postalPricing: postalPricing,
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

    const validateStatusTransition = (currentStatus: string, newStatus: string, orderType: string): boolean => {
      // Base transitions that apply to all order types
      const baseTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['READY', 'CANCELLED'],
        CANCELLED: ['REFUNDED'],
        REFUNDED: [],
        PICKED_UP: ['REFUNDED'], // PICKED_UP is final, can only refund
        DELIVERED: ['REFUNDED'] // DELIVERED is final, can only refund
      }

      // Order-type-specific transitions for READY
      if (currentStatus === 'READY') {
        if (orderType === 'PICKUP' || orderType === 'DINE_IN') {
          // For pickup/dine-in: READY → PICKED_UP or CANCELLED
          return ['PICKED_UP', 'CANCELLED'].includes(newStatus) || currentStatus === newStatus
        } else if (orderType === 'DELIVERY') {
          // For delivery: READY → OUT_FOR_DELIVERY, DELIVERED, or CANCELLED
          return ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(newStatus) || currentStatus === newStatus
        }
      }

      // OUT_FOR_DELIVERY only applies to DELIVERY orders
      if (currentStatus === 'OUT_FOR_DELIVERY') {
        return ['DELIVERED', 'CANCELLED'].includes(newStatus) || currentStatus === newStatus
      }

      // Check base transitions
      return baseTransitions[currentStatus]?.includes(newStatus) || currentStatus === newStatus
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
      if (!validateStatusTransition(existingOrder.status, body.status, existingOrder.type)) {
        return NextResponse.json({ 
          message: `Cannot change status from ${existingOrder.status} to ${body.status} for ${existingOrder.type} order` 
        }, { status: 400 })
      }
      updateData.status = body.status
      
      // Automatically set pickup time to now when status changes to PICKED_UP (for PICKUP/DINE_IN orders)
      if (body.status === 'PICKED_UP' && (existingOrder.type === 'PICKUP' || existingOrder.type === 'DINE_IN')) {
        // Only set time if it's not already set and not being explicitly provided in the request
        if (!existingOrder.deliveryTime && body.deliveryTime === undefined) {
          updateData.deliveryTime = new Date()
        }
      }
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

    // Only set deliveryTime from body if it's explicitly provided AND we haven't auto-set it for PICKED_UP status
    if (body.deliveryTime !== undefined && !updateData.deliveryTime) {
      updateData.deliveryTime = body.deliveryTime ? new Date(body.deliveryTime) : null
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        deliveryAddress: true,
        deliveryTime: true,
        // @ts-ignore - postalPricingId field will be available after Prisma generate
        postalPricingId: true,
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
            language: true,
            translateContentToBusinessLanguage: true,
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
            notifyDineInOnDelivered: true,
            // Admin notification settings
            orderNotificationsEnabled: true,
            orderNotificationEmail: true,
            notifyAdminOnPickedUpAndPaid: true,
            notifyAdminOnStatusUpdates: true,
            email: true,
            businessType: true
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
    }) as any

    // Send customer email notification if status changed and settings allow it
    if (body.status && body.status !== existingOrder.status && updatedOrder.customer.email) {
      try {
        // Get notification setting for this status and order type
        const shouldNotify = shouldNotifyCustomer(updatedOrder.business, body.status, updatedOrder.type)
        
        if (shouldNotify) {
          // Fetch postal pricing details if postalPricingId exists (for RETAIL businesses)
          let fetchedPostalPricing = null
          if (updatedOrder.business.businessType === 'RETAIL' && (updatedOrder as any).postalPricingId) {
            try {
              // @ts-ignore - PostalPricing model will be available after Prisma generate
              const allPostalPricing = await (prisma as any).postalPricing.findMany({
                where: {
                  id: (updatedOrder as any).postalPricingId,
                  businessId: businessId
                },
                include: {
                  postal: {
                    select: {
                      id: true,
                      name: true,
                      nameAl: true,
                      deliveryTime: true,
                      deliveryTimeAl: true
                    }
                  }
                }
              })

              // Filter out deleted records (deletedAt is null or undefined)
              const foundPostalPricing = allPostalPricing.find((p: any) => !p.deletedAt || p.deletedAt === null)
              
              if (foundPostalPricing) {
                fetchedPostalPricing = {
                  name: foundPostalPricing.postal?.name || 'Postal Service',
                  nameAl: foundPostalPricing.postal?.nameAl || null,
                  deliveryTime: foundPostalPricing.deliveryTime || foundPostalPricing.postal?.deliveryTime || null,
                  deliveryTimeAl: foundPostalPricing.deliveryTimeAl || foundPostalPricing.postal?.deliveryTimeAl || null,
                  price: foundPostalPricing.price
                }
              }
            } catch (error) {
              console.error('Error fetching postal pricing for customer email:', error)
              // Continue without postal pricing if there's an error
            }
          }
          
          // Prepare postal pricing details for RETAIL businesses
          let postalPricingDetails = null
          let countryCode = null
          let city = null
          let postalCode = null
          
          if (updatedOrder.business.businessType === 'RETAIL' && fetchedPostalPricing) {
            // Get localized postal service name
            const language = updatedOrder.business.language || 'en'
            const postalName = (language === 'sq' || language === 'al') && fetchedPostalPricing.nameAl 
              ? fetchedPostalPricing.nameAl 
              : fetchedPostalPricing.name || 'Postal Service'
            
            // Get localized delivery time
            const postalDeliveryTime = (language === 'sq' || language === 'al') && fetchedPostalPricing.deliveryTimeAl
              ? fetchedPostalPricing.deliveryTimeAl
              : fetchedPostalPricing.deliveryTime || null
            
            postalPricingDetails = {
              name: postalName,
              nameEn: fetchedPostalPricing.name || 'Postal Service',
              nameAl: fetchedPostalPricing.nameAl || null,
              deliveryTime: postalDeliveryTime,
              price: fetchedPostalPricing.price || 0
            }
            
            // Extract country/city/postalCode from deliveryAddress for RETAIL
            // Format: "Address, City, Country Code, Postal Code"
            if (updatedOrder.deliveryAddress) {
              const addressParts = updatedOrder.deliveryAddress.split(',').map((p: string) => p.trim())
              if (addressParts.length >= 3) {
                city = addressParts[addressParts.length - 3] || null
                countryCode = addressParts[addressParts.length - 2] || null
                postalCode = addressParts[addressParts.length - 1] || null
              }
            }
            
            // Also check customer's addressJson if available
            // First, fetch the full customer data with addressJson
            try {
              const fullCustomer = await prisma.customer.findUnique({
                where: { id: updatedOrder.customer.id },
                select: { addressJson: true }
              })
              
              if (fullCustomer?.addressJson && !city) {
                try {
                  const addressJson = typeof fullCustomer.addressJson === 'string'
                    ? JSON.parse(fullCustomer.addressJson)
                    : fullCustomer.addressJson
                  city = city || addressJson.city || null
                  countryCode = countryCode || addressJson.country || null
                  postalCode = postalCode || addressJson.zipCode || null
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            } catch (e) {
              // Ignore errors when fetching customer data
            }
          }
          
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
              language: updatedOrder.business.language || 'en',
              translateContentToBusinessLanguage: updatedOrder.business.translateContentToBusinessLanguage ?? true,
              businessType: updatedOrder.business.businessType || undefined,
              items: updatedOrder.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant?.name || null
              })),
              postalPricingDetails: postalPricingDetails,
              countryCode: countryCode,
              city: city,
              postalCode: postalCode
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

    // Send admin status update notification if enabled and status changed
    if (body.status && body.status !== existingOrder.status && updatedOrder.business.notifyAdminOnStatusUpdates) {
      try {
        // Get notification setting for this status and order type (same logic as customer)
        const shouldNotify = shouldNotifyCustomer(updatedOrder.business, body.status, updatedOrder.type)
        
        if (shouldNotify && updatedOrder.business.orderNotificationsEnabled && updatedOrder.business.orderNotificationEmail) {
          // Import the order notification service
          const { sendOrderNotification } = await import('@/lib/orderNotificationService')
          
          // Send admin notification (don't await to avoid blocking response)
          sendOrderNotification(
            {
              id: updatedOrder.id,
              orderNumber: updatedOrder.orderNumber,
              status: body.status,
              type: updatedOrder.type,
              total: updatedOrder.total,
              deliveryAddress: updatedOrder.deliveryAddress,
              notes: updatedOrder.notes,
              customer: {
                name: updatedOrder.customer.name,
                phone: updatedOrder.customer.phone
              },
              items: updatedOrder.items.map(item => ({
                product: { name: item.product.name },
                variant: item.variant ? { name: item.variant.name } : null,
                quantity: item.quantity,
                price: item.price
              })),
              businessId: businessId
            },
            {
              name: updatedOrder.business.name,
              orderNotificationsEnabled: updatedOrder.business.orderNotificationsEnabled,
              orderNotificationEmail: updatedOrder.business.orderNotificationEmail,
              email: updatedOrder.business.email,
              currency: updatedOrder.business.currency,
              businessType: updatedOrder.business.businessType || 'RESTAURANT',
              language: updatedOrder.business.language || 'en'
            },
            false // isNewOrder = false (this is a status update notification)
          ).catch((error) => {
            // Log error but don't fail the request
            console.error('Failed to send admin status update notification:', error)
          })
        }
      } catch (error) {
        // Log error but don't fail the request
        console.error('Error sending admin status update notification:', error)
      }
    }

    // Send admin notification when customer picks up and pays
    // This happens when:
    // 1. Order status is READY or DELIVERED AND payment is PAID
    // 2. Either status changed to READY/DELIVERED (with payment already PAID) OR payment changed to PAID (with status already READY/DELIVERED)
    if (updatedOrder.paymentStatus === 'PAID' && 
        (updatedOrder.status === 'READY' || updatedOrder.status === 'DELIVERED')) {
      
      const paymentJustPaid = body.paymentStatus === 'PAID' && existingOrder.paymentStatus !== 'PAID'
      const statusJustChanged = body.status && 
                                body.status !== existingOrder.status &&
                                (body.status === 'READY' || body.status === 'DELIVERED') &&
                                existingOrder.paymentStatus === 'PAID'
      
      // Only send notification if this is a transition (not already in this state)
      if (paymentJustPaid || statusJustChanged) {
        try {
          // Import the order notification service
          const { sendOrderNotification } = await import('@/lib/orderNotificationService')
          
          // Check if admin notifications are enabled AND the specific setting for picked up and paid is enabled (defaults to true)
          // Since default is true, we check if it's not explicitly false
          if (updatedOrder.business.orderNotificationsEnabled && 
              (updatedOrder.business.notifyAdminOnPickedUpAndPaid ?? true)) {
            // Send admin notification (don't await to avoid blocking response)
            sendOrderNotification(
              {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                type: updatedOrder.type,
                total: updatedOrder.total,
                deliveryAddress: updatedOrder.deliveryAddress,
                notes: updatedOrder.notes,
                customer: {
                  name: updatedOrder.customer.name,
                  phone: updatedOrder.customer.phone
                },
                items: updatedOrder.items.map(item => ({
                  product: { name: item.product.name },
                  variant: item.variant ? { name: item.variant.name } : null,
                  quantity: item.quantity,
                  price: item.price
                })),
                businessId: businessId
              },
              {
                name: updatedOrder.business.name,
                orderNotificationsEnabled: updatedOrder.business.orderNotificationsEnabled,
                orderNotificationEmail: updatedOrder.business.orderNotificationEmail,
                email: updatedOrder.business.email,
                currency: updatedOrder.business.currency,
                businessType: updatedOrder.business.businessType || 'RESTAURANT',
                language: updatedOrder.business.language || 'en'
              },
              false // isNewOrder = false (this is an update notification)
            ).catch((error) => {
              // Log error but don't fail the request
              console.error('Failed to send admin notification for picked up and paid:', error)
            })
          }
        } catch (error) {
          // Log error but don't fail the request
          console.error('Error sending admin notification for picked up and paid:', error)
        }
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