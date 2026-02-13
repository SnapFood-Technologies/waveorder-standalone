// lib/twilio.ts - Twilio WhatsApp service for direct order notifications
// Supports both freeform messages (user-initiated) and templates (business-initiated)

interface TwilioConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string // Twilio WhatsApp sender number (e.g., +14155238886)
  contentSid?: string // WhatsApp template Content SID (for business-initiated messages)
}

interface OrderNotificationData {
  orderNumber: string
  businessName: string
  businessSlug: string
  customerName: string
  customerPhone: string
  items: Array<{
    name: string
    quantity: number
    price: number
    variant?: string
  }>
  subtotal: number
  deliveryFee: number
  total: number
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  deliveryAddress?: string
  deliveryTime?: string | null
  specialInstructions?: string
  invoiceType?: 'INVOICE' | 'RECEIPT' | null // Invoice/Receipt selection (for Greek storefronts)
  language?: string // Business language
  businessLanguage?: string // Business language (alternative field name)
  currencySymbol: string
}

/**
 * Get Twilio configuration from environment variables
 */
export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
  const contentSid = process.env.TWILIO_CONTENT_SID // Optional: WhatsApp template SID

  if (!accountSid || !authToken || !whatsappNumber) {
    return null
  }

  return {
    accountSid,
    authToken,
    whatsappNumber,
    contentSid
  }
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return getTwilioConfig() !== null
}

/**
 * Format phone number for WhatsApp (E.164 format with whatsapp: prefix)
 */
function formatWhatsAppNumber(phone: string): string {
  // Remove any non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  
  return `whatsapp:${cleaned}`
}

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'ALL': 'L',
    'BBD': 'Bds$',
    'BHD': 'BD'
  }
  return symbols[currency] || '$'
}

/**
 * Format order notification message for WhatsApp
 */
export function formatOrderNotificationMessage(data: OrderNotificationData): string {
  const { currencySymbol } = data
  
  let message = `🛒 *New Order via WaveOrder*\n\n`
  message += `*Order #${data.orderNumber}*\n`
  message += `Store: ${data.businessName}\n\n`
  
  // Order type
  const typeLabels: Record<string, string> = {
    'delivery': '🚚 Delivery',
    'pickup': '🏪 Pickup',
    'dineIn': '🍽️ Dine In'
  }
  message += `*Type:* ${typeLabels[data.deliveryType] || data.deliveryType}\n\n`
  
  // Customer info
  message += `*Customer:* ${data.customerName}\n`
  message += `*Phone:* ${data.customerPhone}\n`
  
  if (data.deliveryType === 'delivery' && data.deliveryAddress) {
    message += `*Address:* ${data.deliveryAddress}\n`
  }
  
  if (data.deliveryTime) {
    message += `*Scheduled:* ${data.deliveryTime}\n`
  }
  
  message += `\n---\n\n`
  
  // Items
  message += `*Items:*\n`
  data.items.forEach(item => {
    message += `${item.quantity}x ${item.name}`
    if (item.variant) message += ` (${item.variant})`
    message += ` - ${currencySymbol}${item.price.toFixed(2)}\n`
  })
  
  message += `\n---\n`
  message += `Subtotal: ${currencySymbol}${data.subtotal.toFixed(2)}\n`
  if (data.deliveryFee > 0) {
    message += `Delivery: ${currencySymbol}${data.deliveryFee.toFixed(2)}\n`
  }
  message += `*Total: ${currencySymbol}${data.total.toFixed(2)}*\n`
  
  if (data.specialInstructions) {
    message += `\n*Notes:* ${data.specialInstructions}\n`
  }
  
  // Add invoice/receipt selection if present (for Greek storefronts)
  if (data.invoiceType && (data.language === 'el' || data.businessLanguage === 'el')) {
    const invoiceLabel = data.invoiceType === 'INVOICE' ? 'Τιμολόγιο' : 'Απόδειξη'
    message += `\n*${invoiceLabel}:* Ναι\n`
  }
  
  message += `\n---\n`
  message += `_Manage orders at waveorder.app/auth/login_`
  
  return message

/**
 * Send WhatsApp message via Twilio using template (for business-initiated messages)
 * WhatsApp requires pre-approved templates for business-initiated conversations
 */
export async function sendWhatsAppTemplateMessage(
  toNumber: string,
  contentSid: string,
  contentVariables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getTwilioConfig()
  
  if (!config) {
    return { 
      success: false, 
      error: 'Twilio not configured' 
    }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', formatWhatsAppNumber(config.whatsappNumber))
    formData.append('To', formatWhatsAppNumber(toNumber))
    formData.append('ContentSid', contentSid)
    formData.append('ContentVariables', JSON.stringify(contentVariables))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const result = await response.json()

    if (response.ok) {
      console.log('Twilio template message sent successfully:', result.sid)
      return {
        success: true,
        messageId: result.sid
      }
    } else {
      console.error('Twilio API error:', result)
      return {
        success: false,
        error: result.message || 'Failed to send template message'
      }
    }
  } catch (error) {
    console.error('Twilio send error:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

/**
 * Send WhatsApp message via Twilio (freeform - only works within 24hr conversation window)
 * @deprecated Use sendWhatsAppTemplateMessage for business-initiated messages
 */
export async function sendWhatsAppMessage(
  toNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getTwilioConfig()
  
  if (!config) {
    return { 
      success: false, 
      error: 'Twilio not configured' 
    }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', formatWhatsAppNumber(config.whatsappNumber))
    formData.append('To', formatWhatsAppNumber(toNumber))
    formData.append('Body', message)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        messageId: result.sid
      }
    } else {
      console.error('Twilio API error:', result)
      return {
        success: false,
        error: result.message || 'Failed to send message'
      }
    }
  } catch (error) {
    console.error('Twilio send error:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

/**
 * Send order notification to business via WhatsApp
 * Uses template if TWILIO_CONTENT_SID is configured (required for business-initiated messages)
 * Falls back to freeform message if no template (only works within 24hr conversation window)
 */
export async function sendOrderNotification(
  businessWhatsAppNumber: string,
  orderData: OrderNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getTwilioConfig()
  
  if (!config) {
    return { 
      success: false, 
      error: 'Twilio not configured' 
    }
  }

  // If template is configured, use it (required for business-initiated WhatsApp messages)
  if (config.contentSid) {
    // Format items as a single string for the template
    const itemsText = orderData.items.map(item => {
      let line = `${item.quantity}x ${item.name}`
      if (item.variant) line += ` (${item.variant})`
      line += ` - ${orderData.currencySymbol}${item.price.toFixed(2)}`
      return line
    }).join(', ')

    // Delivery type labels
    const typeLabels: Record<string, string> = {
      'delivery': '🚚 Delivery',
      'pickup': '🏪 Pickup',
      'dineIn': '🍽️ Dine In'
    }

    // Build content variables matching the template
    // Template: {{1}}=orderNumber, {{2}}=storeName, {{3}}=type, {{4}}=customerName,
    //           {{5}}=phone, {{6}}=address, {{7}}=items, {{8}}=subtotal,
    //           {{9}}=delivery, {{10}}=total, {{11}}=notes
    const contentVariables: Record<string, string> = {
      '1': orderData.orderNumber,
      '2': orderData.businessName,
      '3': typeLabels[orderData.deliveryType] || orderData.deliveryType,
      '4': orderData.customerName,
      '5': orderData.customerPhone,
      '6': orderData.deliveryAddress || 'N/A',
      '7': itemsText,
      '8': `${orderData.currencySymbol}${orderData.subtotal.toFixed(2)}`,
      '9': orderData.deliveryFee > 0 
        ? `${orderData.currencySymbol}${orderData.deliveryFee.toFixed(2)}` 
        : 'Free',
      '10': `${orderData.currencySymbol}${orderData.total.toFixed(2)}`,
      '11': orderData.specialInstructions || 'None'
    }

    console.log('Sending WhatsApp order notification via template:', config.contentSid)
    return sendWhatsAppTemplateMessage(businessWhatsAppNumber, config.contentSid, contentVariables)
  }

  // Fallback to freeform message (only works if customer messaged first within 24hrs)
  console.warn('TWILIO_CONTENT_SID not configured - using freeform message (may fail for business-initiated)')
  const message = formatOrderNotificationMessage(orderData)
  return sendWhatsAppMessage(businessWhatsAppNumber, message)
}

/**
 * Check Twilio API health
 */
export async function checkTwilioHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured'
  message: string
  latency?: number
}> {
  const config = getTwilioConfig()
  
  if (!config) {
    return {
      status: 'unconfigured',
      message: 'Twilio credentials not configured'
    }
  }

  const start = Date.now()
  
  try {
    // Check account status by fetching account info
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
      }
    })
    
    const latency = Date.now() - start

    if (response.ok) {
      const data = await response.json()
      if (data.status === 'active') {
        return {
          status: 'healthy',
          message: 'Twilio account active',
          latency
        }
      } else {
        return {
          status: 'degraded',
          message: `Account status: ${data.status}`,
          latency
        }
      }
    } else if (response.status === 401) {
      return {
        status: 'down',
        message: 'Invalid Twilio credentials'
      }
    } else {
      return {
        status: 'degraded',
        message: `API returned status ${response.status}`
      }
    }
  } catch (error) {
    return {
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}
