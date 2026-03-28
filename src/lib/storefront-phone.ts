/**
 * Storefront checkout phone completeness rules (must match customer UX expectations).
 * Used by storefront validation and the order API so UI and server agree.
 */
export function isStorefrontPhoneComplete(phone: string): boolean {
  if (!phone) return false

  const cleanPhone = phone.replace(/[^\d+]/g, '')

  if (cleanPhone.startsWith('+355')) {
    return cleanPhone.length >= 13
  }
  if (cleanPhone.startsWith('+30')) {
    return cleanPhone.length >= 13
  }
  if (cleanPhone.startsWith('+39')) {
    return cleanPhone.length >= 12
  }
  if (cleanPhone.startsWith('+34')) {
    return cleanPhone.length >= 12
  }
  if (cleanPhone.startsWith('+383')) {
    return cleanPhone.length >= 12
  }
  if (cleanPhone.startsWith('+389')) {
    return cleanPhone.length >= 12
  }
  if (cleanPhone.startsWith('+973')) {
    return cleanPhone.length >= 12
  }
  if (cleanPhone.startsWith('+44')) {
    return cleanPhone.length >= 13
  }
  if (cleanPhone.startsWith('+1246')) {
    return cleanPhone.length >= 12
  }
  if (cleanPhone.startsWith('+1')) {
    return cleanPhone.length >= 12
  }
  return cleanPhone.length >= 11
}
