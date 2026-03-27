import { describe, expect, it } from 'vitest'
import {
  CATALOG_COUNTRY_CODE_SET,
  CATALOG_COUNTRY_OPTIONS,
  filterToCatalogCountryCodes
} from '@/lib/catalog-country-options'

describe('CATALOG_COUNTRY_OPTIONS', () => {
  it('has seven countries in agreed order', () => {
    expect(CATALOG_COUNTRY_OPTIONS.map((o) => o.code)).toEqual([
      'AL',
      'GR',
      'IT',
      'ES',
      'BH',
      'BB',
      'US'
    ])
    expect(CATALOG_COUNTRY_CODE_SET.size).toBe(7)
  })
})

describe('filterToCatalogCountryCodes', () => {
  it('drops unknown codes and preserves catalog order', () => {
    expect(filterToCatalogCountryCodes(['US', 'XX', 'GR', 'FR'])).toEqual(['GR', 'US'])
  })

  it('returns empty for empty or null', () => {
    expect(filterToCatalogCountryCodes([])).toEqual([])
    expect(filterToCatalogCountryCodes(undefined)).toEqual([])
  })
})
