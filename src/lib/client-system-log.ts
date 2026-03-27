'use client'

/**
 * Log when merchant copies embed link/HTML/script (Admin → Marketing → Embedded).
 */
export function logWebsiteEmbedCopy(params: {
  businessId: string
  slug: string
  copyKind: 'url' | 'html' | 'script'
}): void {
  if (typeof window === 'undefined') return
  fetch('/api/log/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      logType: 'website_embed_copy',
      severity: 'info',
      url: window.location.href,
      endpoint: '/admin/marketing/embedded',
      metadata: {
        ...params,
        source: 'admin_embed_marketing',
      },
    }),
  }).catch(() => {})
}

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
