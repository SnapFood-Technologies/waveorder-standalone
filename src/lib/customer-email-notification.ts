// lib/customer-email-notification.ts
// Customer email notification service for order status updates

import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

interface CustomerOrderData {
  orderNumber: string
  status: string
  type: string
  total: number
  deliveryAddress?: string | null
  deliveryTime?: Date | null
  businessName: string
  businessAddress?: string | null
  businessPhone?: string | null
  currency: string
  language?: string
  translateContentToBusinessLanguage?: boolean
  items: {
    name: string
    quantity: number
    price: number
    variant?: string | null
  }[]
}

interface CustomerData {
  name: string
  email: string
}

/**
 * Send order status update email to customer
 */
export async function sendCustomerOrderStatusEmail(
  customer: CustomerData,
  orderData: CustomerOrderData
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    if (!customer.email || !customer.email.trim()) {
      return { success: false, error: 'Customer email not available' }
    }

    // Format currency
    const formatCurrency = (amount: number) => {
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        ALL: 'L'
      }
      const symbol = symbols[orderData.currency] || orderData.currency
      return `${symbol}${amount.toFixed(2)}`
    }

    // Determine language to use
    const useBusinessLanguage = orderData.translateContentToBusinessLanguage !== false
    const language = useBusinessLanguage ? (orderData.language || 'en') : 'en'

    // Get status message in the appropriate language
    const statusMessage = getStatusMessage(orderData.status, orderData.type, language)

    // Create email content
    const emailContent = createCustomerOrderStatusEmail({
      customer,
      orderData,
      statusMessage,
      formatCurrency,
      language
    })

    // Get translated email labels
    const emailLabels = getEmailLabels(language)
    
    // Send email
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: customer.email,
      subject: `${emailLabels.orderUpdate} ${orderData.orderNumber} - ${orderData.businessName}`,
      html: emailContent,
      // @ts-ignore
      reply_to: orderData.businessPhone || undefined,
    })

    return {
      success: true,
      emailId: emailResult.data?.id
    }

  } catch (error) {
    console.error('Error sending customer order status email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

/**
 * Get status-specific message for customer in the specified language
 */
function getStatusMessage(status: string, orderType: string, language: string = 'en'): string {
  const messages: Record<string, Record<string, string>> = {
    en: {
      CONFIRMED: 'Your order has been confirmed and we\'re preparing it for you!',
      PREPARING: 'Your order is being prepared with care!',
      READY_PICKUP: 'Your order is ready for pickup! Please come to our store to collect it.',
      READY_DINE_IN: 'Your order is ready! Please come to our restaurant.',
      READY_DELIVERY: 'Your order is ready and will be delivered soon!',
      PICKED_UP_PICKUP: 'Your order has been picked up! Thank you for your order.',
      PICKED_UP_DINE_IN: 'Enjoy your meal! Thank you for dining with us.',
      PICKED_UP_DELIVERY: 'Your order has been completed! Thank you for your order.',
      OUT_FOR_DELIVERY: 'Your order is out for delivery and should arrive shortly!',
      DELIVERED: 'Your order has been delivered! Thank you for your order.',
      CANCELLED: 'Your order has been cancelled. If you have any questions, please contact us.',
      DEFAULT: 'Your order status has been updated to {status}.'
    },
    es: {
      CONFIRMED: '¡Tu pedido ha sido confirmado y lo estamos preparando para ti!',
      PREPARING: '¡Tu pedido se está preparando con cuidado!',
      READY_PICKUP: '¡Tu pedido está listo para recoger! Por favor, ven a nuestra tienda a recogerlo.',
      READY_DINE_IN: '¡Tu pedido está listo! Por favor, ven a nuestro restaurante.',
      READY_DELIVERY: '¡Tu pedido está listo y será entregado pronto!',
      PICKED_UP_PICKUP: '¡Tu pedido ha sido recogido! Gracias por tu pedido.',
      PICKED_UP_DINE_IN: '¡Que disfrutes tu comida! Gracias por visitarnos.',
      PICKED_UP_DELIVERY: '¡Tu pedido ha sido completado! Gracias por tu pedido.',
      OUT_FOR_DELIVERY: '¡Tu pedido está en camino y debería llegar pronto!',
      DELIVERED: '¡Tu pedido ha sido entregado! Gracias por tu pedido.',
      CANCELLED: 'Tu pedido ha sido cancelado. Si tienes alguna pregunta, por favor contáctanos.',
      DEFAULT: 'El estado de tu pedido ha sido actualizado a {status}.'
    },
    sq: {
      CONFIRMED: 'Porosia juaj është konfirmuar dhe po e përgatisim për ju!',
      PREPARING: 'Porosia juaj po përgatitet me kujdes!',
      READY_PICKUP: 'Porosia juaj është gati për marrje! Ju lutemi vini në dyqanin tonë për ta marrë.',
      READY_DINE_IN: 'Porosia juaj është gati! Ju lutemi vini në restorantin tonë.',
      READY_DELIVERY: 'Porosia juaj është gati dhe do të dorëzohet së shpejti!',
      PICKED_UP_PICKUP: 'Porosia juaj është marrë! Faleminderit për porosinë tuaj.',
      PICKED_UP_DINE_IN: 'Shijoni ushqimin tuaj! Faleminderit që na vizituat.',
      PICKED_UP_DELIVERY: 'Porosia juaj është përfunduar! Faleminderit për porosinë tuaj.',
      OUT_FOR_DELIVERY: 'Porosia juaj është në rrugë dhe duhet të mbërrijë së shpejti!',
      DELIVERED: 'Porosia juaj është dorëzuar! Faleminderit për porosinë tuaj.',
      CANCELLED: 'Porosia juaj është anuluar. Nëse keni ndonjë pyetje, ju lutemi na kontaktoni.',
      DEFAULT: 'Statusi i porosisë tuaj është përditësuar në {status}.'
    }
  }

  const langMessages = messages[language] || messages.en
  const statusKey = status.toUpperCase()

  switch (statusKey) {
    case 'CONFIRMED':
      return langMessages.CONFIRMED
    case 'PREPARING':
      return langMessages.PREPARING
    case 'READY':
      if (orderType === 'PICKUP') return langMessages.READY_PICKUP
      if (orderType === 'DINE_IN') return langMessages.READY_DINE_IN
      return langMessages.READY_DELIVERY
    case 'PICKED_UP':
      if (orderType === 'PICKUP') return langMessages.PICKED_UP_PICKUP
      if (orderType === 'DINE_IN') return langMessages.PICKED_UP_DINE_IN
      return langMessages.PICKED_UP_DELIVERY
    case 'OUT_FOR_DELIVERY':
      return langMessages.OUT_FOR_DELIVERY
    case 'DELIVERED':
      return langMessages.DELIVERED
    case 'CANCELLED':
      return langMessages.CANCELLED
    default:
      return langMessages.DEFAULT.replace('{status}', status.toLowerCase().replace(/_/g, ' '))
  }
}

/**
 * Get email labels in the specified language
 */
function getEmailLabels(language: string = 'en'): Record<string, string> {
  const labels: Record<string, Record<string, string>> = {
    en: {
      orderUpdate: 'Order',
      orderItems: 'Order Items',
      orderSummary: 'Order Summary',
      total: 'Total',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      expectedDelivery: 'Expected Delivery',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Arrival Time',
      questionsAboutOrder: 'Questions about your order?',
      contactUs: 'Contact us at:',
      automatedNotification: 'This is an automated notification from',
      doNotReply: 'Please do not reply to this email.',
      delivery: 'Delivery',
      pickup: 'Pickup',
      dineIn: 'Dine-in',
      order: 'Order'
    },
    es: {
      orderUpdate: 'Pedido',
      orderItems: 'Artículos del Pedido',
      orderSummary: 'Resumen del Pedido',
      total: 'Total',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      expectedDelivery: 'Entrega Esperada',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Llegada',
      questionsAboutOrder: '¿Preguntas sobre tu pedido?',
      contactUs: 'Contáctanos en:',
      automatedNotification: 'Esta es una notificación automática de',
      doNotReply: 'Por favor no respondas a este correo electrónico.',
      delivery: 'Entrega',
      pickup: 'Recogida',
      dineIn: 'Comer aquí',
      order: 'Pedido'
    },
    sq: {
      orderUpdate: 'Porosi',
      orderItems: 'Artikujt e Porosisë',
      orderSummary: 'Përmbledhje e Porosisë',
      total: 'Total',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendndodhja e Marrjes',
      expectedDelivery: 'Dorëzimi i Pritur',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Mbërritjes',
      questionsAboutOrder: 'Pyetje rreth porosisë suaj?',
      contactUs: 'Na kontaktoni në:',
      automatedNotification: 'Kjo është një njoftim automatizuar nga',
      doNotReply: 'Ju lutemi mos u përgjigjni këtij email-i.',
      delivery: 'Dorëzim',
      pickup: 'Marrje',
      dineIn: 'Në vend',
      order: 'Porosi'
    }
  }

  return labels[language] || labels.en
}

/**
 * Create HTML email template for customer order status updates
 */
function createCustomerOrderStatusEmail({
  customer,
  orderData,
  statusMessage,
  formatCurrency,
  language = 'en'
}: {
  customer: CustomerData
  orderData: CustomerOrderData
  statusMessage: string
  formatCurrency: (amount: number) => string
  language?: string
}): string {
  const labels = getEmailLabels(language)
  const locale = language === 'es' ? 'es-ES' : language === 'sq' ? 'sq-AL' : 'en-US'
  
  const orderTypeLabel = orderData.type === 'DELIVERY' ? labels.delivery :
                        orderData.type === 'PICKUP' ? labels.pickup :
                        labels.dineIn

  const statusColor = getStatusColor(orderData.status)
  const statusLabel = formatStatusLabel(orderData.status, language)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order ${orderData.orderNumber} Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
        ${labels.orderUpdate}
      </h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">${orderData.businessName}</p>
    </div>
    
    <!-- Order Info -->
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1f2937; margin: 0 0 5px; font-size: 20px; font-weight: 600;">${labels.order} ${orderData.orderNumber}</h2>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">${orderTypeLabel}</p>
      </div>

      <!-- Status Update -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: ${statusColor.background}; border-radius: 8px; border: 2px solid ${statusColor.border}; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">${getStatusIcon(orderData.status)}</div>
        <h3 style="color: ${statusColor.text}; margin: 0 0 10px; font-size: 18px; font-weight: 600;">${statusLabel}</h3>
        <p style="color: ${statusColor.text}; margin: 0; font-size: 14px; opacity: 0.9;">${statusMessage}</p>
      </div>
      
      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 16px; font-weight: 600;">${labels.orderItems}</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${orderData.items.map((item, index) => `
          <div style="padding: 15px; ${index % 2 === 0 ? 'background-color: #f9fafb;' : 'background-color: white;'} border-bottom: ${index < orderData.items.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="margin: 0 0 5px; font-weight: 600; color: #374151;">${item.quantity}x ${item.name}</p>
                ${item.variant ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${item.variant}</p>` : ''}
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; color: #1f2937;">${formatCurrency(item.price)}</p>
              </div>
            </div>
          </div>
          `).join('')}
        </div>
      </div>

      <!-- Order Summary -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: #fef3cd; border-radius: 8px; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px; font-size: 16px; font-weight: 600;">${labels.orderSummary}</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #92400e;">${labels.total}:</span>
          <span style="color: #92400e; font-weight: 700; font-size: 18px;">${formatCurrency(orderData.total)}</span>
        </div>
      </div>

      ${orderData.deliveryAddress ? `
      <!-- Delivery Info -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px; font-weight: 600;">📍 ${labels.deliveryAddress}</h3>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">${orderData.deliveryAddress}</p>
        ${orderData.deliveryTime ? `
        <p style="color: #1e40af; margin: 10px 0 0; font-size: 14px;">
          <strong>${labels.expectedDelivery}:</strong> ${new Date(orderData.deliveryTime).toLocaleString(locale)}
        </p>
        ` : ''}
      </div>
      ` : ''}

      ${orderData.type === 'PICKUP' ? `
      <!-- Pickup Info -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px; font-weight: 600;">🏪 ${labels.pickupLocation}</h3>
        <p style="color: #065f46; margin: 0; font-size: 14px;">${orderData.businessAddress || orderData.businessName}</p>
        ${orderData.deliveryTime ? `
        <p style="color: #065f46; margin: 10px 0 0; font-size: 14px;">
          <strong>${labels.pickupTime}:</strong> ${new Date(orderData.deliveryTime).toLocaleString(locale)}
        </p>
        ` : ''}
      </div>
      ` : ''}
      
      ${orderData.type === 'DINE_IN' && orderData.deliveryTime ? `
      <!-- Dine-in Info -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #10b981;">
        <p style="color: #065f46; margin: 10px 0 0; font-size: 14px;">
          <strong>${labels.arrivalTime}:</strong> ${new Date(orderData.deliveryTime).toLocaleString(locale)}
        </p>
      </div>
      ` : ''}

      <!-- Contact Info -->
      ${orderData.businessPhone ? `
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151; margin: 0; font-size: 14px;">
          <strong>${labels.questionsAboutOrder}</strong><br>
          ${labels.contactUs} ${orderData.businessPhone}
        </p>
      </div>
      ` : ''}
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        ${labels.automatedNotification} ${orderData.businessName}. ${labels.doNotReply}
      </p>
      <p style="color: #9ca3af; margin: 12px 0 0; font-size: 12px;">
        © 2025 Electral Shpk. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>
  `
}

function getStatusColor(status: string): { background: string; border: string; text: string } {
  switch (status) {
    case 'CONFIRMED':
      return { background: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
    case 'PREPARING':
      return { background: '#fff7ed', border: '#f97316', text: '#9a3412' }
    case 'READY':
      return { background: '#f0fdf4', border: '#10b981', text: '#065f46' }
    case 'PICKED_UP':
      return { background: '#d1fae5', border: '#059669', text: '#065f46' }
    case 'OUT_FOR_DELIVERY':
      return { background: '#ecfeff', border: '#06b6d4', text: '#164e63' }
    case 'DELIVERED':
      return { background: '#d1fae5', border: '#059669', text: '#065f46' }
    case 'CANCELLED':
      return { background: '#fee2e2', border: '#ef4444', text: '#991b1b' }
    default:
      return { background: '#f3f4f6', border: '#6b7280', text: '#374151' }
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'CONFIRMED': return '✅'
    case 'PREPARING': return '👨‍🍳'
    case 'READY': return '🎉'
    case 'PICKED_UP': return '✨'
    case 'OUT_FOR_DELIVERY': return '🚚'
    case 'DELIVERED': return '📦'
    case 'CANCELLED': return '❌'
    default: return '📋'
  }
}

function formatStatusLabel(status: string, language: string = 'en'): string {
  const statusLabels: Record<string, Record<string, string>> = {
    en: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PREPARING: 'Preparing',
      READY: 'Ready',
      PICKED_UP: 'Picked Up',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded'
    },
    es: {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      PREPARING: 'Preparando',
      READY: 'Listo',
      PICKED_UP: 'Recogido',
      OUT_FOR_DELIVERY: 'En Camino',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
      REFUNDED: 'Reembolsado'
    },
    sq: {
      PENDING: 'Në Pritje',
      CONFIRMED: 'E Konfirmuar',
      PREPARING: 'Duke U Përgatitur',
      READY: 'Gati',
      PICKED_UP: 'Marrë',
      OUT_FOR_DELIVERY: 'Në Rrugë',
      DELIVERED: 'Dorëzuar',
      CANCELLED: 'Anuluar',
      REFUNDED: 'Rimbursuar'
    }
  }

  const labels = statusLabels[language] || statusLabels.en
  return labels[status.toUpperCase()] || status.toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

