// src/lib/orderNotificationService.ts
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderData {
  id: string
  orderNumber: string
  status: string
  type: string
  total: number
  deliveryAddress?: string | null
  notes?: string | null
  customer: {
    name: string
    phone: string
  }
  items: {
    product: {
      name: string
    }
    variant?: {
      name: string
    } | null
    quantity: number
    price: number
    originalPrice?: number | null
  }[]
  businessId: string
  // Appointment date/time for SALON businesses
  deliveryTime?: string | null
  // For RETAIL businesses
  postalPricingDetails?: {
    name: string // Localized postal service name
    nameEn: string
    nameAl: string
    nameEl: string
    deliveryTime: string | null // Localized delivery time
    price: number
  } | null
  countryCode?: string | null
  city?: string | null
  postalCode?: string | null
  invoiceType?: 'INVOICE' | 'RECEIPT' | null // Invoice/Receipt selection (for Greek storefronts)
}

interface BusinessData {
  name: string
  orderNotificationsEnabled: boolean
  orderNotificationEmail: string | null
  email: string | null
  currency: string
  businessType: string
  language: string
  timezone?: string // Business timezone for formatting appointment date/time
}

/** Data for sending a service request notification email to the business (SERVICES form submissions) */
export interface ServiceRequestEmailData {
  id: string
  contactName: string
  companyName: string | null
  email: string
  phone: string | null
  requestType: string // EMAIL_REQUEST | WHATSAPP_REQUEST
  message: string | null
  adminLink: string
}

/**
 * Send email to business when a new service request (form submission) is received.
 * Same notification settings as orders: orderNotificationsEnabled, orderNotificationEmail.
 * Optionally include whatsappUrl for wa.me (when not using direct Twilio).
 */
export async function sendServiceRequestEmailNotification(
  serviceRequestData: ServiceRequestEmailData,
  businessData: BusinessData,
  options: { whatsappUrl?: string } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!businessData.orderNotificationsEnabled) {
      return { success: true }
    }
    const notificationEmail = businessData.orderNotificationEmail || businessData.email
    if (!notificationEmail) {
      return { success: false, error: 'No notification email configured' }
    }

    const html = createServiceRequestNotificationEmail(serviceRequestData, businessData.name, options.whatsappUrl)

    const subject = `New service request from ${serviceRequestData.contactName} - ${businessData.name}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [notificationEmail],
      subject,
      html,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
    })

    return { success: true }
  } catch (error) {
    console.error('Service request email notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
    }
  }
}

function createServiceRequestNotificationEmail(
  data: ServiceRequestEmailData,
  businessName: string,
  whatsappUrl?: string
): string {
  const preferredContact = data.requestType === 'WHATSAPP_REQUEST' ? 'WhatsApp' : 'Email'
  const viewLink = data.adminLink
  const messageText = data.message || '—'
  const phoneText = data.phone?.trim() || '—'
  const companyLine = data.companyName ? `<p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeHtml(data.companyName)}</p>` : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 24px 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">New service request</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">${escapeHtml(businessName)}</p>
    </div>
    <div style="padding: 24px;">
      <p style="color: #374151; margin: 0 0 16px;">Someone submitted a request via your storefront.</p>
      <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(data.contactName)}</p>
        ${companyLine}
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phoneText)}</p>
        <p style="margin: 0 0 8px;"><strong>Preferred contact:</strong> ${escapeHtml(preferredContact)}</p>
        <p style="margin: 0 0 0;"><strong>Message:</strong><br/>${escapeHtml(messageText)}</p>
      </div>
      <p style="margin: 0 0 16px;"><a href="${escapeHtml(viewLink)}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View in dashboard</a></p>
      ${whatsappUrl ? `<p style="margin: 0; font-size: 14px; color: #6b7280;"><a href="${escapeHtml(whatsappUrl)}" style="color: #0d9488;">Reply via WhatsApp</a></p>` : ''}
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Send email to business when a service request's status is updated (SERVICES only).
 * Used when notifyAdminOnServiceRequestStatusUpdates is true.
 */
export async function sendServiceRequestStatusUpdateToBusiness(
  notificationEmail: string,
  serviceRequestData: { contactName: string; status: string; id: string; adminLink: string },
  businessName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const statusLabel = serviceRequestData.status.charAt(0) + serviceRequestData.status.slice(1).toLowerCase()
    const subject = `Service request status updated to ${statusLabel} – ${serviceRequestData.contactName} – ${businessName}`
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 24px 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Service request status updated</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">${escapeHtml(businessName)}</p>
    </div>
    <div style="padding: 24px;">
      <p style="color: #374151; margin: 0 0 16px;">The status of a service request was updated.</p>
      <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px;"><strong>Requester:</strong> ${escapeHtml(serviceRequestData.contactName)}</p>
        <p style="margin: 0 0 0;"><strong>New status:</strong> ${escapeHtml(statusLabel)}</p>
      </div>
      <p style="margin: 16px 0 0;"><a href="${escapeHtml(serviceRequestData.adminLink)}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View in dashboard</a></p>
    </div>
  </div>
</body>
</html>`
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [notificationEmail],
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Service request status update (to business) email error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send' }
  }
}

export async function sendOrderNotification(
  orderData: OrderData, 
  businessData: BusinessData,
  isNewOrder: boolean = true
) {
  let notification: any = null

  try {
    // Check if notifications are enabled
    if (!businessData.orderNotificationsEnabled) {
      return { success: true, message: 'Notifications disabled' }
    }

    // Get notification email (fallback to business email)
    const notificationEmail = businessData.orderNotificationEmail || businessData.email
    if (!notificationEmail) {
      throw new Error('No notification email configured')
    }

    // Create notification record first
    notification = await prisma.orderNotification.create({
      data: {
        businessId: orderData.businessId,
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        orderStatus: orderData.status as any,
        customerName: orderData.customer.name,
        total: orderData.total,
        emailSent: false,
        notifiedAt: new Date()
      }
    })

    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
      const symbols: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', ALL: 'L'
      }
      const symbol = symbols[currency] || currency
      return `${symbol}${amount.toFixed(2)}`
    }

    // Business notification emails are always in English (sent to business owners)
    const language = 'en'
    const labels = getEmailLabels(language, businessData.businessType)

    // Create email content
    const emailContent = createOrderNotificationEmail({
      orderData,
      businessData,
      isNewOrder,
      formatCurrency,
      language
    })

    // Create localized subject line
    const subject = isNewOrder 
      ? `${labels.newOrderSubject}: ${orderData.orderNumber} - ${businessData.name}`
      : `${labels.orderUpdateSubject}: ${orderData.orderNumber} - ${formatStatus(orderData.status, language)}`

    // Send email using Resend directly
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [notificationEmail],
      subject,
      html: emailContent,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
    })

    // Update notification record with email status
    await prisma.orderNotification.update({
      where: { id: notification.id },
      data: {
        emailSent: true,
        updatedAt: new Date()
      }
    })

    return { 
      success: true, 
      notificationId: notification.id,
      emailId: emailResult.data?.id
    }

  } catch (error) {
    console.error('Order notification error:', error)
    
    // Try to update notification record with error
    try {
      if (notification?.id) {
        await prisma.orderNotification.update({
          where: { id: notification.id },
          data: {
            emailSent: false,
            emailError: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          }
        })
      }
    } catch (updateError) {
      console.error('Failed to update notification record:', updateError)
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send notification'
    }
  }
}

// Helper function to get email labels in the specified language, customized for business type
function getEmailLabels(language: string = 'en', businessType?: string): Record<string, string> {
  const isSalon = businessType === 'SALON' || businessType === 'SERVICES'
  
  const labels: Record<string, Record<string, string>> = {
    en: {
      newOrderReceived: isSalon ? 'New Booking Request Received!' : 'New Order Received!',
      orderUpdate: isSalon ? 'Booking Update' : 'Order Update',
      newOrder: isSalon ? 'New Booking Request' : 'New Order',
      order: isSalon ? 'Booking' : 'Order',
      new: 'New',
      customerInformation: 'Customer Information',
      name: 'Name',
      phone: 'Phone',
      deliveryAddress: isSalon ? 'Address' : 'Delivery Address',
      deliveryMethod: isSalon ? 'Booking Type' : 'Delivery Method',
      postalService: 'Postal Service',
      deliveryTime: isSalon ? 'Appointment Date & Time' : 'Delivery Time',
      deliveryFee: isSalon ? 'Service Fee' : 'Delivery Fee',
      city: 'City',
      country: 'Country',
      postalCode: 'Postal Code',
      orderItems: isSalon ? 'Services' : 'Order Items',
      variant: 'Variant',
      specialInstructions: 'Special Instructions',
      viewOrderDetails: isSalon ? 'View Booking Details' : 'View Order Details',
      notificationEnabled: isSalon 
        ? 'This notification was sent because you have booking notifications enabled.'
        : 'This notification was sent because you have order notifications enabled.',
      manageSettings: 'Manage notification settings',
      orderStatusUpdated: isSalon ? 'Booking status has been updated' : 'Order status has been updated',
      newOrderSubject: isSalon ? 'New Booking Request' : 'New Order',
      orderUpdateSubject: isSalon ? 'Booking Update' : 'Order Update',
      appointmentDateTime: 'Appointment Date & Time'
    },
    sq: {
      newOrderReceived: isSalon ? 'Kërkesë për Rezervim e Re e Marrë!' : 'Porosi e Re e Marrë!',
      orderUpdate: isSalon ? 'Përditësim i Rezervimit' : 'Përditësim i Porosisë',
      newOrder: isSalon ? 'Kërkesë për Rezervim e Re' : 'Porosi e Re',
      order: isSalon ? 'Rezervim' : 'Porosi',
      new: 'E Re',
      customerInformation: 'Informacioni i Klientit',
      name: 'Emri',
      phone: 'Telefoni',
      deliveryAddress: isSalon ? 'Adresa' : 'Adresa e Dorëzimit',
      deliveryMethod: isSalon ? 'Lloji i Rezervimit' : 'Metoda e Dorëzimit',
      postalService: 'Shërbimi Postar',
      deliveryTime: isSalon ? 'Data dhe Koha e Takimit' : 'Koha e Dorëzimit',
      deliveryFee: isSalon ? 'Tarifa e Shërbimit' : 'Tarifa e Dorëzimit',
      city: 'Qyteti',
      country: 'Shteti',
      postalCode: 'Kodi Postar',
      orderItems: isSalon ? 'Shërbimet' : 'Artikujt e Porosisë',
      variant: 'Varianti',
      specialInstructions: 'Udhëzime të Veçanta',
      viewOrderDetails: isSalon ? 'Shiko Detajet e Rezervimit' : 'Shiko Detajet e Porosisë',
      notificationEnabled: isSalon
        ? 'Kjo njoftim u dërgua sepse keni aktivizuar njoftimet e rezervimeve.'
        : 'Kjo njoftim u dërgua sepse keni aktivizuar njoftimet e porosive.',
      manageSettings: 'Menaxho cilësimet e njoftimeve',
      orderStatusUpdated: isSalon ? 'Statusi i rezervimit është përditësuar' : 'Statusi i porosisë është përditësuar',
      newOrderSubject: isSalon ? 'Kërkesë për Rezervim e Re' : 'Porosi e Re',
      orderUpdateSubject: isSalon ? 'Përditësim i Rezervimit' : 'Përditësim i Porosisë',
      appointmentDateTime: 'Data dhe Koha e Takimit'
    },
    es: {
      newOrderReceived: isSalon ? '¡Nueva Solicitud de Reserva Recibida!' : '¡Nuevo Pedido Recibido!',
      orderUpdate: isSalon ? 'Actualización de Reserva' : 'Actualización de Pedido',
      newOrder: isSalon ? 'Nueva Solicitud de Reserva' : 'Nuevo Pedido',
      order: isSalon ? 'Reserva' : 'Pedido',
      new: 'Nuevo',
      customerInformation: 'Información del Cliente',
      name: 'Nombre',
      phone: 'Teléfono',
      deliveryAddress: isSalon ? 'Dirección' : 'Dirección de Entrega',
      deliveryMethod: isSalon ? 'Tipo de Reserva' : 'Método de Entrega',
      postalService: 'Servicio Postal',
      deliveryTime: isSalon ? 'Fecha y Hora de la Cita' : 'Tiempo de Entrega',
      deliveryFee: isSalon ? 'Tarifa del Servicio' : 'Tarifa de Entrega',
      city: 'Ciudad',
      country: 'País',
      postalCode: 'Código Postal',
      orderItems: isSalon ? 'Servicios' : 'Artículos del Pedido',
      variant: 'Variante',
      specialInstructions: 'Instrucciones Especiales',
      viewOrderDetails: isSalon ? 'Ver Detalles de la Reserva' : 'Ver Detalles del Pedido',
      notificationEnabled: isSalon
        ? 'Esta notificación se envió porque tienes las notificaciones de reservas habilitadas.'
        : 'Esta notificación se envió porque tienes las notificaciones de pedidos habilitadas.',
      manageSettings: 'Gestionar configuración de notificaciones',
      orderStatusUpdated: isSalon ? 'El estado de la reserva ha sido actualizado' : 'El estado del pedido ha sido actualizado',
      newOrderSubject: isSalon ? 'Nueva Solicitud de Reserva' : 'Nuevo Pedido',
      orderUpdateSubject: isSalon ? 'Actualización de Reserva' : 'Actualización de Pedido',
      appointmentDateTime: 'Fecha y Hora de la Cita'
    },
    el: {
      newOrderReceived: isSalon ? 'Νέο Αίτημα Κράτησης Ελήφθη!' : 'Νέα Παραγγελία Ελήφθη!',
      orderUpdate: isSalon ? 'Ενημέρωση Κράτησης' : 'Ενημέρωση Παραγγελίας',
      newOrder: isSalon ? 'Νέο Αίτημα Κράτησης' : 'Νέα Παραγγελία',
      order: isSalon ? 'Κράτηση' : 'Παραγγελία',
      new: 'Νέο',
      customerInformation: 'Στοιχεία Πελάτη',
      name: 'Όνομα',
      phone: 'Τηλέφωνο',
      deliveryAddress: isSalon ? 'Διεύθυνση' : 'Διεύθυνση Παράδοσης',
      deliveryMethod: isSalon ? 'Τύπος Κράτησης' : 'Μέθοδος Παράδοσης',
      postalService: 'Ταχυδρομική Υπηρεσία',
      deliveryTime: isSalon ? 'Ημερομηνία & Ώρα Ραντεβού' : 'Χρόνος Παράδοσης',
      deliveryFee: isSalon ? 'Κόστος Υπηρεσίας' : 'Έξοδα Αποστολής',
      city: 'Πόλη',
      country: 'Χώρα',
      postalCode: 'Ταχυδρομικός Κώδικας',
      orderItems: isSalon ? 'Υπηρεσίες' : 'Προϊόντα Παραγγελίας',
      variant: 'Παραλλαγή',
      specialInstructions: 'Ειδικές Οδηγίες',
      viewOrderDetails: isSalon ? 'Δείτε τα Στοιχεία Κράτησης' : 'Δείτε τα Στοιχεία Παραγγελίας',
      notificationEnabled: isSalon 
        ? 'Αυτή η ειδοποίηση στάλθηκε επειδή έχετε ενεργοποιήσει τις ειδοποιήσεις κρατήσεων.'
        : 'Αυτή η ειδοποίηση στάλθηκε επειδή έχετε ενεργοποιήσει τις ειδοποιήσεις παραγγελιών.',
      manageSettings: 'Διαχείριση ρυθμίσεων ειδοποιήσεων',
      orderStatusUpdated: isSalon ? 'Η κατάσταση της κράτησης ενημερώθηκε' : 'Η κατάσταση της παραγγελίας ενημερώθηκε',
      newOrderSubject: isSalon ? 'Νέο Αίτημα Κράτησης' : 'Νέα Παραγγελία',
      orderUpdateSubject: isSalon ? 'Ενημέρωση Κράτησης' : 'Ενημέρωση Παραγγελίας',
      appointmentDateTime: 'Ημερομηνία & Ώρα Ραντεβού'
    }
  }

  // Normalize language codes: 'gr' -> 'el', 'al' -> 'sq'
  const normalizedLang = language === 'gr' ? 'el' : language === 'al' ? 'sq' : language
  return labels[normalizedLang] || labels.en
}

// Helper function to format order status in the specified language
function formatStatus(status: string, language: string = 'en'): string {
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
    }
  }

  const langLabels = statusLabels[language] || statusLabels.en
  const statusKey = status.toUpperCase()
  return langLabels[statusKey] || status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Helper function to get localized country name
function getLocalizedCountryName(countryCode: string | null | undefined, language: string): string {
  if (!countryCode) return ''
  
  const countryNames: Record<string, Record<string, string>> = {
    AL: { en: 'Albania', sq: 'Shqipëri', al: 'Shqipëri' },
    XK: { en: 'Kosovo', sq: 'Kosovë', al: 'Kosovë' },
    MK: { en: 'North Macedonia', sq: 'Maqedonia e Veriut', al: 'Maqedonia e Veriut' }
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

// Create email template for order notifications
function createOrderNotificationEmail({ 
  orderData, 
  businessData, 
  isNewOrder, 
  formatCurrency,
  language = 'en'
}: {
  orderData: OrderData
  businessData: BusinessData
  isNewOrder: boolean
  formatCurrency: (amount: number, currency: string) => string
  language?: string
}) {
  // Normalize language codes
  const normalizedLang = language === 'gr' ? 'el' : language === 'al' ? 'sq' : language
  const labels = getEmailLabels(normalizedLang, businessData.businessType)
  const orderTypeLabel = formatOrderType(orderData.type, businessData.businessType, normalizedLang)
  const statusColor = getStatusColorBox(orderData.status)
  const statusLabel = formatStatus(orderData.status, normalizedLang)
  const statusIcon = getStatusIcon(orderData.status)
  const isSalon = (businessData.businessType === 'SALON' || businessData.businessType === 'SERVICES')
  const locale = normalizedLang === 'es' ? 'es-ES' : normalizedLang === 'sq' ? 'sq-AL' : normalizedLang === 'el' ? 'el-GR' : 'en-US'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isNewOrder ? labels.newOrder : labels.orderUpdate} - ${businessData.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; position: relative;">
      ${isNewOrder ? `
      <div style="position: absolute; top: 20px; right: 20px;">
        <div style="display: inline-flex; align-items: center; padding: 6px 12px; background-color: #059669; border-radius: 20px; font-size: 12px; font-weight: 600; color: white;">
          ${labels.new}
        </div>
      </div>
      ` : ''}
      <div style="text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
          ${isNewOrder ? labels.newOrderReceived : labels.orderUpdate}
        </h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">${businessData.name}</p>
      </div>
    </div>
    
    <!-- Order Header -->
    <div style="padding: 30px;">
      <div style="justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div>
          <h2 style="color: #1f2937; margin: 0 0 5px; font-size: 20px; font-weight: 600;">${labels.order} ${orderData.orderNumber}</h2>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">${orderTypeLabel}</p>
        </div>
        <div style="    margin-top: 10px !important;">
          <p style="color: #1f2937; margin: 0; font-size: 18px; font-weight: 700;">
            ${formatCurrency(orderData.total, businessData.currency)}
          </p>
        </div>
      </div>
      
      ${!isNewOrder ? `
      <!-- Status Update Box -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: ${statusColor.background}; border-radius: 8px; border: 2px solid ${statusColor.border}; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">${statusIcon}</div>
        <h3 style="color: ${statusColor.text}; margin: 0 0 10px; font-size: 18px; font-weight: 600;">${statusLabel}</h3>
        <p style="color: ${statusColor.text}; margin: 0; font-size: 14px; opacity: 0.9;">${labels.orderStatusUpdated}</p>
      </div>
      ` : ''}
      
      <!-- Customer Info -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: #fef7ff; border-radius: 8px; border: 1px solid #e9d5ff;">
        <h3 style="color: #374151; margin: 0 0 15px; font-size: 16px; font-weight: 600;">${labels.customerInformation}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
          <div>
            <strong style="color: #374151;">${labels.name}:</strong><br>
            <span style="color: #6b7280;">${orderData.customer.name}</span>
          </div>
          <div>
            <strong style="color: #374151;">${labels.phone}:</strong><br>
            <span style="color: #6b7280;">${orderData.customer.phone}</span>
          </div>
        </div>
        
        ${orderData.deliveryAddress ? `
        <div style="margin-top: 15px;">
          <strong style="color: #374151;">${labels.deliveryAddress}:</strong><br>
          <a href="https://maps.google.com/maps?q=${encodeURIComponent(orderData.deliveryAddress)}" style="color: #0d9488; text-decoration: none;">${formatDeliveryAddressForDisplay(orderData.deliveryAddress, orderData.countryCode, language)}</a>
        </div>
        ` : ''}
        
        ${businessData.businessType === 'RETAIL' && orderData.postalPricingDetails ? `
        <div style="margin-top: 15px; padding: 12px; background-color: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe;">
          <strong style="color: #374151;">${labels.deliveryMethod}:</strong><br>
          <div style="margin-top: 8px; font-size: 14px; color: #374151;">
            <div style="margin-bottom: 4px;"><strong>${labels.postalService}:</strong> ${orderData.postalPricingDetails.name}</div>
            ${orderData.postalPricingDetails.deliveryTime ? `<div style="margin-bottom: 4px;"><strong>${labels.deliveryTime}:</strong> ${orderData.postalPricingDetails.deliveryTime}</div>` : ''}
            <div style="margin-bottom: 4px;"><strong>${labels.deliveryFee}:</strong> ${formatCurrency(orderData.postalPricingDetails.price, businessData.currency)}</div>
            ${orderData.city ? `<div style="margin-bottom: 4px;"><strong>${labels.city}:</strong> ${orderData.city}</div>` : ''}
            ${orderData.countryCode ? `<div style="margin-bottom: 4px;"><strong>${labels.country}:</strong> ${getLocalizedCountryName(orderData.countryCode, language)}</div>` : ''}
            ${orderData.postalCode ? `<div><strong>${labels.postalCode}:</strong> ${orderData.postalCode}</div>` : ''}
          </div>
        </div>
        ` : ''}
      </div>
      
      ${isSalon && orderData.deliveryTime ? `
      <!-- Appointment Date & Time -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px; font-weight: 600;">📅 ${labels.appointmentDateTime || labels.deliveryTime || 'Appointment Date & Time'}</h3>
        <p style="color: #065f46; margin: 0; font-size: 16px; font-weight: 600;">
          ${new Date(orderData.deliveryTime).toLocaleString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: businessData.timezone || 'UTC' })}
        </p>
      </div>
      ` : ''}

      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 16px; font-weight: 600;">${labels.orderItems}</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${orderData.items.map((item, index) => `
          <div style="padding: 15px; ${index % 2 === 0 ? 'background-color: #f9fafb;' : 'background-color: white;'} border-bottom: ${index < orderData.items.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="margin: 0 0 5px; font-weight: 600; color: #374151;">${item.quantity}x ${item.product.name}</p>
                ${item.variant ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${labels.variant}: ${item.variant.name}</p>` : ''}
              </div>
              <div style="margin-left: 15px;">
                ${item.originalPrice && item.originalPrice > item.price ? `
                  <p style="margin: 0; font-weight: 600; color: #1f2937;">
                    ${formatCurrency(item.price, businessData.currency)}
                    <span style="text-decoration: line-through; color: #6b7280; font-size: 12px; margin-left: 8px;">${formatCurrency(item.originalPrice, businessData.currency)}</span>
                    <span style="color: #059669; font-size: 11px; margin-left: 8px;">-${formatCurrency(item.originalPrice - item.price, businessData.currency)}</span>
                  </p>
                ` : `
                  <p style="margin: 0; font-weight: 600; color: #1f2937;">${formatCurrency(item.price, businessData.currency)}</p>
                `}
              </div>
            </div>
          </div>
          `).join('')}
        </div>
      </div>
      
      ${orderData.notes ? `
      <!-- Special Instructions -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #fef3cd; border-radius: 8px; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">${labels.specialInstructions}</h3>
        <p style="color: #92400e; margin: 0; font-size: 14px; white-space: pre-wrap;">${orderData.notes}</p>
      </div>
      ` : ''}
      
      ${orderData.invoiceType && language === 'el' ? `
      <!-- Invoice/Receipt Selection -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #0ea5e9;">
        <h3 style="color: #0c4a6e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">📄 ${orderData.invoiceType === 'INVOICE' ? 'Τιμολόγιο' : 'Απόδειξη'}</h3>
        <p style="color: #0c4a6e; margin: 0; font-size: 14px;">${orderData.invoiceType === 'INVOICE' ? 'Ο πελάτης έχει επιλέξει να λάβει τιμολόγιο για αυτή την παραγγελία.' : 'Ο πελάτης έχει επιλέξει να λάβει απόδειξη για αυτή την παραγγελία.'}</p>
      </div>
      ` : ''}
      
      <!-- Quick Actions -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/admin/stores/${orderData.businessId}/${isSalon ? 'appointments' : 'orders'}/${orderData.id}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          ${labels.viewOrderDetails}
        </a>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        ${labels.notificationEnabled}<br>
        <a href="${process.env.NEXTAUTH_URL}/auth/login" style="color: #0d9488; text-decoration: none;">${labels.manageSettings}</a>
      </p>
      <p style="color: #9ca3af; margin: 12px 0 0; font-size: 12px;">
        © 2026 Electral Shpk. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>
  `
}
// Helper functions
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending': return '#f59e0b'
    case 'confirmed': return '#3b82f6'
    case 'preparing': return '#f97316'
    case 'ready': return '#10b981'
    case 'picked_up': return '#059669'
    case 'out_for_delivery': return '#06b6d4'
    case 'delivered': return '#059669'
    case 'cancelled': return '#ef4444'
    case 'refunded': return '#6b7280'
    default: return '#6b7280'
  }
}

function getStatusColorBox(status: string): { background: string; border: string; text: string } {
  switch (status.toUpperCase()) {
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
    case 'REFUNDED':
      return { background: '#f3f4f6', border: '#6b7280', text: '#374151' }
    default:
      return { background: '#f3f4f6', border: '#6b7280', text: '#374151' }
  }
}

function getStatusIcon(status: string): string {
  switch (status.toUpperCase()) {
    case 'CONFIRMED': return '✅'
    case 'PREPARING': return '👨‍🍳'
    case 'READY': return '🎉'
    case 'PICKED_UP': return '✨'
    case 'OUT_FOR_DELIVERY': return '🚚'
    case 'DELIVERED': return '📦'
    case 'CANCELLED': return '❌'
    case 'REFUNDED': return '↩️'
    default: return '📋'
  }
}

function formatOrderType(type: string, businessType: string, language: string = 'en'): string {
  // Normalize language codes
  const normalizedLang = language === 'gr' ? 'el' : language === 'al' ? 'sq' : language

  const typeMap: Record<string, Record<string, Record<string, string>>> = {
    RESTAURANT: {
      en: {
        DELIVERY: 'Delivery Order',
        PICKUP: 'Pickup Order', 
        DINE_IN: 'Dine-in Order'
      },
      sq: {
        DELIVERY: 'Porosi Dorëzimi',
        PICKUP: 'Porosi Marrjeje',
        DINE_IN: 'Porosi Në Vend'
      },
      es: {
        DELIVERY: 'Pedido de Entrega',
        PICKUP: 'Pedido para Recoger',
        DINE_IN: 'Pedido en el Local'
      },
      el: {
        DELIVERY: 'Παραγγελία Παράδοσης',
        PICKUP: 'Παραγγελία Παραλαβής',
        DINE_IN: 'Επιτόπια Παραγγελία'
      }
    },
    RETAIL: {
      en: {
        DELIVERY: 'Shipping Order',
        PICKUP: 'Store Pickup',
        DINE_IN: 'In-Store Order'
      },
      sq: {
        DELIVERY: 'Porosi Dërgimi',
        PICKUP: 'Marrje Në Dyqan',
        DINE_IN: 'Porosi Në Dyqan'
      },
      es: {
        DELIVERY: 'Pedido de Envío',
        PICKUP: 'Recogida en Tienda',
        DINE_IN: 'Pedido en Tienda'
      },
      el: {
        DELIVERY: 'Παραγγελία Αποστολής',
        PICKUP: 'Παραλαβή από Κατάστημα',
        DINE_IN: 'Παραγγελία στο Κατάστημα'
      }
    },
    SALON: {
      en: {
        DELIVERY: 'Appointment',
        PICKUP: 'Walk-in',
        DINE_IN: 'In-Salon Appointment'
      },
      sq: {
        DELIVERY: 'Takim',
        PICKUP: 'Pa Rezervim',
        DINE_IN: 'Takim Në Salon'
      },
      es: {
        DELIVERY: 'Cita',
        PICKUP: 'Sin Cita',
        DINE_IN: 'Cita en el Salón'
      },
      el: {
        DELIVERY: 'Ραντεβού',
        PICKUP: 'Χωρίς Κράτηση',
        DINE_IN: 'Ραντεβού στο Σαλόνι'
      }
    }
  }
  
  const langLabels = typeMap[businessType]?.[normalizedLang] || typeMap[businessType]?.en || {}
  return langLabels[type.toUpperCase()] || `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Order`
}