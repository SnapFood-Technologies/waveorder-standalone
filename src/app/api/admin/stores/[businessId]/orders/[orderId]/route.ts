// src/app/api/admin/stores/[businessId]/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { sendCustomerOrderStatusEmail } from '@/lib/customer-email-notification'
import * as Sentry from '@sentry/nextjs'


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
        invoiceType: true, // Invoice/Receipt selection (for Greek storefronts)
        invoiceAfm: true, // Tax ID (AFM) - 9 digits
        invoiceCompanyName: true, // Company name
        invoiceTaxOffice: true, // Tax office (ΔΟΥ)
        paymentStatus: true,
        paymentMethod: true,
        customerLatitude: true,
        customerLongitude: true,
        whatsappMessageId: true,
        postalPricingId: true,
        deliveryPersonId: true,
        createdAt: true,
        updatedAt: true,
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
            storefrontLanguage: true,
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
      order.items.map(async (item: {
        id: string;
        quantity: number;
        price: number;
        modifiers?: string[] | null;
        product: {
          id: string;
          name: string;
          description: string | null;
          images: string[];
          modifiers: Array<{ id: string; name: string; price: number; required: boolean }>;
        };
        variant: {
          id: string;
          name: string;
        } | null;
      }) => {
        let modifierDetails: Array<{ id: string; name: string; price: number; required: boolean }> = []
        
        if (item.modifiers && item.modifiers.length > 0) {
          // Get all modifier IDs from this item
          const modifierIds = item.modifiers.filter((id): id is string => typeof id === 'string')
          
          if (modifierIds.length > 0) {
            // Fetch modifier details from product's modifiers
            modifierDetails = item.product.modifiers.filter((mod: { id: string; name: string; price: number; required: boolean }) => modifierIds.includes(mod.id))
          }
        }
        
        return {
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          originalPrice: (item as any).originalPrice || null,
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
                nameEl: true,
                deliveryTime: true,
                deliveryTimeAl: true,
                deliveryTimeEl: true
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
            nameEl: foundPostalPricing.postal?.nameEl || null,
            deliveryTime: foundPostalPricing.deliveryTime || foundPostalPricing.postal?.deliveryTime || null,
            deliveryTimeAl: foundPostalPricing.deliveryTimeAl || foundPostalPricing.postal?.deliveryTimeAl || null,
            deliveryTimeEl: foundPostalPricing.deliveryTimeEl || foundPostalPricing.postal?.deliveryTimeEl || null,
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
        CANCELLED: ['REFUNDED'], // Cancelled before delivery, can refund directly
        RETURNED: ['REFUNDED'], // Product returned, now refund money
        REFUNDED: [], // Final status
        PICKED_UP: ['RETURNED', 'REFUNDED'], // Can return product or refund directly
        DELIVERED: ['RETURNED', 'REFUNDED'] // Can return product or refund directly
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

      // Automatically update payment status when order is canceled
      if (body.status === 'CANCELLED') {
        // Only auto-update if payment status is not explicitly being changed in the request
        if (!body.paymentStatus) {
          const currentPaymentStatus = existingOrder.paymentStatus || 'PENDING'
          
          if (currentPaymentStatus === 'PENDING') {
            // Payment was never captured, mark as failed
            updateData.paymentStatus = 'FAILED'
          } else if (currentPaymentStatus === 'PAID') {
            // Payment was already captured, mark as refunded (admin should process actual refund)
            updateData.paymentStatus = 'REFUNDED'
          }
          // If already FAILED or REFUNDED, leave as is
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

    // Invoice fields (only for INVOICE type orders)
    if (body.invoiceAfm !== undefined) {
      updateData.invoiceAfm = body.invoiceAfm || null
    }
    if (body.invoiceCompanyName !== undefined) {
      updateData.invoiceCompanyName = body.invoiceCompanyName || null
    }
    if (body.invoiceTaxOffice !== undefined) {
      updateData.invoiceTaxOffice = body.invoiceTaxOffice || null
    }

    // Only set deliveryTime from body if it's explicitly provided AND we haven't auto-set it for PICKED_UP status
    if (body.deliveryTime !== undefined && !updateData.deliveryTime) {
      updateData.deliveryTime = body.deliveryTime ? new Date(body.deliveryTime) : null
    }

    // Check if order has delivery person before update
    const orderBeforeUpdate = await prisma.order.findFirst({
      where: { id: orderId },
      select: {
        deliveryPersonId: true,
        deliveryFee: true,
        type: true
      }
    })

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

    // Handle delivery earning when order is delivered (only if feature enabled)
    // Create affiliate commission when order is completed (DELIVERED/PICKED_UP + PAID)
    if (updatedOrder.affiliateId && 
        updatedOrder.paymentStatus === 'PAID' && 
        (updatedOrder.status === 'DELIVERED' || updatedOrder.status === 'PICKED_UP')) {
      
      // Check if affiliate system is enabled and commission doesn't already exist
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { enableAffiliateSystem: true, currency: true }
      })

      if (business?.enableAffiliateSystem) {
        try {
          // Check if commission already exists
          const existingCommission = await prisma.affiliateEarning.findUnique({
            where: { orderId: updatedOrder.id }
          })

          if (!existingCommission) {
            // Get affiliate details
            const affiliate = await prisma.affiliate.findUnique({
              where: { id: updatedOrder.affiliateId },
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
                commissionAmount = updatedOrder.total * (affiliate.commissionValue / 100)
              } else {
                // FIXED
                commissionAmount = affiliate.commissionValue
              }

              // Create affiliate earning
              await prisma.affiliateEarning.create({
                data: {
                  businessId,
                  orderId: updatedOrder.id,
                  affiliateId: affiliate.id,
                  orderTotal: updatedOrder.total,
                  commissionType: affiliate.commissionType,
                  commissionValue: affiliate.commissionValue,
                  amount: commissionAmount,
                  currency: business.currency || 'EUR',
                  status: 'PENDING',
                  orderCompletedAt: new Date()
                }
              })
            }
          }
        } catch (error) {
          // Silently fail - commission creation shouldn't break order update
          console.error('Error creating affiliate commission:', error)
        }
      }
    }

    // Cancel affiliate commission if order is cancelled or refunded
    if ((updatedOrder.status === 'CANCELLED' || updatedOrder.status === 'REFUNDED') && 
        (existingOrder.status !== 'CANCELLED' && existingOrder.status !== 'REFUNDED')) {
      try {
        await prisma.affiliateEarning.updateMany({
          where: {
            orderId: updatedOrder.id,
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        })
      } catch (error) {
        // Silently fail
        console.error('Error cancelling affiliate commission:', error)
      }
    }

    if (body.status === 'DELIVERED' && updatedOrder.type === 'DELIVERY' && orderBeforeUpdate?.deliveryPersonId) {
      // Check if delivery management is enabled
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { enableDeliveryManagement: true }
      })

      if (business?.enableDeliveryManagement) {
        try {
        // Check if earning already exists
        const existingEarning = await prisma.deliveryEarning.findUnique({
          where: { orderId }
        })

        if (existingEarning) {
          // Update existing earning
          await prisma.deliveryEarning.update({
            where: { id: existingEarning.id },
            data: {
              deliveredAt: new Date(),
              status: 'PENDING' // Keep as PENDING until payment is made
            }
          })
        } else {
          // Create new earning
          await prisma.deliveryEarning.create({
            data: {
              businessId,
              orderId,
              deliveryPersonId: orderBeforeUpdate.deliveryPersonId,
              amount: orderBeforeUpdate.deliveryFee || 0,
              currency: updatedOrder.business.currency || 'EUR',
              status: 'PENDING',
              deliveredAt: new Date()
            }
          })
        }
        } catch (error) {
          console.error('Error creating/updating delivery earning:', error)
          // Don't fail the order update if earning creation fails
        }
      }
    }

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
                      nameEl: true,
                      deliveryTime: true,
                      deliveryTimeAl: true,
                      deliveryTimeEl: true
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
                  nameEl: foundPostalPricing.postal?.nameEl || null,
                  deliveryTime: foundPostalPricing.deliveryTime || foundPostalPricing.postal?.deliveryTime || null,
                  deliveryTimeAl: foundPostalPricing.deliveryTimeAl || foundPostalPricing.postal?.deliveryTimeAl || null,
                  deliveryTimeEl: foundPostalPricing.deliveryTimeEl || foundPostalPricing.postal?.deliveryTimeEl || null,
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
            const isAlbanian = language === 'sq' || language === 'al'
            const isGreek = language === 'el'
            const postalName = isAlbanian && fetchedPostalPricing.nameAl 
              ? fetchedPostalPricing.nameAl 
              : isGreek && fetchedPostalPricing.nameEl
                ? fetchedPostalPricing.nameEl
                : fetchedPostalPricing.name || 'Postal Service'
            
            // Get localized delivery time
            const postalDeliveryTime = isAlbanian && fetchedPostalPricing.deliveryTimeAl
              ? fetchedPostalPricing.deliveryTimeAl
              : isGreek && fetchedPostalPricing.deliveryTimeEl
                ? fetchedPostalPricing.deliveryTimeEl
                : fetchedPostalPricing.deliveryTime || null
            
            postalPricingDetails = {
              name: postalName,
              nameEn: fetchedPostalPricing.name || 'Postal Service',
              nameAl: fetchedPostalPricing.nameAl || null,
              nameEl: fetchedPostalPricing.nameEl || null,
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
              items: updatedOrder.items.map((item: { product: { name: string }; variant: { name: string } | null; quantity: number; price: number; originalPrice?: number | null }) => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                originalPrice: item.originalPrice || null,
                variant: item.variant?.name || null
              })),
              postalPricingDetails: postalPricingDetails,
              countryCode: countryCode,
              city: city,
              postalCode: postalCode,
              invoiceType: (updatedOrder as any).invoiceType || undefined // Invoice/Receipt selection (for Greek storefronts)
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
              items: updatedOrder.items.map((item: { product: { name: string }; variant: { name: string } | null; quantity: number; price: number; originalPrice?: number | null }) => ({
                product: { name: item.product.name },
                variant: item.variant ? { name: item.variant.name } : null,
                quantity: item.quantity,
                price: item.price,
                originalPrice: item.originalPrice || null
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
                items: updatedOrder.items.map((item: { product: { name: string }; variant: { name: string } | null; quantity: number; price: number }) => ({
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

    // TODO: Sync stock changes to OmniStack Gateway if order status update affects stock
    // If order status changes affect inventory (e.g., cancellation restores stock, delivery decrements stock),
    // we should sync the updated product/variant stock back to OmniStack
    // This ensures OmniStack stays in sync with WaveOrder inventory changes from order status updates
    // See: /api/admin/stores/[businessId]/products/[productId]/inventory/route.ts for reference implementation

    // TODO: Sync order status update to ByBest Shop
    // When order status is updated, we should sync the status change to ByBest Shop
    // This ensures ByBest Shop stays in sync with WaveOrder order status updates
    // import { syncOrderToByBestShop } from '@/lib/bybestshop';
    // syncOrderToByBestShop(updatedOrder).catch(err => {
    //   console.error('[ByBestShop] Order status sync failed:', err);
    // });

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