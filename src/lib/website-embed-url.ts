/**
 * Build storefront URLs for the website embed tool.
 * Always includes embed_waveorder=1 so VisitorSession can attribute traffic.
 */
export function buildWebsiteEmbedOrderUrl(
  baseUrl: string,
  slug: string,
  utm: { source?: string; medium?: string; campaign?: string }
): string {
  const root = baseUrl.replace(/\/$/, '')
  const u = new URL(`${root}/${encodeURIComponent(slug)}`)
  u.searchParams.set('embed_waveorder', '1')
  if (utm.source?.trim()) u.searchParams.set('utm_source', utm.source.trim())
  if (utm.medium?.trim()) u.searchParams.set('utm_medium', utm.medium.trim())
  if (utm.campaign?.trim()) u.searchParams.set('utm_campaign', utm.campaign.trim())
  return u.toString()
}

export function getPublicSiteBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  }
  return 'https://waveorder.app'
}
