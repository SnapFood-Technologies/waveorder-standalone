// Resend Twilio order notification (SuperAdmin) - manual retry when initial send failed
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendOrderNotification as sendTwilioOrderNotification, isTwilioConfigured } from '@/lib/twilio'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', ALL: 'L', GBP: '£', BHD: 'BD', BBD: 'Bds$'
  }
  return symbols[currency] || '$'
}

/** GET: Preview the WhatsApp message that would be sent (content variables) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            whatsappNumber: true,
            whatsappDirectNotifications: true,
            businessType: true,
            language: true,
            timezone: true
          }
        },
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } }
          }
        }
      }
    })

    if (!order || !order.business) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    if (!order.business.whatsappDirectNotifications || !isTwilioConfigured()) {
      return NextResponse.json({ message: 'WhatsApp notifications not enabled for this business' }, { status: 400 })
    }

    if (!order.business.whatsappNumber?.trim()) {
      return NextResponse.json({ message: 'Business has no WhatsApp number configured' }, { status: 400 })
    }

    const business = order.business
    const isSalon = business.businessType === 'SALON' || business.businessType === 'SERVICES'

    let postalPricingDetailsForWhatsApp: any = null
    const orderPostalPricingId = (order as any).postalPricingId
    if (business.businessType === 'RETAIL' && orderPostalPricingId) {
      try {
        const postalPricing = await (prisma as any).postalPricing.findUnique({
          where: { id: orderPostalPricingId },
          include: {
            postal: {
              select: {
                name: true,
                nameEn: true,
                nameAl: true,
                nameEl: true,
                deliveryTime: true
              }
            }
          }
        })
        if (postalPricing) {
          postalPricingDetailsForWhatsApp = {
            name: postalPricing.postal?.name || 'Postal Service',
            nameEn: postalPricing.postal?.nameEn || postalPricing.postal?.name || 'Postal Service',
            nameAl: postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service',
            nameEl: postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service',
            deliveryTime: postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null,
            price: postalPricing.price
          }
        }
      } catch {
        // Ignore
      }
    }

    // Use order snapshot (customerName stored at creation) so message matches what would have been sent
    const payload = {
      orderNumber: order.orderNumber,
      businessName: business.name,
      businessSlug: business.slug,
      customerName: order.customerName || order.customer.name,
      customerPhone: order.customer.phone,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant?.name
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryType: order.type.toLowerCase() as 'delivery' | 'pickup' | 'dineIn',
      deliveryAddress: order.deliveryAddress || undefined,
      deliveryTime: order.deliveryTime ? order.deliveryTime.toISOString() : null,
      specialInstructions: order.notes || undefined,
      invoiceType: (order as any).invoiceType || undefined,
      language: business.language || undefined,
      currencySymbol: getCurrencySymbol(business.currency),
      postalPricingDetails: postalPricingDetailsForWhatsApp,
      isSalon,
      appointmentDateTime: isSalon && order.deliveryTime
        ? order.deliveryTime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: business.timezone || 'UTC'
          })
        : null
    }

    return NextResponse.json({ preview: payload })
  } catch (error) {
    console.error('Resend Twilio preview error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

/** POST: Actually send the WhatsApp notification */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, orderId } = await params

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            whatsappNumber: true,
            whatsappDirectNotifications: true,
            businessType: true,
            language: true,
            timezone: true
          }
        },
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } }
          }
        }
      }
    })

    if (!order || !order.business) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    if (!order.business.whatsappDirectNotifications || !isTwilioConfigured()) {
      return NextResponse.json({ message: 'WhatsApp notifications not enabled for this business' }, { status: 400 })
    }

    if (!order.business.whatsappNumber?.trim()) {
      return NextResponse.json({ message: 'Business has no WhatsApp number configured' }, { status: 400 })
    }

    const business = order.business
    const isSalon = business.businessType === 'SALON' || business.businessType === 'SERVICES'

    let postalPricingDetailsForWhatsApp: any = null
    const orderPostalPricingId = (order as any).postalPricingId
    if (business.businessType === 'RETAIL' && orderPostalPricingId) {
      try {
        const postalPricing = await (prisma as any).postalPricing.findUnique({
          where: { id: orderPostalPricingId },
          include: {
            postal: {
              select: {
                name: true,
                nameEn: true,
                nameAl: true,
                nameEl: true,
                deliveryTime: true
              }
            }
          }
        })
        if (postalPricing) {
          postalPricingDetailsForWhatsApp = {
            name: postalPricing.postal?.name || 'Postal Service',
            nameEn: postalPricing.postal?.nameEn || postalPricing.postal?.name || 'Postal Service',
            nameAl: postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service',
            nameEl: postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service',
            deliveryTime: postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null,
            price: postalPricing.price
          }
        }
      } catch {
        // Ignore
      }
    }

    // Use order snapshot so message matches exactly what would have been sent at creation
    const result = await sendTwilioOrderNotification(business.whatsappNumber!, {
      orderNumber: order.orderNumber,
      businessName: business.name,
      businessSlug: business.slug,
      customerName: order.customerName || order.customer.name,
      customerPhone: order.customer.phone,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant?.name
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryType: order.type.toLowerCase() as 'delivery' | 'pickup' | 'dineIn',
      deliveryAddress: order.deliveryAddress || undefined,
      deliveryTime: order.deliveryTime ? order.deliveryTime.toISOString() : null,
      specialInstructions: order.notes || undefined,
      invoiceType: (order as any).invoiceType || undefined,
      language: business.language || undefined,
      currencySymbol: getCurrencySymbol(business.currency),
      postalPricingDetails: postalPricingDetailsForWhatsApp,
      isSalon,
      appointmentDateTime: isSalon && order.deliveryTime
        ? order.deliveryTime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: business.timezone || 'UTC'
          })
        : null
    })

    if (result.success) {
      logSystemEvent({
        logType: 'twilio_message_sent',
        severity: 'info',
        slug: business.slug,
        businessId: business.id,
        endpoint: '/api/superadmin/businesses/.../orders/.../resend-twilio',
        method: 'POST',
        statusCode: 200,
        ipAddress: extractIPAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
        url: request.url,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          phone: business.whatsappNumber,
          messageType: 'order_notification',
          manualResend: true
        }
      })
    } else {
      logSystemEvent({
        logType: 'twilio_message_error',
        severity: 'error',
        slug: business.slug,
        businessId: business.id,
        endpoint: '/api/superadmin/businesses/.../orders/.../resend-twilio',
        method: 'POST',
        statusCode: 200,
        ipAddress: extractIPAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
        url: request.url,
        errorMessage: result.error || 'Twilio message send failed',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          phone: business.whatsappNumber,
          messageType: 'order_notification',
          manualResend: true
        }
      })
    }

    return NextResponse.json({
      success: result.success,
      error: result.error,
      messageId: result.messageId
    })
  } catch (error) {
    console.error('Resend Twilio error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
