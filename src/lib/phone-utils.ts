/**
 * Phone number normalization utilities
 * Normalizes phone numbers to a consistent format for matching
 */

/**
 * Normalizes a phone number to digits only (removes all non-numeric characters)
 * Preserves country codes and leading zeros
 * 
 * Examples:
 * "+34 630 991 824" -> "34630991824"
 * "+1 (844) 248-1465" -> "18442481465"
 * "630991824" -> "630991824"
 * 
 * @param phone - Phone number string (can include spaces, dashes, parentheses, plus signs)
 * @returns Normalized phone number (digits only)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '')
}

/**
 * Checks if two phone numbers match after normalization
 * 
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns true if normalized numbers match
 */
export function phoneNumbersMatch(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  if (!phone1 || !phone2) return false
  return normalizePhoneNumber(phone1) === normalizePhoneNumber(phone2)
}

/**
 * Validates phone number format
 * Must have at least 10 digits (international format)
 * 
 * @param phone - Phone number to validate
 * @returns true if valid
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false
  const normalized = normalizePhoneNumber(phone)
  return normalized.length >= 10 && normalized.length <= 15
}

/**
 * Formats phone number for display (optional, for better UX)
 * Currently returns normalized, but can be enhanced for country-specific formatting
 * 
 * @param phone - Phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return ''
  const normalized = normalizePhoneNumber(phone)
  
  // Basic formatting: add spacing for readability
  // Can be enhanced with country-specific formatting
  if (normalized.length >= 10) {
    // Format: +XX XXX XXX XXX
    if (normalized.length > 10) {
      // Has country code
      const countryCode = normalized.slice(0, normalized.length - 9)
      const number = normalized.slice(normalized.length - 9)
      return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
    } else {
      // No country code, format as local number
      return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`
    }
  }
  
  return normalized
}

