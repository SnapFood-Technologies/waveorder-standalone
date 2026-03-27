/**
 * Client-side visitor country for country-based catalog (must match server cookie name).
 * Used by StoreFront to pass visitorCountry on product API calls when the feature is on.
 */

export const STOREFRONT_VISITOR_COUNTRY_COOKIE = 'wo_visitor_country'

export function readCatalogVisitorIsoFromBrowser(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const q = params.get('cc') || params.get('visitorCountry')
  if (q && /^[a-zA-Z]{2}$/.test(q)) return q.toUpperCase()
  const m = document.cookie.match(
    new RegExp(`(?:^|;)\\s*${STOREFRONT_VISITOR_COUNTRY_COOKIE}=([^;]+)`)
  )
  if (!m?.[1]) return null
  const v = decodeURIComponent(m[1].trim())
  return /^[a-zA-Z]{2}$/.test(v) ? v.toUpperCase() : null
}

export function persistCatalogVisitorCookie(iso: string): void {
  if (typeof document === 'undefined') return
  const code = iso.toUpperCase().slice(0, 2)
  if (!/^[A-Z]{2}$/.test(code)) return
  document.cookie = `${STOREFRONT_VISITOR_COUNTRY_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`
}
