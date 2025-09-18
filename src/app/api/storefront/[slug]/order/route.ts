// app/api/storefront/[slug]/order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const messageTerms = {
  en: {
    RESTAURANT: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP'
    },
    CAFE: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP'
    },
    RETAIL: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Shipping',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Shipping Address',
      deliveryTime: 'Shipping Time',
      pickupTime: 'Pickup Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP'
    },
    GROCERY: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP'
    },
    JEWELRY: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Shipping',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Shipping Address',
      deliveryTime: 'Shipping Time',
      pickupTime: 'Appointment Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP'
    },
    FLORIST: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP'
    }
  },
  sq: {
    RESTAURANT: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT'
    },
    CAFE: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT'
    },
    RETAIL: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dërgimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dërgimit',
      deliveryTime: 'Koha e Dërgimit',
      pickupTime: 'Koha e Marrjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT'
    },
    GROCERY: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT'
    },
    JEWELRY: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dërgimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dërgimit',
      deliveryTime: 'Koha e Dërgimit',
      pickupTime: 'Koha e Takimit',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT'
    },
    FLORIST: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT'
    }
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const orderData = await request.json()

    // Find business
    const business = await prisma.business.findUnique({
      where: { slug, isActive: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Validate order data
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryType, // 'delivery', 'pickup', 'dineIn'
      deliveryTime,
      paymentMethod,
      specialInstructions,
      items,
      subtotal,
      deliveryFee,
      tax,
      discount,
      total
    } = orderData

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        phone: customerPhone,
        businessId: business.id
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: deliveryAddress,
          businessId: business.id
        }
      })
    }

    // Generate order number
    const orderCount = await prisma.order.count({
      where: { businessId: business.id }
    })
    const orderNumber = business.orderNumberFormat.replace('{number}', (orderCount + 1).toString())

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        type: deliveryType.toUpperCase(),
        customerId: customer.id,
        businessId: business.id,
        subtotal,
        deliveryFee: deliveryFee || 0,
        tax: tax || 0,
        discount: discount || 0,
        total,
        deliveryAddress,
        deliveryTime: deliveryTime ? new Date(deliveryTime) : null,
        notes: specialInstructions,
        paymentMethod,
        paymentStatus: 'PENDING'
      }
    })

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers || []
        }
      })
    }

    // Format WhatsApp message
    const whatsappMessage = formatWhatsAppOrder({
      business,
      order,
      customer,
      items,
      orderData
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      whatsappUrl: `https://wa.me/${business.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

function formatWhatsAppOrder({ business, order, customer, items, orderData }: any) {
  const currencySymbol = getCurrencySymbol(business.currency)
  const language = business.language || 'en'
  const businessType = business.businessType || 'RESTAURANT'
  
  // Get appropriate terms for business type and language
  // @ts-ignore
  const terms = messageTerms[language]?.[businessType] || messageTerms['en']['RESTAURANT']
  
  let message = `*${terms.order} ${order.orderNumber}*\n\n`
  
  // Items
  items.forEach((item: any) => {
    message += `${item.quantity}x ${item.name}`
    if (item.variant) message += ` (${item.variant})`
    message += ` - ${currencySymbol}${item.price.toFixed(2)}\n`
    if (item.modifiers?.length) {
      item.modifiers.forEach((mod: any) => {
        message += `  + ${mod.name} (+${currencySymbol}${mod.price.toFixed(2)})\n`
      })
    }
  })
  
  message += `\n---\n`
  message += `${terms.subtotal}: ${currencySymbol}${orderData.subtotal.toFixed(2)}\n`
  
  if (orderData.discount > 0) {
    message += `${language === 'sq' ? 'Zbritje' : 'Discount'}: -${currencySymbol}${orderData.discount.toFixed(2)}\n`
  }
  
  if (orderData.deliveryFee > 0) {
    message += `${terms.delivery}: ${currencySymbol}${orderData.deliveryFee.toFixed(2)}\n`
  }
  
  message += `*${terms.total}: ${currencySymbol}${orderData.total.toFixed(2)}*\n\n`
  
  message += `---\n`
  message += `${terms.customer}: ${customer.name}\n`
  message += `${terms.phone}: ${customer.phone}\n`
  
  if (orderData.deliveryType === 'delivery') {
    message += `${terms.deliveryAddress}: ${orderData.deliveryAddress}\n`
    message += `${terms.deliveryTime}: ${orderData.deliveryTime || terms.asap}\n`
  } else {
    const timeLabel = businessType === 'JEWELRY' && orderData.deliveryType === 'pickup' 
      ? terms.pickupTime 
      : terms.pickupTime
    message += `${timeLabel}: ${orderData.deliveryTime || terms.asap}\n`
  }
  
  message += `${terms.payment}: ${orderData.paymentMethod}\n`
  
  if (orderData.specialInstructions) {
    message += `${terms.notes}: ${orderData.specialInstructions}\n`
  }
  
  message += `\n---\n`
  message += `${business.name}\n`
  if (business.website) {
    message += `${business.website}\n`
  }
  
  return message
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    default: return '$'
  }
}