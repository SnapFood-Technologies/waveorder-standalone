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
  }[]
  businessId: string
}

interface BusinessData {
  name: string
  orderNotificationsEnabled: boolean
  orderNotificationEmail: string | null
  email: string | null
  currency: string
  businessType: string
  language: string
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

    // Create email content
    const emailContent = createOrderNotificationEmail({
      orderData,
      businessData,
      isNewOrder,
      formatCurrency
    })

    // Send email using Resend directly
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [notificationEmail],
      subject: isNewOrder 
        ? `New Order: ${orderData.orderNumber} - ${businessData.name}`
        : `Order Update: ${orderData.orderNumber} - ${formatStatus(orderData.status)}`,
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

// Helper function to format order status
function formatStatus(status: string) {
  return status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Create email template for order notifications
function createOrderNotificationEmail({ 
  orderData, 
  businessData, 
  isNewOrder, 
  formatCurrency 
}: {
  orderData: OrderData
  businessData: BusinessData
  isNewOrder: boolean
  formatCurrency: (amount: number, currency: string) => string
}) {
  const orderTypeLabel = formatOrderType(orderData.type, businessData.businessType)
  const statusColor = getStatusColorBox(orderData.status)
  const statusLabel = formatStatus(orderData.status)
  const statusIcon = getStatusIcon(orderData.status)
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isNewOrder ? 'New Order' : 'Order Update'} - ${businessData.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; position: relative;">
      ${isNewOrder ? `
      <div style="position: absolute; top: 20px; right: 20px;">
        <div style="display: inline-flex; align-items: center; padding: 6px 12px; background-color: #059669; border-radius: 20px; font-size: 12px; font-weight: 600; color: white;">
          New
        </div>
      </div>
      ` : ''}
      <div style="text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
          ${isNewOrder ? 'New Order Received!' : 'Order Update'}
        </h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">${businessData.name}</p>
      </div>
    </div>
    
    <!-- Order Header -->
    <div style="padding: 30px;">
      <div style="justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div>
          <h2 style="color: #1f2937; margin: 0 0 5px; font-size: 20px; font-weight: 600;">Order ${orderData.orderNumber}</h2>
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
        <p style="color: ${statusColor.text}; margin: 0; font-size: 14px; opacity: 0.9;">Order status has been updated</p>
      </div>
      ` : ''}
      
      <!-- Customer Info -->
      <div style="margin-bottom: 30px; padding: 20px; background-color: #fef7ff; border-radius: 8px; border: 1px solid #e9d5ff;">
        <h3 style="color: #374151; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Customer Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
          <div>
            <strong style="color: #374151;">Name:</strong><br>
            <span style="color: #6b7280;">${orderData.customer.name}</span>
          </div>
          <div>
            <strong style="color: #374151;">Phone:</strong><br>
            <span style="color: #6b7280;">${orderData.customer.phone}</span>
          </div>
        </div>
        
        ${orderData.deliveryAddress ? `
        <div style="margin-top: 15px;">
          <strong style="color: #374151;">Delivery Address:</strong><br>
          <a href="https://maps.google.com/maps?q=${encodeURIComponent(orderData.deliveryAddress)}" style="color: #0d9488; text-decoration: none;">${orderData.deliveryAddress}</a>
        </div>
        ` : ''}
      </div>
      
      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Order Items</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${orderData.items.map((item, index) => `
          <div style="padding: 15px; ${index % 2 === 0 ? 'background-color: #f9fafb;' : 'background-color: white;'} border-bottom: ${index < orderData.items.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="margin: 0 0 5px; font-weight: 600; color: #374151;">${item.quantity}x ${item.product.name}</p>
                ${item.variant ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">Variant: ${item.variant.name}</p>` : ''}
              </div>
              <div style="    margin-left: 15px;">
                <p style="margin: 0; font-weight: 600; color: #1f2937;">(${formatCurrency(item.price, businessData.currency)})</p>
              </div>
            </div>
          </div>
          `).join('')}
        </div>
      </div>
      
      ${orderData.notes ? `
      <!-- Special Instructions -->
      <div style="margin-bottom: 30px; padding: 15px; background-color: #fef3cd; border-radius: 8px; border: 1px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Special Instructions</h3>
        <p style="color: #92400e; margin: 0; font-size: 14px; white-space: pre-wrap;">${orderData.notes}</p>
      </div>
      ` : ''}
      
      <!-- Quick Actions -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/admin/orders/${orderData.id}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View Order Details
        </a>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        This notification was sent because you have order notifications enabled.<br>
        <a href="${process.env.NEXTAUTH_URL}/auth/login" style="color: #0d9488; text-decoration: none;">Manage notification settings</a>
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

function formatOrderType(type: string, businessType: string): string {
  const typeMap: Record<string, Record<string, string>> = {
    RESTAURANT: {
      DELIVERY: 'Delivery Order',
      PICKUP: 'Pickup Order', 
      DINE_IN: 'Dine-in Order'
    },
    RETAIL: {
      DELIVERY: 'Shipping Order',
      PICKUP: 'Store Pickup',
      DINE_IN: 'In-Store Order'
    }
  }
  
  return typeMap[businessType]?.[type.toUpperCase()] || `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Order`
}