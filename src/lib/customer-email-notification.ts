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

    // Get status message
    const statusMessage = getStatusMessage(orderData.status, orderData.type)

    // Create email content
    const emailContent = createCustomerOrderStatusEmail({
      customer,
      orderData,
      statusMessage,
      formatCurrency
    })

    // Send email
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: customer.email,
      subject: `Order ${orderData.orderNumber} Update - ${orderData.businessName}`,
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
 * Get status-specific message for customer
 */
function getStatusMessage(status: string, orderType: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Your order has been confirmed and we\'re preparing it for you!'
    case 'PREPARING':
      return 'Your order is being prepared with care!'
    case 'READY':
      if (orderType === 'PICKUP') {
        return 'Your order is ready for pickup! Please come to our store to collect it.'
      } else if (orderType === 'DINE_IN') {
        return 'Your order is ready! Please come to our restaurant.'
      } else {
        return 'Your order is ready and will be delivered soon!'
      }
    case 'OUT_FOR_DELIVERY':
      return 'Your order is out for delivery and should arrive shortly!'
    case 'DELIVERED':
      return 'Your order has been delivered! Thank you for your order.'
    case 'CANCELLED':
      return 'Your order has been cancelled. If you have any questions, please contact us.'
    case 'PAYMENT_RECEIVED':
      return 'We have received your payment. Thank you!'
    case 'PICKED_UP_AND_PAID':
      return 'Your order has been picked up and payment received. Thank you for your order!'
    default:
      return `Your order status has been updated to ${status.toLowerCase().replace('_', ' ')}.`
  }
}

/**
 * Create HTML email template for customer order status updates
 */
function createCustomerOrderStatusEmail({
  customer,
  orderData,
  statusMessage,
  formatCurrency
}: {
  customer: CustomerData
  orderData: CustomerOrderData
  statusMessage: string
  formatCurrency: (amount: number) => string
}): string {
  const orderTypeLabel = orderData.type === 'DELIVERY' ? 'Delivery' :
                        orderData.type === 'PICKUP' ? 'Pickup' :
                        'Dine-in'

  const statusColor = getStatusColor(orderData.status)
  const statusLabel = formatStatusLabel(orderData.status)

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
        Order Update
      </h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">${orderData.businessName}</p>
    </div>
    
    <!-- Order Info -->
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1f2937; margin: 0 0 5px; font-size: 20px; font-weight: 600;">Order ${orderData.orderNumber}</h2>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">${orderTypeLabel} Order</p>
      </div>

      <!-- Status Update -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: ${statusColor.background}; border-radius: 8px; border: 2px solid ${statusColor.border}; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">${getStatusIcon(orderData.status)}</div>
        <h3 style="color: ${statusColor.text}; margin: 0 0 10px; font-size: 18px; font-weight: 600;">${statusLabel}</h3>
        <p style="color: ${statusColor.text}; margin: 0; font-size: 14px; opacity: 0.9;">${statusMessage}</p>
      </div>
      
      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Order Items</h3>
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
        <h3 style="color: #92400e; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Order Summary</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #92400e;">Total:</span>
          <span style="color: #92400e; font-weight: 700; font-size: 18px;">${formatCurrency(orderData.total)}</span>
        </div>
      </div>

      ${orderData.deliveryAddress ? `
      <!-- Delivery Info -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px; font-weight: 600;">📍 Delivery Address</h3>
        <p style="color: #1e40af; margin: 0; font-size: 14px;">${orderData.deliveryAddress}</p>
        ${orderData.deliveryTime ? `
        <p style="color: #1e40af; margin: 10px 0 0; font-size: 14px;">
          <strong>Expected Delivery:</strong> ${new Date(orderData.deliveryTime).toLocaleString()}
        </p>
        ` : ''}
      </div>
      ` : ''}

      ${orderData.type === 'PICKUP' ? `
      <!-- Pickup Info -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px; font-weight: 600;">🏪 Pickup Location</h3>
        <p style="color: #065f46; margin: 0; font-size: 14px;">${orderData.businessAddress || orderData.businessName}</p>
        ${orderData.deliveryTime ? `
        <p style="color: #065f46; margin: 10px 0 0; font-size: 14px;">
          <strong>Pickup Time:</strong> ${new Date(orderData.deliveryTime).toLocaleString()}
        </p>
        ` : ''}
      </div>
      ` : ''}

      <!-- Contact Info -->
      ${orderData.businessPhone ? `
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="color: #374151; margin: 0; font-size: 14px;">
          <strong>Questions about your order?</strong><br>
          Contact us at: ${orderData.businessPhone}
        </p>
      </div>
      ` : ''}
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        This is an automated notification from ${orderData.businessName}. Please do not reply to this email.
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
    case 'OUT_FOR_DELIVERY':
      return { background: '#ecfeff', border: '#06b6d4', text: '#164e63' }
    case 'DELIVERED':
      return { background: '#d1fae5', border: '#059669', text: '#065f46' }
    case 'CANCELLED':
      return { background: '#fee2e2', border: '#ef4444', text: '#991b1b' }
    case 'PAYMENT_RECEIVED':
      return { background: '#f0fdf4', border: '#10b981', text: '#065f46' }
    case 'PICKED_UP_AND_PAID':
      return { background: '#d1fae5', border: '#059669', text: '#065f46' }
    default:
      return { background: '#f3f4f6', border: '#6b7280', text: '#374151' }
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'CONFIRMED': return '✅'
    case 'PREPARING': return '👨‍🍳'
    case 'READY': return '🎉'
    case 'OUT_FOR_DELIVERY': return '🚚'
    case 'DELIVERED': return '📦'
    case 'CANCELLED': return '❌'
    case 'PAYMENT_RECEIVED': return '💳'
    case 'PICKED_UP_AND_PAID': return '✅'
    default: return '📋'
  }
}

function formatStatusLabel(status: string): string {
  return status.toLowerCase()
    .replace('_', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

