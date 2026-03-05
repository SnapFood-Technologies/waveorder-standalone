/**
 * WaveOrder Flows - Shared utilities for WhatsApp webhook, contacts, etc.
 */

/**
 * Normalize phone number for matching (E.164 style).
 * Strips whatsapp: prefix and non-digits except +, ensures starts with +.
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/^whatsapp:/i, '').replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  return cleaned
}
