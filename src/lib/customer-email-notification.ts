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
  businessType?: string
  items: {
    name: string
    quantity: number
    price: number
    variant?: string | null
  }[]
  // For RETAIL businesses
  postalPricingDetails?: {
    name: string // Localized postal service name
    nameEn: string
    nameAl: string
    deliveryTime: string | null // Localized delivery time
    price: number
  } | null
  countryCode?: string | null
  city?: string | null
  postalCode?: string | null
}

interface CustomerData {
  name: string
  email: string
}

/**
 * Send order placed confirmation email to customer
 */
export async function sendCustomerOrderPlacedEmail(
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

    // Create email content
    const emailContent = createCustomerOrderPlacedEmail({
      customer,
      orderData,
      formatCurrency,
      language
    })

    // Get translated email labels
    const emailLabels = getEmailLabels(language)
    
    // Send email
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: customer.email,
      subject: `${emailLabels.orderPlaced || 'Order Placed'} - ${orderData.orderNumber} - ${orderData.businessName}`,
      html: emailContent,
      // @ts-ignore
      reply_to: orderData.businessPhone || undefined,
    })

    return {
      success: true,
      emailId: emailResult.data?.id
    }

  } catch (error) {
    console.error('Error sending customer order placed email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
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
    const statusMessage = getStatusMessage(orderData.status, orderData.type, language, orderData.businessType)

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
function getStatusMessage(status: string, orderType: string, language: string = 'en', businessType?: string): string {
  const isRetail = businessType === 'RETAIL'
  const messages: Record<string, Record<string, string>> = {
    en: {
      CONFIRMED: 'Your order has been confirmed and we\'re preparing it for you!',
      PREPARING: isRetail ? 'Your order is being prepared for shipment!' : 'Your order is being prepared with care!',
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
      PREPARING: isRetail ? '¡Tu pedido se está preparando para el envío!' : '¡Tu pedido se está preparando con cuidado!',
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
      PREPARING: isRetail ? 'Porosia juaj po përgatitet për dërgim!' : 'Porosia juaj po përgatitet me kujdes!',
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
    },
    el: {
      CONFIRMED: 'Η παραγγελία σας έχει επιβεβαιωθεί και την προετοιμάζουμε για εσάς!',
      PREPARING: isRetail ? 'Η παραγγελία σας προετοιμάζεται για αποστολή!' : 'Η παραγγελία σας προετοιμάζεται προσεκτικά!',
      READY_PICKUP: 'Η παραγγελία σας είναι έτοιμη για παραλαβή! Παρακαλώ ελάτε στο κατάστημά μας για να την παραλάβετε.',
      READY_DINE_IN: 'Η παραγγελία σας είναι έτοιμη! Παρακαλώ ελάτε στο εστιατόριό μας.',
      READY_DELIVERY: 'Η παραγγελία σας είναι έτοιμη και θα παραδοθεί σύντομα!',
      PICKED_UP_PICKUP: 'Η παραγγελία σας έχει παραληφθεί! Ευχαριστούμε για την παραγγελία σας.',
      PICKED_UP_DINE_IN: 'Απολαύστε το γεύμα σας! Ευχαριστούμε που μας επισκεφτήκατε.',
      PICKED_UP_DELIVERY: 'Η παραγγελία σας έχει ολοκληρωθεί! Ευχαριστούμε για την παραγγελία σας.',
      OUT_FOR_DELIVERY: 'Η παραγγελία σας είναι στο δρόμο και θα φτάσει σύντομα!',
      DELIVERED: 'Η παραγγελία σας έχει παραδοθεί! Ευχαριστούμε για την παραγγελία σας.',
      CANCELLED: 'Η παραγγελία σας έχει ακυρωθεί. Εάν έχετε οποιεσδήποτε ερωτήσεις, παρακαλώ επικοινωνήστε μαζί μας.',
      DEFAULT: 'Η κατάσταση της παραγγελίας σας έχει ενημερωθεί σε {status}.'
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
      orderPlaced: 'Order Placed',
      orderReceived: 'Order Received',
      thankYouForOrder: 'Thank you for your order!',
      orderPlacedMessage: 'We\'ve received your order and it\'s being reviewed by our team.',
      nextSteps: 'What\'s Next?',
      orderConfirmedEmail: 'Once your order is confirmed, you\'ll receive another email with the confirmation details and estimated preparation/delivery time.',
      orderNumberLabel: 'Order Number',
      weWillNotifyYou: 'We\'ll notify you via email when your order status updates. You can track your order using the order number above.',
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
      orderPlaced: 'Pedido Realizado',
      orderReceived: 'Pedido Recibido',
      thankYouForOrder: '¡Gracias por tu pedido!',
      orderPlacedMessage: 'Hemos recibido tu pedido y nuestro equipo lo está revisando.',
      nextSteps: '¿Qué sigue?',
      orderConfirmedEmail: 'Una vez que tu pedido sea confirmado, recibirás otro correo electrónico con los detalles de confirmación y el tiempo estimado de preparación/entrega.',
      orderNumberLabel: 'Número de Pedido',
      weWillNotifyYou: 'Te notificaremos por correo electrónico cuando se actualice el estado de tu pedido. Puedes rastrear tu pedido usando el número de pedido anterior.',
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
      orderPlaced: 'Porosi e Vendosur',
      orderReceived: 'Porosi e Marrë',
      thankYouForOrder: 'Faleminderit për porosinë tuaj!',
      orderPlacedMessage: 'Kemi marrë porosinë tuaj dhe ekipi ynë po e shqyrton.',
      nextSteps: 'Ç\'ndodh Tjetër?',
      orderConfirmedEmail: 'Pasi porosia juaj të konfirmohet, do të merrni një email tjetër me detajet e konfirmimit dhe kohën e vlerësuar të përgatitjes/dorëzimit.',
      orderNumberLabel: 'Numri i Porosisë',
      weWillNotifyYou: 'Do t\'ju njoftojmë me email kur statusi i porosisë suaj të përditësohet. Mund ta ndiqni porosinë tuaj duke përdorur numrin e porosisë më sipër.',
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
  const locale = language === 'es' ? 'es-ES' : language === 'sq' ? 'sq-AL' : language === 'el' ? 'el-GR' : 'en-US'
  
  const orderTypeLabel = orderData.type === 'DELIVERY' ? labels.delivery :
                        orderData.type === 'PICKUP' ? labels.pickup :
                        labels.dineIn

  const statusColor = getStatusColor(orderData.status)
  const statusLabel = formatStatusLabel(orderData.status, language, orderData.businessType)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${labels.orderUpdate} ${orderData.orderNumber} - ${orderData.businessName}</title>
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
        <p style="color: #1e40af; margin: 0; font-size: 14px;">${formatDeliveryAddressForDisplay(orderData.deliveryAddress, orderData.countryCode, language)}</p>
        
        ${orderData.businessType === 'RETAIL' && orderData.postalPricingDetails ? `
        <!-- Postal Pricing Details for RETAIL -->
        <div style="margin-top: 15px; padding: 12px; background-color: #dbeafe; border-radius: 6px; border: 1px solid #93c5fd;">
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${labels.deliveryMethod || 'Delivery Method'}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.postalPricingDetails.name}</span>
          </div>
          ${orderData.postalPricingDetails.deliveryTime ? `
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${labels.expectedDelivery}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.postalPricingDetails.deliveryTime}</span>
          </div>
          ` : ''}
          ${orderData.city ? `
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${getLocalizedLabel('city', language)}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.city}</span>
          </div>
          ` : ''}
          ${orderData.countryCode ? `
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${getLocalizedLabel('country', language)}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${getLocalizedCountryName(orderData.countryCode, language)}</span>
          </div>
          ` : ''}
          ${orderData.postalCode ? `
          <div>
            <strong style="color: #1e40af; font-size: 14px;">${getLocalizedLabel('postalCode', language)}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.postalCode}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        ${orderData.deliveryTime && (!orderData.businessType || orderData.businessType !== 'RETAIL' || !orderData.postalPricingDetails?.deliveryTime) ? `
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
        © 2026 ${orderData.businessName}. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>
  `
}

/**
 * Create HTML email template for customer order placed confirmation
 */
function createCustomerOrderPlacedEmail({
  customer,
  orderData,
  formatCurrency,
  language = 'en'
}: {
  customer: CustomerData
  orderData: CustomerOrderData
  formatCurrency: (amount: number) => string
  language?: string
}): string {
  const labels = getEmailLabels(language)
  const locale = language === 'es' ? 'es-ES' : language === 'sq' ? 'sq-AL' : language === 'el' ? 'el-GR' : 'en-US'
  
  const orderTypeLabel = orderData.type === 'DELIVERY' ? labels.delivery :
                        orderData.type === 'PICKUP' ? labels.pickup :
                        labels.dineIn

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${labels.orderPlaced || 'Order Placed'} - ${orderData.orderNumber} - ${orderData.businessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
        ${labels.orderReceived || 'Order Received'}
      </h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">${orderData.businessName}</p>
    </div>
    
    <!-- Order Info -->
    <div style="padding: 30px;">
      <!-- Thank You Message -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border: 2px solid #10b981;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h2 style="color: #065f46; margin: 0 0 10px; font-size: 22px; font-weight: 600;">${labels.thankYouForOrder || 'Thank you for your order!'}</h2>
        <p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.6;">${labels.orderPlacedMessage || 'We\'ve received your order and it\'s being reviewed by our team.'}</p>
      </div>

      <!-- Order Number -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="color: #6b7280; margin: 0 0 8px; font-size: 14px; font-weight: 500;">${labels.orderNumberLabel || 'Order Number'}</p>
        <h2 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">${orderData.orderNumber}</h2>
        <p style="color: #6b7280; margin: 8px 0 0; font-size: 14px;">${orderTypeLabel}</p>
      </div>

      <!-- What's Next -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px; font-weight: 600;">${labels.nextSteps || 'What\'s Next?'}</h3>
        <p style="color: #1e40af; margin: 0 0 12px; font-size: 14px; line-height: 1.6;">${labels.orderConfirmedEmail || 'Once your order is confirmed, you\'ll receive another email with the confirmation details and estimated preparation/delivery time.'}</p>
        <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">${labels.weWillNotifyYou || 'We\'ll notify you via email when your order status updates. You can track your order using the order number above.'}</p>
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
        <p style="color: #1e40af; margin: 0; font-size: 14px;">${formatDeliveryAddressForDisplay(orderData.deliveryAddress, orderData.countryCode, language)}</p>
        
        ${orderData.businessType === 'RETAIL' && orderData.postalPricingDetails ? `
        <!-- Postal Pricing Details for RETAIL -->
        <div style="margin-top: 15px; padding: 12px; background-color: #dbeafe; border-radius: 6px; border: 1px solid #93c5fd;">
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${labels.deliveryMethod || 'Delivery Method'}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.postalPricingDetails.name}</span>
          </div>
          ${orderData.postalPricingDetails.deliveryTime ? `
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${labels.expectedDelivery}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.postalPricingDetails.deliveryTime}</span>
          </div>
          ` : ''}
          ${orderData.city ? `
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${getLocalizedLabel('city', language)}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.city}</span>
          </div>
          ` : ''}
          ${orderData.countryCode ? `
          <div style="margin-bottom: 8px;">
            <strong style="color: #1e40af; font-size: 14px;">${getLocalizedLabel('country', language)}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${getLocalizedCountryName(orderData.countryCode, language)}</span>
          </div>
          ` : ''}
          ${orderData.postalCode ? `
          <div>
            <strong style="color: #1e40af; font-size: 14px;">${getLocalizedLabel('postalCode', language)}:</strong>
            <span style="color: #1e40af; font-size: 14px; margin-left: 8px;">${orderData.postalCode}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${orderData.type === 'PICKUP' ? `
      <!-- Pickup Info -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px; font-weight: 600;">🏪 ${labels.pickupLocation}</h3>
        <p style="color: #065f46; margin: 0; font-size: 14px;">${orderData.businessAddress || orderData.businessName}</p>
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
        © 2026 ${orderData.businessName}. All rights reserved.
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

function formatStatusLabel(status: string, language: string = 'en', businessType?: string): string {
  const isRetail = businessType === 'RETAIL'
  const statusLabels: Record<string, Record<string, string>> = {
    en: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PREPARING: isRetail ? 'Preparing Shipment' : 'Preparing',
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
      PREPARING: isRetail ? 'Preparando Envío' : 'Preparando',
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
      PREPARING: isRetail ? 'Duke U Përgatitur Dërgimin' : 'Duke U Përgatitur',
      READY: 'Gati',
      PICKED_UP: 'Marrë',
      OUT_FOR_DELIVERY: 'Në Rrugë',
      DELIVERED: 'Dorëzuar',
      CANCELLED: 'Anuluar',
      REFUNDED: 'Rimbursuar'
    },
    el: {
      PENDING: 'Σε Εκκρεμότητα',
      CONFIRMED: 'Επιβεβαιωμένη',
      PREPARING: isRetail ? 'Προετοιμασία Αποστολής' : 'Προετοιμασία',
      READY: 'Έτοιμη',
      PICKED_UP: 'Παραληφθείσα',
      OUT_FOR_DELIVERY: 'Στο Δρόμο',
      DELIVERED: 'Παραδομένη',
      CANCELLED: 'Ακυρωμένη',
      REFUNDED: 'Επιστροφή Χρημάτων'
    }
  }

  const labels = statusLabels[language] || statusLabels.en
  return labels[status.toUpperCase()] || status.toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get localized country name
 */
function getLocalizedCountryName(countryCode: string | null | undefined, language: string): string {
  if (!countryCode) return ''
  
  const countryNames: Record<string, Record<string, string>> = {
    AL: { en: 'Albania', sq: 'Shqipëri', al: 'Shqipëri', es: 'Albania', el: 'Αλβανία' },
    XK: { en: 'Kosovo', sq: 'Kosovë', al: 'Kosovë', es: 'Kosovo', el: 'Κοσσυφοπέδιο' },
    MK: { en: 'North Macedonia', sq: 'Maqedonia e Veriut', al: 'Maqedonia e Veriut', es: 'Macedonia del Norte', el: 'Βόρεια Μακεδονία' },
    GR: { en: 'Greece', sq: 'Greqia', al: 'Greqia', es: 'Grecia', el: 'Ελλάδα' }
  }
  
  const lang = language.toLowerCase()
  return countryNames[countryCode]?.[lang] || countryNames[countryCode]?.en || countryCode
}

// Helper function to format delivery address for display (replace country codes with names)
function formatDeliveryAddressForDisplay(deliveryAddress: string, countryCode: string | null | undefined, language: string = 'en'): string {
  if (!deliveryAddress || !countryCode) return deliveryAddress
  
  const countryName = getLocalizedCountryName(countryCode, language)
  
  // Replace country code with country name in the address string
  // Match country code as a word boundary to avoid partial matches
  return deliveryAddress.replace(new RegExp(`\\b${countryCode}\\b`, 'gi'), countryName)
}

/**
 * Get localized labels for additional fields
 */
function getLocalizedLabel(field: string, language: string): string {
  const labels: Record<string, Record<string, string>> = {
    city: {
      en: 'City',
      sq: 'Qyteti',
      al: 'Qyteti',
      es: 'Ciudad',
      el: 'Πόλη'
    },
    country: {
      en: 'Country',
      sq: 'Shteti',
      al: 'Shteti',
      es: 'País',
      el: 'Χώρα'
    },
    postalCode: {
      en: 'Postal Code',
      sq: 'Kodi Postar',
      al: 'Kodi Postar',
      es: 'Código Postal',
      el: 'Ταχυδρομικός Κώδικας'
    },
    deliveryMethod: {
      en: 'Delivery Method',
      sq: 'Metoda e Dërgesës',
      al: 'Metoda e Dërgesës',
      es: 'Método de Entrega',
      el: 'Μέθοδος Παράδοσης'
    }
  }
  
  const lang = language.toLowerCase()
  return labels[field]?.[lang] || labels[field]?.en || field
}
