import { buildWaMeUrlWithText } from '@/lib/whatsapp-wa-me-url'

/** Default follow-up line per locale (matches OrderDetails WhatsApp locales: en, el, es, sq). */
const MIX_DEFAULT_TEMPLATES: Record<string, string> = {
  en: 'Quick follow-up on order #{orderNumber} via WaveOrder — {businessName}',
  el: 'Σύντομη επαφή για την παραγγελία #{orderNumber} μέσω WaveOrder — {businessName}',
  es: 'Seguimiento rápido del pedido #{orderNumber} con WaveOrder — {businessName}',
  sq: 'Ndjekje e shpejtë e porosisë #{orderNumber} përmes WaveOrder — {businessName}',
}

/** Same normalization as admin OrderDetails customer WhatsApp (gr→el, al→sq). */
export function resolveMixFollowUpLanguage(
  language: string | null | undefined,
  translateContentToBusinessLanguage?: boolean | null
): string {
  if (translateContentToBusinessLanguage === false) return 'en'
  const raw = language || 'en'
  const normalized = raw === 'gr' ? 'el' : raw === 'al' ? 'sq' : raw
  return MIX_DEFAULT_TEMPLATES[normalized] ? normalized : 'en'
}

export function getDefaultMixFollowUpTemplate(language: string): string {
  return MIX_DEFAULT_TEMPLATES[language] ?? MIX_DEFAULT_TEMPLATES.en
}

export const DEFAULT_MIX_FOLLOW_UP_TEMPLATE = MIX_DEFAULT_TEMPLATES.en

export function renderMixFollowUpMessage(
  template: string | null | undefined,
  ctx: { orderNumber: string | number; businessName: string; orderId: string },
  opts?: { language?: string }
): string {
  const lang = opts?.language ?? 'en'
  const fallback = getDefaultMixFollowUpTemplate(lang)
  const t = template?.trim() ? template.trim() : fallback
  return t
    .replace(/\{orderNumber\}/g, String(ctx.orderNumber))
    .replace(/\{businessName\}/g, ctx.businessName)
    .replace(/\{orderId\}/g, ctx.orderId)
}

export function buildCustomerFollowUpWhatsappUrl(
  businessWhatsAppNumber: string,
  template: string | null | undefined,
  ctx: { orderNumber: string | number; businessName: string; orderId: string },
  opts?: { language?: string }
): string {
  const message = renderMixFollowUpMessage(template, ctx, opts)
  return buildWaMeUrlWithText(businessWhatsAppNumber, message)
}
