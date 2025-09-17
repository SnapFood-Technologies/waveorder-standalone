import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `WO-${timestamp}-${random}`.toUpperCase()
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatWhatsAppMessage(order: any): string {
  let message = `🛍️ *New Order #${order.orderNumber}*\n\n`
  message += `👤 *Customer:* ${order.customer.name}\n`
  message += `📞 *Phone:* ${order.customer.phone}\n\n`
  
  message += `📋 *Items:*\n`
  order.items.forEach((item: any) => {
    message += `• ${item.quantity}x ${item.product.name}`
    if (item.variant) {
      message += ` (${item.variant.name})`
    }
    message += ` - ${formatCurrency(item.price * item.quantity)}\n`
  })
  
  message += `\n💰 *Total:* ${formatCurrency(order.total)}\n`
  
  if (order.type === 'DELIVERY' && order.deliveryAddress) {
    message += `🚚 *Delivery Address:* ${order.deliveryAddress}\n`
  }
  
  if (order.notes) {
    message += `📝 *Notes:* ${order.notes}\n`
  }
  
  return message
}
