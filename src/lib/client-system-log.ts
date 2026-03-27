'use client'

/**
 * Log when customer is sent to WhatsApp after order (classic or mix follow-up).
 * Uses POST /api/log/client → system logs (full page URL in request body).
 */
export function logStorefrontWhatsAppOrderRedirect(params: {
  slug: string
  businessId?: string
  orderId?: string
  orderNumber?: string | number
  variant: 'classic_wa_me' | 'mix_follow_up'
}): void {
  if (typeof window === 'undefined') return
  const url = window.location.href
  fetch('/api/log/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      logType: 'storefront_order_whatsapp_redirect',
      severity: 'info',
      url,
      endpoint: '/storefront/order-success',
      metadata: {
        ...params,
        source: 'storefront_order_success',
      },
    }),
  }).catch(() => {})
}
