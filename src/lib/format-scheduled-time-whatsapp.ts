/**
 * Format a scheduled pickup/delivery instant for WhatsApp order text.
 * Uses the business IANA timezone so server-side formatting matches the storefront
 * (StoreFront shows selected slots with timeZone: storeData.timezone).
 */
export function formatScheduledTimeForWhatsAppMessage(
  deliveryTime: string | Date | null | undefined,
  locale: string,
  businessTimezone: string | null | undefined
): string {
  if (deliveryTime == null || deliveryTime === '') return ''
  const d = new Date(deliveryTime as string | Date)
  if (Number.isNaN(d.getTime())) return String(deliveryTime)
  const tz = (businessTimezone && String(businessTimezone).trim()) || 'UTC'
  try {
    return d.toLocaleString(locale, { timeZone: tz })
  } catch {
    return d.toLocaleString(locale, { timeZone: 'UTC' })
  }
}
