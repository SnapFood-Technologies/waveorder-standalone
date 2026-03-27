/**
 * Build wa.me URLs to a business WhatsApp (same rules as storefront order flow).
 */
export function formatWhatsAppNumberForWaMe(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
  if (cleanNumber.startsWith('1') && cleanNumber.length === 11) return cleanNumber
  if (cleanNumber.startsWith('355') && cleanNumber.length >= 11) return cleanNumber
  if (cleanNumber.startsWith('30') && cleanNumber.length >= 12) return cleanNumber
  if (cleanNumber.startsWith('39') && cleanNumber.length >= 11) return cleanNumber
  if (cleanNumber.startsWith('34') && cleanNumber.length >= 11) return cleanNumber
  return cleanNumber
}

export function buildWaMeUrlWithText(phoneNumber: string, text: string): string {
  const n = formatWhatsAppNumberForWaMe(phoneNumber)
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}
