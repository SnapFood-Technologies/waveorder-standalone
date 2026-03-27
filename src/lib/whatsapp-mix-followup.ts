import { buildWaMeUrlWithText } from '@/lib/whatsapp-wa-me-url'

export const DEFAULT_MIX_FOLLOW_UP_TEMPLATE =
  'Quick follow-up on order #{orderNumber} via WaveOrder — {businessName}'

export function renderMixFollowUpMessage(
  template: string | null | undefined,
  ctx: { orderNumber: string | number; businessName: string; orderId: string }
): string {
  const t = template?.trim() ? template.trim() : DEFAULT_MIX_FOLLOW_UP_TEMPLATE
  return t
    .replace(/\{orderNumber\}/g, String(ctx.orderNumber))
    .replace(/\{businessName\}/g, ctx.businessName)
    .replace(/\{orderId\}/g, ctx.orderId)
}

export function buildCustomerFollowUpWhatsappUrl(
  businessWhatsAppNumber: string,
  template: string | null | undefined,
  ctx: { orderNumber: string | number; businessName: string; orderId: string }
): string {
  const message = renderMixFollowUpMessage(template, ctx)
  return buildWaMeUrlWithText(businessWhatsAppNumber, message)
}
