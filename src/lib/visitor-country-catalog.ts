/**
 * Country-based storefront catalog: allow + exclude lists per product (ISO 3166-1 alpha-2, uppercase).
 * Empty visibleCountryCodes = worldwide (subject to hiddenCountryCodes).
 *
 * Resolution order (see docs/COUNTRY_CATALOG.md): query (?cc / ?visitorCountry) on this request,
 * then async IP geolocation. No CDN/edge headers or cookie parsing on the server (deployments without
 * Cloudflare/Vercel/etc.); the client may still persist country in a cookie and send it as query on fetches.
 */

import type { NextRequest } from 'next/server'
import { getLocationFromIP, type LocationData } from '@/lib/geolocation'
import { extractIPAddress } from '@/lib/systemLog'

/** Pure rule: should this product appear for the visitor? visitor null = no filtering (show). */
export function productVisibleForVisitorCountry(
  visibleCountryCodes: string[],
  hiddenCountryCodes: string[],
  visitorIso: string | null
): boolean {
  if (!visitorIso) return true
  const v = visitorIso.toUpperCase()
  const hidden = hiddenCountryCodes.map((c) => c.toUpperCase())
  if (hidden.includes(v)) return false
  const visible = visibleCountryCodes.map((c) => c.toUpperCase())
  if (visible.length === 0) return true
  return visible.includes(v)
}

/** Merge Prisma where for Mongo: (visible empty OR has V) AND NOT (hidden has V). No-op if disabled or no visitor. */
export function mergeProductWhereVisitorCountry(
  productWhere: Record<string, unknown>,
  options: { enabled: boolean; visitorIso: string | null }
): void {
  if (!options.enabled || !options.visitorIso) return
  const v = options.visitorIso.toUpperCase().slice(0, 2)
  if (v.length !== 2) return

  const countryClause = {
    AND: [
      {
        OR: [{ visibleCountryCodes: { isEmpty: true } }, { visibleCountryCodes: { has: v } }] as const
      },
      { NOT: { hiddenCountryCodes: { has: v } } }
    ]
  }

  const existing = productWhere.AND
  if (Array.isArray(existing)) {
    productWhere.AND = [...existing, countryClause]
  } else if (existing && typeof existing === 'object') {
    productWhere.AND = [existing, countryClause]
  } else {
    productWhere.AND = [countryClause]
  }
}

function normalizeIso2(raw: string | null | undefined): string | null {
  if (!raw) return null
  const t = raw.trim()
  if (!/^[a-zA-Z]{2}$/.test(t)) return null
  return t.toUpperCase()
}

export function parseVisitorCountryFromSearchParams(searchParams: URLSearchParams): string | null {
  return normalizeIso2(searchParams.get('cc') || searchParams.get('visitorCountry'))
}

/**
 * Resolve visitor ISO code for catalog filtering.
 * Only when `countryBasedCatalogEnabled` is true (callers should gate).
 * Order: URL query (?cc / ?visitorCountry), then IP geolocation (no server-side cookie or edge headers).
 */
export async function resolveVisitorCountryIso(request: NextRequest): Promise<string | null> {
  try {
    const { searchParams } = new URL(request.url)
    const fromQuery = parseVisitorCountryFromSearchParams(searchParams)
    if (fromQuery) return fromQuery

    const ip = extractIPAddress(request)
    if (!ip) return null
    const loc = await getLocationFromIP(ip)
    return loc?.countryCode?.toUpperCase().slice(0, 2) ?? null
  } catch {
    return null
  }
}

export function visitorCountryFromLocationData(loc: LocationData | null): string | null {
  return loc?.countryCode?.toUpperCase().slice(0, 2) ?? null
}

/** Normalize admin/API input: only valid ISO2 codes, uppercase, deduped. Undefined if field omitted. */
export function normalizeCountryCodeList(input: unknown): string[] | undefined {
  if (input === undefined) return undefined
  if (!Array.isArray(input)) return undefined
  const out = input
    .map((x) => String(x).trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c))
  return [...new Set(out)]
}
