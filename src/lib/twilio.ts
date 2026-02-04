// lib/twilio.ts - Twilio WhatsApp service for direct order notifications

interface TwilioConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string // Twilio WhatsApp sender number (e.g., +14155238886)
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
    modifiers?: Array<{ name: string; price: number }>
  }>
  subtotal: number
  deliveryFee: number
  total: number
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  deliveryAddress?: string
  deliveryTime?: string | null
  specialInstructions?: string
  currencySymbol: string
}

/**
 * Get Twilio configuration from environment variables
 */
export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken || !whatsappNumber) {
    return null
  }

  return {
    accountSid,
    authToken,
    whatsappNumber
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
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(mod => {
        message += `  + ${mod.name} (+${currencySymbol}${mod.price.toFixed(2)})\n`
      })
    }
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
  
  message += `\n---\n`
  message += `_Manage orders at waveorder.app/admin_`
  
  return message
}

/**
 * Send WhatsApp message via Twilio
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
 */
export async function sendOrderNotification(
  businessWhatsAppNumber: string,
  orderData: OrderNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
