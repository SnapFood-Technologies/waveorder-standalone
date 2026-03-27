/**
 * Countries available for country-based catalog on products (aligned with phone/locale support).
 * Order: Albania first, then Greece, Italy, Spain, Bahrain, Barbados, US.
 */

export interface CatalogCountryOption {
  code: string
  name: string
  flag: string
}

export const CATALOG_COUNTRY_OPTIONS: CatalogCountryOption[] = [
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' }
]

const ORDER = CATALOG_COUNTRY_OPTIONS.map((o) => o.code)

export const CATALOG_COUNTRY_CODE_SET = new Set(ORDER)

/** Keep only supported codes, uppercase, deduped, in catalog display order. */
export function filterToCatalogCountryCodes(codes: string[] | undefined | null): string[] {
  if (!codes?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of ORDER) {
    if (codes.some((x) => x.toUpperCase() === c) && !seen.has(c)) {
      seen.add(c)
      out.push(c)
    }
  }
  return out
}
